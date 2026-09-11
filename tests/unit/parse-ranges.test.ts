import { describe, it, expect } from 'vitest'
import { parseRanges } from '@/lib/engines/pdf'
import { EngineError } from '@/lib/engines/types'

describe('parseRanges', () => {
  it('parses a single page', () => {
    expect(parseRanges('2', 5)).toEqual([[2]])
  })

  it('parses a comma-separated list', () => {
    expect(parseRanges('1,3,5', 5)).toEqual([[1], [3], [5]])
  })

  it('parses a range', () => {
    expect(parseRanges('2-4', 5)).toEqual([[2, 3, 4]])
  })

  it('mixes pages and ranges', () => {
    expect(parseRanges('1-2,5', 5)).toEqual([[1, 2], [5]])
  })

  it('tolerates whitespace and empty parts', () => {
    expect(parseRanges(' 1 , , 3 ', 5)).toEqual([[1], [3]])
    expect(parseRanges('1 - 3', 5)).toEqual([[1, 2, 3]])
  })

  it('treats a single number as a one-page range', () => {
    expect(parseRanges('4-4', 5)).toEqual([[4]])
  })

  it('rejects non-numeric input', () => {
    expect(() => parseRanges('abc', 5)).toThrow(EngineError)
    expect(() => parseRanges('1.5', 5)).toThrow(EngineError)
  })

  it('rejects out-of-bounds pages', () => {
    expect(() => parseRanges('0', 3)).toThrow(EngineError)
    expect(() => parseRanges('4', 3)).toThrow(EngineError)
    expect(() => parseRanges('2-6', 3)).toThrow(EngineError)
  })

  it('rejects reversed ranges', () => {
    expect(() => parseRanges('5-2', 5)).toThrow(EngineError)
  })

  it('rejects empty input', () => {
    expect(() => parseRanges('', 3)).toThrow(EngineError)
    expect(() => parseRanges(' , , ', 3)).toThrow(EngineError)
  })

  it('includes the offending part in the error message', () => {
    expect(() => parseRanges('9', 3)).toThrow(/"9"/)
  })
})
