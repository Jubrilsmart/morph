'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { imagesToPdf } from '@/lib/engines/pdf'

const tool = toolByHref('/tools/pdf/image-to-pdf')

export default function ImageToPdfPage() {
  const [pageSize, setPageSize] = useState<'auto' | 'a4'>('auto')
  const [margin, setMargin] = useState(32)

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='image/*'
        run={(files, onProgress) => imagesToPdf(files, { pageSize, margin }, onProgress)}
        runLabel='Create PDF'
        hint='Add images in order — each image becomes a page'
        options={
          <OptionsPanel>
            <OptionSelect
              label='Page size'
              value={pageSize}
              onChange={(value) => setPageSize(value as 'auto' | 'a4')}
              options={[
                { value: 'auto', label: 'Fit to each image' },
                { value: 'a4', label: 'A4 (centered)' },
              ]}
            />
            {pageSize === 'a4' && (
              <OptionSlider
                label='Margin'
                value={margin}
                onChange={setMargin}
                min={0}
                max={96}
                step={8}
                format={(v) => `${v}px`}
              />
            )}
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
