import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
  pickEvictions,
  type HistoryRecord,
} from '@/lib/history'

function record(overrides: Partial<HistoryRecord> = {}): HistoryRecord {
  return {
    id: crypto.randomUUID(),
    toolId: 'video-converter',
    toolTitle: 'Video Converter',
    toolHref: '/tools/video/converter',
    inputName: 'input.mp4',
    outputName: 'output.mp4',
    mime: 'video/mp4',
    size: 1000,
    createdAt: 0,
    stored: true,
    ...overrides,
  }
}

describe('normalizeSettings', () => {
  it('returns defaults for null/garbage input', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('nonsense')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid values and repairs invalid ones', () => {
    expect(
      normalizeSettings({ keepOutputs: false, maxEntries: 50, maxBytes: 1024 })
    ).toEqual({ keepOutputs: false, maxEntries: 50, maxBytes: 1024 })
    expect(normalizeSettings({ maxEntries: -5, maxBytes: 'big' })).toEqual({
      keepOutputs: true,
      maxEntries: DEFAULT_SETTINGS.maxEntries,
      maxBytes: DEFAULT_SETTINGS.maxBytes,
    })
  })
})

describe('pickEvictions', () => {
  it('keeps everything when under both limits', () => {
    const records = [record({ createdAt: 3 }), record({ createdAt: 2 }), record({ createdAt: 1 })]
    expect(pickEvictions(records, 25, 512 * 1024 * 1024)).toEqual([])
  })

  it('evicts the oldest records beyond the entry limit', () => {
    const newest = record({ createdAt: 30 })
    const middle = record({ createdAt: 20 })
    const oldest = record({ createdAt: 10 })
    const evictions = pickEvictions([oldest, newest, middle], 2, Infinity)
    expect(evictions).toEqual([oldest])
  })

  it('evicts oldest first when the size budget is exceeded', () => {
    // 600 bytes total, budget 500: the oldest 100-byte record must go.
    const a = record({ createdAt: 1, size: 100 })
    const b = record({ createdAt: 2, size: 200 })
    const c = record({ createdAt: 3, size: 300 })
    expect(pickEvictions([c, b, a], 10, 500)).toEqual([a])
  })

  it('keeps evicting until the remaining records fit the budget', () => {
    const a = record({ createdAt: 1, size: 400 })
    const b = record({ createdAt: 2, size: 400 })
    const c = record({ createdAt: 3, size: 400 })
    // budget 500: c (400) fits, adding b (800) overflows → b evicted, adding a overflows → evicted
    expect(pickEvictions([a, b, c], 10, 500)).toEqual([b, a])
  })

  it('ignores the size of records that have no stored bytes', () => {
    const metadataOnly = record({ createdAt: 1, size: 10_000_000, stored: false })
    const fresh = record({ createdAt: 2, size: 400 })
    expect(pickEvictions([fresh, metadataOnly], 10, 500)).toEqual([])
  })

  it('handles empty input', () => {
    expect(pickEvictions([], 25, 512 * 1024 * 1024)).toEqual([])
  })
})
