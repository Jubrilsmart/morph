// Regenerates the fixtures used by the unit, integration and e2e tests.
// Documents (PDF/DOCX) are always rebuilt with the project's own libraries.
// Media (mp4/png) are only rebuilt when ffmpeg is available — the committed
// binaries are used otherwise.
//
//   node tests/fixtures/generate.mjs
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(dir, '../..')
const require = createRequire(import.meta.url)

const { PDFDocument, StandardFonts, rgb } = require(path.join(root, 'node_modules/pdf-lib'))
const { Document, Packer, Paragraph, TextRun } = require(path.join(root, 'node_modules/docx'))

async function makePdf(title, pages) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage()
    page.drawText(`${title} — page ${i}`, { x: 60, y: 700, size: 24, font, color: rgb(0.1, 0.1, 0.6) })
    page.drawText('Morph end-to-end test document.', { x: 60, y: 660, size: 12, font })
  }
  return doc.save()
}

const write = (name, data) => {
  fs.writeFileSync(path.join(dir, name), data)
  console.log('wrote', name)
}

write('test-a.pdf', await makePdf('Document A', 3))
write('test-b.pdf', await makePdf('Document B', 2))

const docx = new Document({
  sections: [
    {
      children: [
        new Paragraph({ children: [new TextRun({ text: 'Morph DOCX Test', bold: true, size: 32 })] }),
        new Paragraph({ children: [new TextRun('This paragraph verifies the DOCX to PDF pipeline.')] }),
        new Paragraph({ children: [new TextRun('Second paragraph with more text to render.')] }),
      ],
    },
  ],
})
write('test.docx', await Packer.toBuffer(docx))

try {
  execFileSync(
    'ffmpeg',
    [
      '-y', '-f', 'lavfi', '-i', 'testsrc=duration=2:size=320x240:rate=15',
      '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest',
      path.join(dir, 'sample.mp4'),
    ],
    { stdio: 'ignore' }
  )
  console.log('wrote sample.mp4')
} catch {
  console.log('ffmpeg not available — keeping committed sample.mp4')
}

// Longer clip: the e2e progress-bar test needs a conversion whose encode
// phase lasts long enough to sample. 12s of testsrc encodes for several
// seconds under wasm.
try {
  execFileSync(
    'ffmpeg',
    [
      '-y', '-f', 'lavfi', '-i', 'testsrc=duration=12:size=320x240:rate=15',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
      path.join(dir, 'sample-long.mp4'),
    ],
    { stdio: 'ignore' }
  )
  console.log('wrote sample-long.mp4')
} catch {
  console.log('ffmpeg not available — keeping committed sample-long.mp4')
}

try {
  execFileSync(
    'ffmpeg',
    ['-y', '-f', 'lavfi', '-i', 'gradients=size=640x480', '-frames:v', '1', path.join(dir, 'sample-image.png')],
    { stdio: 'ignore' }
  )
  console.log('wrote sample-image.png')
} catch {
  console.log('ffmpeg not available — keeping committed sample-image.png')
}
