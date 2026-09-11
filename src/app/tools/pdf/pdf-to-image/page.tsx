'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { pdfToImages } from '@/lib/engines/pdf'

const tool = toolByHref('/tools/pdf/pdf-to-image')

export default function PdfToImagePage() {
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png')
  const [quality, setQuality] = useState(90)
  const [scale, setScale] = useState(2)

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='application/pdf,.pdf'
        multiple={false}
        run={(files, onProgress) => pdfToImages(files, { format, quality: quality / 100, scale }, onProgress)}
        processLabel='Rendering pages'
        runLabel='Export pages as images'
        hint='One PDF at a time — every page becomes an image'
        options={
          <OptionsPanel>
            <OptionSelect
              label='Image format'
              value={format}
              onChange={(value) => setFormat(value as 'image/png' | 'image/jpeg')}
              options={[
                { value: 'image/png', label: 'PNG — lossless' },
                { value: 'image/jpeg', label: 'JPEG — smaller' },
              ]}
            />
            <OptionSlider
              label='Resolution'
              value={scale}
              onChange={setScale}
              min={1}
              max={4}
              step={0.5}
              format={(v) => `${v}×`}
              description='2× is crisp for most PDFs.'
            />
            {format === 'image/jpeg' && (
              <OptionSlider
                label='Quality'
                value={quality}
                onChange={setQuality}
                min={10}
                max={100}
                step={5}
                format={(v) => `${v}%`}
              />
            )}
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
