import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

async function loadPdfJs() {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  return pdfjs
}

// ---------- DOCX to PDF ----------

/**
 * mammoth → HTML → html2canvas → jsPDF.
 * Renders the document on a hidden A4-width element and slices the
 * resulting canvas across PDF pages.
 */
export async function docxToPdf(files: File[], onProgress: ProgressCallback) {
  if (files.length !== 1) throw new EngineError('DOCX to PDF works with a single document at a time.')

  onProgress(0, 5, 'Reading document…')
  const mammoth = await import('mammoth')
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await files[0].arrayBuffer() })
  if (!html?.trim()) throw new EngineError('This document appears to be empty.')
  onProgress(0, 15, 'Loaded')

  onProgress(0, 35, 'Laying out…')
  // A4 at 96dpi = 794px wide
  const container = document.createElement('div')
  container.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:794px',
    'padding:64px',
    'box-sizing:border-box',
    'background:#ffffff',
    'color:#111111',
    'font-family:Georgia, "Times New Roman", serif',
    'font-size:12pt',
    'line-height:1.5',
  ].join(';')
  // html2canvas cannot parse modern color functions (oklch/lab). The app theme
  // resolves to lab() in computed styles, which html2canvas reads from <body>
  // for the canvas backdrop — so pin plain hex colors while capturing.
  const guard = document.createElement('style')
  guard.textContent = `
    .morph-docx-capture, .morph-docx-capture * {
      color: #111111 !important;
      background-color: transparent !important;
      border-color: #111111 !important;
      text-decoration-color: #111111 !important;
      outline-color: #111111 !important;
      -webkit-text-fill-color: #111111 !important;
      caret-color: #111111 !important;
      box-shadow: none !important;
    }
    .morph-docx-capture { background-color: #ffffff !important; }
    .morph-docx-capture table { border-collapse: collapse; }
    .morph-docx-capture td, .morph-docx-capture th { border: 1px solid #444444 !important; padding: 4px 6px; }
  `
  container.className = 'morph-docx-capture'
  container.innerHTML = html
  // Keep basic block styling without loading external stylesheets
  container.querySelectorAll('img').forEach((img) => {
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
  })
  container.prepend(guard)
  const body = document.body
  const prevBodyBg = body.style.backgroundColor
  const prevBodyColor = body.style.color
  body.style.backgroundColor = '#ffffff'
  body.style.color = '#111111'
  document.body.appendChild(container)

  try {
    const { default: html2canvas } = await import('html2canvas')
    onProgress(0, 60, 'Rendering…')
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    onProgress(0, 85, 'Writing PDF…')
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imageWidth = pageWidth
    const imageHeight = (canvas.height * imageWidth) / canvas.width
    const image = canvas.toDataURL('image/jpeg', 0.92)

    if (imageHeight <= pageHeight) {
      pdf.addImage(image, 'JPEG', 0, 0, imageWidth, imageHeight)
    } else {
      let remaining = imageHeight
      let position = 0
      while (remaining > 0) {
        pdf.addImage(image, 'JPEG', 0, -position, imageWidth, imageHeight)
        remaining -= pageHeight
        position += pageHeight
        if (remaining > 0) pdf.addPage()
      }
    }

    const blob = pdf.output('blob')
    onProgress(0, 100)
    return [{ name: replaceExtension(files[0].name, 'pdf'), blob }]
  } finally {
    container.remove()
    body.style.backgroundColor = prevBodyBg
    body.style.color = prevBodyColor
  }
}

// ---------- PDF to DOCX ----------

interface Line {
  y: number
  text: string
}

/**
 * pdf.js text extraction → docx library.
 * Text-only: layout, images and tables are not preserved (the UI warns about this).
 */
export async function pdfToDocx(files: File[], onProgress: ProgressCallback) {
  if (files.length !== 1) throw new EngineError('PDF to DOCX works with a single PDF at a time.')

  onProgress(0, 5, 'Reading PDF…')
  const pdfjs = await loadPdfJs()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await files[0].arrayBuffer()) }).promise
  onProgress(0, 15, 'Loaded')

  const { Document, Packer, Paragraph, TextRun, PageBreak } = await import('docx')
  const children: InstanceType<typeof Paragraph>[] = []

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    onProgress(0, 20 + Math.round(((pageNumber - 1) / doc.numPages) * 80), `Extracting page ${pageNumber}…`)
    const page = await doc.getPage(pageNumber)
    const content = await page.getTextContent()

    // Group text items into lines by vertical position
    const lines: Line[] = []
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round((item.transform as number[])[5])
      const line = lines.find((l) => Math.abs(l.y - y) < 3)
      if (line) line.text += item.str
      else lines.push({ y, text: item.str })
    }
    lines.sort((a, b) => b.y - a.y) // PDF y grows upward

    if (pageNumber > 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }
    for (const line of lines) {
      children.push(new Paragraph({ children: [new TextRun(line.text)] }))
    }
  }

  if (children.length === 0) {
    throw new EngineError('No extractable text found — this PDF may be scanned images.')
  }

  onProgress(0, 90, 'Writing DOCX…')
  const document = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(document)
  onProgress(0, 100)
  return [{ name: replaceExtension(files[0].name, 'docx'), blob }]
}
