import { EngineError, type ProgressCallback } from './types'

/**
 * Shared ffmpeg.wasm plumbing used by the video and audio engines:
 * singleton core loading plus a crash-hardened exec wrapper.
 *
 * The self-hosted @ffmpeg/core (0.12.10, both single- and multi-thread
 * builds) has a broken libvpx: encoding with libvpx-vp9 traps with
 * "RuntimeError: memory access out of bounds" after a few dozen frames.
 * When that happens:
 *   - the class worker rejects exec with a *string* (e.toString()), not an
 *     Error, so error handling that only checks instanceof Error loses the
 *     message;
 *   - or a dead pthread leaves the exec promise pending forever — the UI
 *     would spin on the last step indefinitely;
 *   - the worker skips the core's reset() on failure, so the shared
 *     instance stays poisoned and every later run in the tab hangs.
 * execFfmpeg below defends against all three.
 */

const SINGLE_THREAD_BASE = '/ffmpeg/single'
const MULTI_THREAD_BASE = '/ffmpeg/mt'

type FFmpeg = import('@ffmpeg/ffmpeg').FFmpeg

let ffmpeg: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

/**
 * Loads the self-hosted ffmpeg.wasm core once. Uses the multi-threaded core
 * when the page is cross-origin isolated (COOP/COEP headers set in
 * next.config.ts), falling back to the single-threaded core otherwise.
 * A terminated instance (see execFfmpeg) is reloaded transparently.
 */
export async function getFfmpeg(onStatus: (message: string) => void): Promise<FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg
  // The cached instance is dead or was terminated after a crash — drop it.
  ffmpeg = null
  if (!loading) {
    loading = (async () => {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const { toBlobURL } = await import('@ffmpeg/util')

      const multiThread = typeof window !== 'undefined' && window.crossOriginIsolated
      const base = multiThread ? MULTI_THREAD_BASE : SINGLE_THREAD_BASE
      onStatus(multiThread ? 'Loading multi-thread engine…' : 'Loading engine…')

      const instance = new FFmpeg()
      const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript')
      const wasmURL = await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm')
      if (multiThread) {
        const workerURL = await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript')
        await instance.load({ coreURL, wasmURL, workerURL })
      } else {
        await instance.load({ coreURL, wasmURL })
      }
      return instance
    })().finally(() => {
      // Allow a fresh load on the next call (retry after failure/terminate).
      loading = null
    })
  }
  try {
    ffmpeg = await loading
  } catch (error) {
    // loading was already cleared by the finally above — a retry reloads.
    const cause = toEngineError(error)
    throw new EngineError(`Could not load the conversion engine. ${cause.message}`)
  }
  return ffmpeg
}

/** Kill the shared instance so the next run reloads a fresh core. */
export function resetFfmpeg() {
  if (ffmpeg) {
    try {
      ffmpeg.terminate()
    } catch {
      // worker already gone — nothing to do
    }
  }
  ffmpeg = null
  loading = null
}

/** Maps a raw ffmpeg.wasm rejection (often a plain string) to a readable error. */
export function toEngineError(error: unknown): EngineError {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  if (/memory access out of bounds|out of memory|abort\(oom\)/i.test(raw)) {
    return new EngineError(
      'The engine ran out of memory processing this file. Try a smaller resolution, a shorter clip or a different output format.'
    )
  }
  if (raw) return new EngineError(raw.replace(/^Error:\s*/, ''))
  return new EngineError('The engine could not process this file.')
}

export interface ExecFfmpegOptions {
  /** Overall progress reported for the processing step (20–99 convention). */
  message?: string
  /** Silence threshold before the run is considered hung. */
  watchdogMs?: number
}

/**
 * Runs one ffmpeg command with progress reporting and crash recovery.
 * `instance.exec` is raced against an inactivity watchdog (no log or
 * progress events for `watchdogMs`), and any thrown/hung run terminates the
 * poisoned worker so subsequent conversions start from a fresh core.
 */
export async function execFfmpeg(
  instance: FFmpeg,
  args: string[],
  fileIndex: number,
  onProgress: ProgressCallback,
  { message, watchdogMs = 60_000 }: ExecFfmpegOptions = {}
): Promise<void> {
  let lastActivity = Date.now()
  const onTouch = () => {
    lastActivity = Date.now()
  }
  const onLog = () => onTouch()
  const onProgressEvent = ({ progress }: { progress: number }) => {
    onTouch()
    const clamped = Math.min(1, Math.max(0, progress || 0))
    onProgress(fileIndex, 20 + clamped * 79, message)
  }
  instance.on('log', onLog)
  instance.on('progress', onProgressEvent)

  // Poll often enough for short watchdogs (tests) without busy-looping long ones.
  const pollMs = Math.max(50, Math.min(2_000, Math.floor(watchdogMs / 4)))
  let watchdog: ReturnType<typeof setInterval> | undefined
  const expired = new Promise<never>((_, reject) => {
    watchdog = setInterval(() => {
      if (Date.now() - lastActivity > watchdogMs) {
        reject(new EngineError('The engine stopped responding while processing this file.'))
      }
    }, pollMs)
  })

  let exitCode: number
  try {
    exitCode = await Promise.race([instance.exec(args), expired])
  } catch (error) {
    // Crashed or hung: the core is in an unknown state (its reset() was
    // skipped), so kill the worker instead of reusing it.
    if (ffmpeg === instance) resetFfmpeg()
    else {
      try {
        instance.terminate()
      } catch {
        // already gone
      }
    }
    throw toEngineError(error)
  } finally {
    if (watchdog !== undefined) clearInterval(watchdog)
    instance.off('log', onLog)
    instance.off('progress', onProgressEvent)
  }
  // A clean non-zero exit still runs the core's reset(), so the instance
  // stays usable — no need to terminate.
  if (exitCode !== 0) throw new EngineError('The engine could not process this file.')
}
