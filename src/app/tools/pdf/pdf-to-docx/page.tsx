'use client'

import React from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { toolByHref } from '@/lib/tools'
import { pdfToDocx } from '@/lib/engines/docx'

const tool = toolByHref('/tools/pdf/pdf-to-docx')

export default function PdfToDocxPage() {
  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='application/pdf,.pdf'
        multiple={false}
        run={pdfToDocx}
        runLabel='Convert to DOCX'
        hint='One PDF at a time — text extraction, layout not preserved'
      />
    </ToolPage>
  )
}
