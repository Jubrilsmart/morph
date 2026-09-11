import { describe, it, expect } from 'vitest'
import { formatBytes, replaceExtension } from '@/lib/format'

describe('formatBytes', () => {
  it('formats zero', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats bytes without a decimal', () => {
    expect(formatBytes(512)).toBe('512 B')
  })

  it('formats kilobytes with one decimal', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  it('rounds values of 100 and above', () => {
    expect(formatBytes(1024 * 100)).toBe('100 KB')
  })

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
    expect(formatBytes(4.5 * 1024 * 1024)).toBe('4.5 MB')
  })

  it('caps at gigabytes', () => {
    expect(formatBytes(1024 ** 4)).toBe('1024 GB')
  })

  it('returns a dash for non-finite input', () => {
    expect(formatBytes(Number.NaN)).toBe('—')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—')
  })
})

describe('replaceExtension', () => {
  it('replaces a simple extension', () => {
    expect(replaceExtension('photo.png', 'jpg')).toBe('photo.jpg')
  })

  it('replaces only the last extension', () => {
    expect(replaceExtension('archive.tar.gz', 'zip')).toBe('archive.tar.zip')
  })

  it('keeps multi-part output extensions', () => {
    expect(replaceExtension('clip.mp4', 'compressed.mp4')).toBe('clip.compressed.mp4')
  })

  it('appends when there is no extension', () => {
    expect(replaceExtension('README', 'pdf')).toBe('README.pdf')
  })

  it('handles names containing dots in folders', () => {
    expect(replaceExtension('my.file.name.webm', 'mp4')).toBe('my.file.name.mp4')
  })
})
