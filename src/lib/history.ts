import type { OutputFile } from './engines/types'

/**
 * Recent-conversions store: metadata in IndexedDB, output bytes in OPFS
 * (Origin Private File System — a real persistent filesystem the browser
 * gives us on the user's disk), settings in localStorage. Everything stays
 * on the device.
 *
 * Storage failures are never fatal to a run: if OPFS is unavailable (old
 * browser) or a write fails, the record is kept with `stored: false` and
 * Recent shows it as activity without download/open actions.
 */

export interface HistoryRecord {
  id: string
  /** Registry tool id, e.g. "video-converter" — empty when unknown. */
  toolId: string
  toolTitle: string
  toolHref: string
  inputName: string
  outputName: string
  mime: string
  size: number
  createdAt: number
  /** Whether the output bytes are still in OPFS. */
  stored: boolean
}

export interface MorphSettings {
  /** Keep output bytes in OPFS so Recent can re-serve them. */
  keepOutputs: boolean
  /** Max number of recent records retained. */
  maxEntries: number
  /** Max total stored bytes retained (oldest evicted first). */
  maxBytes: number
}

export const DEFAULT_SETTINGS: MorphSettings = {
  keepOutputs: true,
  maxEntries: 25,
  maxBytes: 512 * 1024 * 1024,
}

export const MAX_ENTRIES_CHOICES = [10, 25, 50, 100]
export const MAX_BYTES_CHOICES = [
  { value: 100 * 1024 * 1024, label: '100 MB' },
  { value: 512 * 1024 * 1024, label: '500 MB' },
  { value: 1024 * 1024 * 1024, label: '1 GB' },
  { value: 2 * 1024 * 1024 * 1024, label: '2 GB' },
]

const SETTINGS_KEY = 'morph-settings'

export function getSettings(): MorphSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function normalizeSettings(value: unknown): MorphSettings {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Partial<MorphSettings>
  const clamp = (n: unknown, fallback: number) =>
    typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : fallback
  return {
    keepOutputs: typeof raw.keepOutputs === 'boolean' ? raw.keepOutputs : DEFAULT_SETTINGS.keepOutputs,
    maxEntries: Math.round(clamp(raw.maxEntries, DEFAULT_SETTINGS.maxEntries)),
    maxBytes: clamp(raw.maxBytes, DEFAULT_SETTINGS.maxBytes),
  }
}

export function saveSettings(settings: MorphSettings) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  // Apply the new retention bounds immediately.
  void enforceRetention()
}

/**
 * Pure eviction policy, exported for unit tests: given records newest-first,
 * returns the records that must be deleted to satisfy the retention bounds.
 * Records with `stored: false` still count as history but consume no bytes.
 */
export function pickEvictions(
  records: HistoryRecord[],
  maxEntries: number,
  maxBytes: number
): HistoryRecord[] {
  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt)
  const evict = new Set<HistoryRecord>()
  let storedBytes = 0
  sorted.forEach((record, index) => {
    if (index >= maxEntries) {
      evict.add(record)
      return
    }
    if (record.stored) {
      storedBytes += record.size
      if (storedBytes > maxBytes) evict.add(record)
    }
  })
  return sorted.filter((record) => evict.has(record))
}

// --- IndexedDB (metadata) ---------------------------------------------------

const DB_NAME = 'morph-history'
const DB_VERSION = 1
const STORE = 'records'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx(db: IDBDatabase, mode: IDBTransactionMode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function listHistory(): Promise<HistoryRecord[]> {
  try {
    const db = await openDb()
    const all = await requestToPromise(tx(db, 'readonly').getAll() as IDBRequest<HistoryRecord[]>)
    db.close()
    return all.sort((a, b) => b.createdAt - a.createdAt)
  } catch {
    return []
  }
}

async function putRecord(record: HistoryRecord) {
  const db = await openDb()
  await requestToPromise(tx(db, 'readwrite').put(record))
  db.close()
}

async function deleteRecords(ids: string[]) {
  const db = await openDb()
  const store = tx(db, 'readwrite')
  await Promise.all(ids.map((id) => requestToPromise(store.delete(id))))
  db.close()
}

// --- OPFS (output bytes) ------------------------------------------------------

const OPFS_DIR = 'outputs'

async function opfsDir(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return null
    return await navigator.storage.getDirectory()
  } catch {
    return null
  }
}

async function writeOutputFile(id: string, bytes: Blob): Promise<boolean> {
  const root = await opfsDir()
  if (!root) return false
  try {
    const dir = await root.getDirectoryHandle(OPFS_DIR, { create: true })
    const handle = await dir.getFileHandle(id, { create: true })
    // createWritable is Chromium-only; Safari/Firefox support OPFS writes
    // solely from dedicated workers. There the record degrades to
    // metadata-only history — acceptable, and the e2e suite covers the
    // writable path.
    const writable = await (handle as FileSystemFileHandle & {
      createWritable?: () => Promise<FileSystemWritableFileStream>
    }).createWritable?.()
    if (!writable) return false
    await writable.write(bytes)
    await writable.close()
    return true
  } catch {
    return false
  }
}

export async function readOutputFile(id: string): Promise<Blob | null> {
  const root = await opfsDir()
  if (!root) return null
  try {
    const dir = await root.getDirectoryHandle(OPFS_DIR)
    const handle = await dir.getFileHandle(id)
    return await handle.getFile()
  } catch {
    return null
  }
}

async function deleteOutputFiles(ids: string[]) {
  const root = await opfsDir()
  if (!root) return
  try {
    const dir = await root.getDirectoryHandle(OPFS_DIR)
    await Promise.all(ids.map((id) => dir.removeEntry(id).catch(() => {})))
  } catch {
    // directory never existed — nothing to remove
  }
}

// --- public API ---------------------------------------------------------------

export interface RunMeta {
  toolId: string
  toolTitle: string
  toolHref: string
}

/**
 * Records a finished run: one HistoryRecord per output, bytes written to
 * OPFS when the settings allow it, then retention enforced. Best-effort —
 * any failure resolves silently so it can never break a conversion.
 *
 * Metadata is written before the (larger, slower) OPFS bytes so the Recent
 * page reflects the run even if the user navigates away mid-write.
 */
export async function recordRun(
  meta: RunMeta,
  inputs: File[],
  outputs: OutputFile[],
  settings = getSettings()
): Promise<void> {
  try {
    // Pass 1: commit all metadata records (small, fast, transactional).
    const records: HistoryRecord[] = outputs.map((output, i) => ({
      id: `out-${crypto.randomUUID()}`,
      toolId: meta.toolId,
      toolTitle: meta.toolTitle,
      toolHref: meta.toolHref,
      inputName: inputs[i]?.name ?? inputs[0]?.name ?? '',
      outputName: output.name,
      mime: output.blob.type,
      size: output.blob.size,
      createdAt: Date.now() + i, // keep a stable order within one run
      stored: false, // updated below once bytes are on disk
    }))
    for (const record of records) {
      await putRecord(record)
    }

    // Pass 2: write output bytes and flip each record to `stored`.
    if (settings.keepOutputs) {
      for (let i = 0; i < records.length; i++) {
        const output = outputs[i]
        if (output.blob.size === 0) continue
        const ok = await writeOutputFile(records[i].id, output.blob)
        if (ok) {
          await putRecord({ ...records[i], stored: true })
        }
      }
    }

    await enforceRetention(settings)
  } catch {
    // best-effort — a history failure must never break a conversion
  }
}

export async function enforceRetention(settings = getSettings()): Promise<void> {
  try {
    const records = await listHistory()
    const evictions = pickEvictions(records, settings.maxEntries, settings.maxBytes)
    if (evictions.length === 0) return
    await deleteRecords(evictions.map((r) => r.id))
    await deleteOutputFiles(evictions.filter((r) => r.stored).map((r) => r.id))
  } catch {
    // best-effort
  }
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  await deleteRecords([id]).catch(() => {})
  await deleteOutputFiles([id]).catch(() => {})
}

export async function clearHistory(): Promise<void> {
  const records = await listHistory()
  await deleteRecords(records.map((r) => r.id)).catch(() => {})
  await deleteOutputFiles(records.map((r) => r.id)).catch(() => {})
}

export interface StorageUsage {
  usage: number
  quota: number
  persisted: boolean
}

export async function storageUsage(): Promise<StorageUsage> {
  const empty: StorageUsage = { usage: 0, quota: 0, persisted: false }
  try {
    const estimate = (await navigator.storage?.estimate?.()) ?? {}
    const persisted = (await navigator.storage?.persisted?.()) ?? false
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
      persisted,
    }
  } catch {
    return empty
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  try {
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
