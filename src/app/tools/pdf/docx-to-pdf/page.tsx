'use client'

import React from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { toolByHref } from '@/lib/tools'
import { docxToPdf } from '@/lib/engines/docx'

const tool = toolByHref('/tools/pdf/docx-to-pdf')

export default function DocxToPdfPage() {
  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        multiple={false}
        run={docxToPdf}
        runLabel='Convert to PDF'
        hint='One .docx at a time — rendered entirely on your device'
      />
    </ToolPage>
  )
}
