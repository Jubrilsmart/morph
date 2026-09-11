import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

async function loadPdfLib() {
  return import('pdf-lib')
}

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  return pdfjs
}

async function loadPdf(file: File) {
  const pdfjs = await loadPdfJs()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  return { pdfjs, doc }
}

// ---------- Image to PDF ----------

export interface ImagesToPdfOptions {
  pageSize: 'auto' | 'a4'
  margin: number // px, a4 mode only
}

export async function imagesToPdf(
  files: File[],
  options: ImagesToPdfOptions,
  onProgress: ProgressCallback
) {
  const { PDFDocument } = await loadPdfLib()
  const doc = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    onProgress(i, 5, 'Reading image…')
    let bytes = new Uint8Array(await files[i].arrayBuffer())
    let isPng = files[i].type === 'image/png' || files[i].name.toLowerCase().endsWith('.png')
    const isJpg = files[i].type === 'image/jpeg' || /\.(jpe?g)$/i.test(files[i].name)

    // pdf-lib only embeds PNG/JPEG — re-encode anything else (webp, avif, …) to PNG
    if (!isPng && !isJpg) {
      onProgress(i, 40, 'Re-encoding to PNG…')
      const bitmap = await createImageBitmap(files[i])
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
      bitmap.close()
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new EngineError(`Could not process ${files[i].name}.`)
      bytes = new Uint8Array(await blob.arrayBuffer())
      isPng = true
    }

    onProgress(i, 15, 'Loaded')
    onProgress(i, 70, 'Embedding…')
    const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes)

    const A4 = { width: 595.28, height: 841.89 }
    if (options.pageSize === 'auto') {
      // Render at image size, 96dpi px → pt
      const page = doc.addPage([image.width * 0.75, image.height * 0.75])
      page.drawImage(image, { x: 0, y: 0, width: image.width * 0.75, height: image.height * 0.75 })
    } else {
      const page = doc.addPage([A4.width, A4.height])
      const marginPt = options.margin * 0.75
      const scale = Math.min(
        (A4.width - marginPt * 2) / image.width,
        (A4.height - marginPt * 2) / image.height
      )
      const width = image.width * scale
      const height = image.height * scale
      page.drawImage(image, {
        x: (A4.width - width) / 2,
        y: (A4.height - height) / 2,
        width,
        height,
      })
    }
    onProgress(i, 100)
  }

  const bytes = await doc.save()
  return [{ name: 'morph-export.pdf', blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }) }]
}

// ---------- PDF to Image ----------

export interface PdfToImageOptions {
  format: 'image/png' | 'image/jpeg'
  quality: number
  scale: number
}

export async function pdfToImages(
  files: File[],
  options: PdfToImageOptions,
  onProgress: ProgressCallback
) {
  if (files.length !== 1) throw new EngineError('PDF to Image works with a single PDF at a time.')
  onProgress(0, 5, 'Reading PDF…')
  const { doc } = await loadPdf(files[0])
  onProgress(0, 15, 'Loaded')
  const outputs = []
  const extension = options.format === 'image/png' ? 'png' : 'jpg'

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    onProgress(0, 20 + Math.round(((pageNumber - 1) / doc.numPages) * 80), `Rendering page ${pageNumber}…`)
    const page = await doc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: options.scale })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new EngineError('Could not create a 2D canvas context.')
    if (options.format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    await page.render({ canvas, canvasContext: ctx, viewport }).promise

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, options.format, options.quality)
    )
    if (!blob) throw new EngineError(`Could not export page ${pageNumber}.`)
    outputs.push({ name: replaceExtension(files[0].name, `page-${pageNumber}.${extension}`), blob })
  }

  onProgress(0, 100)
  return outputs
}

// ---------- Merge ----------

export async function mergePdfs(files: File[], onProgress: ProgressCallback) {
  if (files.length < 2) throw new EngineError('Select at least two PDFs to merge.')
  onProgress(0, 5, 'Reading PDFs…')
  const { PDFDocument } = await loadPdfLib()
  onProgress(0, 15, 'Loaded')
  const merged = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    onProgress(i, 20 + Math.round((i / files.length) * 80), `Merging ${files[i].name}…`)
    const source = await PDFDocument.load(await files[i].arrayBuffer(), { ignoreEncryption: true })
    const pages = await merged.copyPages(source, source.getPageIndices())
    pages.forEach((page) => merged.addPage(page))
    onProgress(i, 100)
  }

  const bytes = await merged.save()
  return [{ name: 'merged.pdf', blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }) }]
}

// ---------- Split ----------

export interface SplitOptions {
  mode: 'each' | 'ranges'
  ranges: string // "1-3,5,8-10"
}

export function parseRanges(ranges: string, pageCount: number): number[][] {
  const groups = ranges
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
      if (!match) throw new EngineError(`"${part}" is not a valid page or range.`)
      const start = Number(match[1])
      const end = match[2] ? Number(match[2]) : start
      if (start < 1 || end < start || end > pageCount) {
        throw new EngineError(`"${part}" is out of bounds (1–${pageCount}).`)
      }
      const pages: number[] = []
      for (let p = start; p <= end; p++) pages.push(p)
      return pages
    })
  if (groups.length === 0) throw new EngineError('Enter at least one page or range.')
  return groups
}

export async function splitPdf(files: File[], options: SplitOptions, onProgress: ProgressCallback) {
  if (files.length !== 1) throw new EngineError('Split works with a single PDF at a time.')
  onProgress(0, 5, 'Reading PDF…')
  const { PDFDocument } = await loadPdfLib()
  const source = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true })
  onProgress(0, 15, 'Loaded')
  const pageCount = source.getPageCount()
  const baseName = files[0].name.replace(/\.pdf$/i, '')

  const groups =
    options.mode === 'each'
      ? Array.from({ length: pageCount }, (_, i) => [i + 1])
      : parseRanges(options.ranges, pageCount)

  const outputs = []
  for (let g = 0; g < groups.length; g++) {
    onProgress(0, 20 + Math.round((g / groups.length) * 80), `Building part ${g + 1} of ${groups.length}…`)
    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(source, groups[g].map((p) => p - 1))
    pages.forEach((page) => doc.addPage(page))
    const bytes = await doc.save()
    const label =
      groups[g].length === 1 ? `page-${groups[g][0]}` : `pages-${groups[g][0]}-${groups[g].at(-1)}`
    outputs.push({ name: `${baseName}-${label}.pdf`, blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }) })
  }

  onProgress(0, 100)
  return outputs
}

// ---------- Rotate ----------

export interface RotateOptions {
  angle: 90 | 180 | 270
  pages: 'all' | 'odd' | 'even' | number[] // number[] = explicit selection "1,3"
  pageSelection?: string
}

export async function rotatePdf(files: File[], options: RotateOptions, onProgress: ProgressCallback) {
  if (files.length !== 1) throw new EngineError('Rotate works with a single PDF at a time.')
  onProgress(0, 5, 'Reading PDF…')
  const { PDFDocument, degrees } = await loadPdfLib()
  onProgress(0, 15, 'Loaded')
  const doc = await PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: true })
  const pageCount = doc.getPageCount()

  let selected: number[] = []
  if (options.pages === 'all') selected = Array.from({ length: pageCount }, (_, i) => i)
  else if (options.pages === 'odd') selected = Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 0)
  else if (options.pages === 'even') selected = Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 1)
  else selected = options.pages.map((p) => p - 1).filter((p) => p >= 0 && p < pageCount)

  if (selected.length === 0) throw new EngineError('No pages matched your selection.')

  selected.forEach((index) => {
    const page = doc.getPage(index)
    const current = page.getRotation().angle
    page.setRotation(degrees((current + options.angle) % 360))
  })
  onProgress(0, 100)

  const bytes = await doc.save()
  return [
    {
      name: replaceExtension(files[0].name, 'rotated.pdf'),
      blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
    },
  ]
}
