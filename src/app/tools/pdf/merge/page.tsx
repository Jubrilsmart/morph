'use client'

import React from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { toolByHref } from '@/lib/tools'
import { mergePdfs } from '@/lib/engines/pdf'

const tool = toolByHref('/tools/pdf/merge')

export default function MergePdfPage() {
  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='application/pdf,.pdf'
        minFiles={2}
        run={mergePdfs}
        runLabel='Merge PDFs'
        hint='Add PDFs in the order you want them merged'
      />
    </ToolPage>
  )
}
