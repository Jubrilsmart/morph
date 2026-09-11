import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument } from 'pdf-lib'
import { imagesToPdf, mergePdfs, rotatePdf, splitPdf } from '@/lib/engines/pdf'
import { EngineError } from '@/lib/engines/types'
import type { ProgressCallback } from '@/lib/engines/types'

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '../fixtures')

const loadFixture = (name: string, type: string): File =>
  new File([fs.readFileSync(path.join(fixtures, name))], name, { type })

const pdfOf = async (blob: Blob): Promise<PDFDocument> =>
  PDFDocument.load(new Uint8Array(await blob.arrayBuffer()), { ignoreEncryption: true })

const noopProgress: ProgressCallback = () => {}

describe('mergePdfs (integration)', () => {
  it('merges two PDFs into one, preserving all pages', async () => {
    const a = loadFixture('test-a.pdf', 'application/pdf') // 3 pages
    const b = loadFixture('test-b.pdf', 'application/pdf') // 2 pages

    const outputs = await mergePdfs([a, b], noopProgress)

    expect(outputs).toHaveLength(1)
    expect(outputs[0].name).toBe('merged.pdf')
    const merged = await pdfOf(outputs[0].blob)
    expect(merged.getPageCount()).toBe(5)
  })

  it('reports per-file progress', async () => {
    const a = loadFixture('test-a.pdf', 'application/pdf')
    const b = loadFixture('test-b.pdf', 'application/pdf')
    const seen: Array<{ index: number; progress: number; message?: string }> = []

    await mergePdfs([a, b], (index, progress, message) => seen.push({ index, progress, message }))

    const merging = seen.filter((s) => s.message?.startsWith('Merging'))
    expect(merging.map((s) => s.index)).toEqual([0, 1])
    // Engine progress convention: 0–9 reading, 10–19 loaded, 20+ processing.
    expect(merging.every((s) => s.progress >= 20)).toBe(true)
  })

  it('refuses to merge fewer than two PDFs', async () => {
    const a = loadFixture('test-a.pdf', 'application/pdf')
    await expect(mergePdfs([a], noopProgress)).rejects.toThrow(EngineError)
  })
})

describe('splitPdf (integration)', () => {
  it('splits every page into its own file', async () => {
    const outputs = await splitPdf([loadFixture('test-a.pdf', 'application/pdf')], { mode: 'each', ranges: '' }, noopProgress)

    expect(outputs).toHaveLength(3)
    for (let i = 0; i < 3; i++) {
      expect(outputs[i].name).toBe(`test-a-page-${i + 1}.pdf`)
      expect((await pdfOf(outputs[i].blob)).getPageCount()).toBe(1)
    }
  })

  it('splits by ranges and names the parts by their page span', async () => {
    const outputs = await splitPdf(
      [loadFixture('test-a.pdf', 'application/pdf')],
      { mode: 'ranges', ranges: '1-2,3' },
      noopProgress
    )

    expect(outputs.map((o) => o.name)).toEqual(['test-a-pages-1-2.pdf', 'test-a-page-3.pdf'])
    expect((await pdfOf(outputs[0].blob)).getPageCount()).toBe(2)
    expect((await pdfOf(outputs[1].blob)).getPageCount()).toBe(1)
  })

  it('rejects ranges beyond the page count', async () => {
    await expect(
      splitPdf([loadFixture('test-a.pdf', 'application/pdf')], { mode: 'ranges', ranges: '1-9' }, noopProgress)
    ).rejects.toThrow(EngineError)
  })
})

describe('rotatePdf (integration)', () => {
  it('rotates all pages by the given angle', async () => {
    const outputs = await rotatePdf(
      [loadFixture('test-a.pdf', 'application/pdf')],
      { angle: 90, pages: 'all' },
      noopProgress
    )

    expect(outputs).toHaveLength(1)
    expect(outputs[0].name).toBe('test-a.rotated.pdf')
    const doc = await pdfOf(outputs[0].blob)
    expect(doc.getPageCount()).toBe(3)
    for (const page of doc.getPages()) {
      expect(page.getRotation().angle).toBe(90)
    }
  })

  it('rotates only odd pages when asked', async () => {
    const outputs = await rotatePdf(
      [loadFixture('test-a.pdf', 'application/pdf')],
      { angle: 180, pages: 'odd' },
      noopProgress
    )
    const doc = await pdfOf(outputs[0].blob)
    doc.getPages().forEach((page, i) => {
      expect(page.getRotation().angle).toBe(i % 2 === 0 ? 180 : 0)
    })
  })
})

describe('imagesToPdf (integration)', () => {
  it('embeds a PNG as a single-page PDF without a canvas', async () => {
    const outputs = await imagesToPdf(
      [loadFixture('sample-image.png', 'image/png')],
      { pageSize: 'auto', margin: 0 },
      noopProgress
    )

    expect(outputs).toHaveLength(1)
    expect(outputs[0].name).toBe('morph-export.pdf')
    expect(outputs[0].blob.type).toBe('application/pdf')
    expect((await pdfOf(outputs[0].blob)).getPageCount()).toBe(1)
  })
})

describe('engine progress convention', () => {
  it('walks reading → loaded → processing in order', async () => {
    const events: Array<{ index: number; progress: number }> = []
    const onProgress: ProgressCallback = (index, progress) => events.push({ index, progress })

    await mergePdfs(
      [loadFixture('test-a.pdf', 'application/pdf'), loadFixture('test-b.pdf', 'application/pdf')],
      onProgress
    )

    // Reading (<=9) must be reported before loaded (10–19), before processing (>=20).
    const first = (predicate: (p: number) => boolean) =>
      events.findIndex((e) => predicate(e.progress))
    expect(first((p) => p <= 9)).toBeGreaterThanOrEqual(0)
    expect(first((p) => p <= 9)).toBeLessThan(first((p) => p >= 10 && p < 20))
    expect(first((p) => p >= 10 && p < 20)).toBeLessThan(first((p) => p >= 20))
    // Progress never decreases for the same file.
    for (let i = 1; i < events.length; i++) {
      if (events[i].index === events[i - 1].index) {
        expect(events[i].progress).toBeGreaterThanOrEqual(events[i - 1].progress)
      }
    }
  })
})
