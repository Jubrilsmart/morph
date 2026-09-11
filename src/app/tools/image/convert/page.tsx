'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { convertImages, type ImageFormat } from '@/lib/engines/image'

const tool = toolByHref('/tools/image/convert')

const FORMATS: { value: ImageFormat; label: string }[] = [
  { value: 'image/webp', label: 'WebP — modern, small' },
  { value: 'image/jpeg', label: 'JPEG — universal' },
  { value: 'image/png', label: 'PNG — lossless' },
  { value: 'image/avif', label: 'AVIF — next-gen' },
]

export default function ImageConvertPage() {
  const [format, setFormat] = useState<ImageFormat>('image/webp')
  const [quality, setQuality] = useState(90)

  const extension = format.split('/')[1]
  const lossy = format !== 'image/png'

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='image/*'
        run={(files, onProgress) => convertImages(files, { format, quality: quality / 100 }, onProgress)}
        processLabel='Converting'
        runLabel={`Convert to ${extension.toUpperCase()}`}
        options={
          <OptionsPanel>
            <OptionSelect
              label='Output format'
              value={format}
              onChange={(value) => setFormat(value as ImageFormat)}
              options={FORMATS}
            />
            {lossy && (
              <OptionSlider
                label='Quality'
                value={quality}
                onChange={setQuality}
                min={10}
                max={100}
                step={5}
                format={(v) => `${v}%`}
                description='Higher quality means larger files.'
              />
            )}
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
