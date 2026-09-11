'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { compressImages, type ImageFormat } from '@/lib/engines/image'

const tool = toolByHref('/tools/image/compress')

const FORMATS: { value: ImageFormat | 'original'; label: string }[] = [
  { value: 'original', label: 'Keep original format' },
  { value: 'image/webp', label: 'WebP — best compression' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/avif', label: 'AVIF' },
]

const MAX_WIDTHS = [1920, 1280, 1024, 800, 0]

export default function ImageCompressPage() {
  const [format, setFormat] = useState<ImageFormat | 'original'>('original')
  const [quality, setQuality] = useState(70)
  const [maxWidth, setMaxWidth] = useState(0)

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='image/*'
        run={(files, onProgress) =>
          compressImages(files, { format, quality: quality / 100, maxWidth: maxWidth || undefined }, onProgress)
        }
        runLabel='Compress images'
        options={
          <OptionsPanel>
            <OptionSelect
              label='Output format'
              description='PNG is lossless — switch to WebP for real size savings.'
              value={format}
              onChange={(value) => setFormat(value as ImageFormat | 'original')}
              options={FORMATS}
            />
            <OptionSlider
              label='Quality'
              value={quality}
              onChange={setQuality}
              min={10}
              max={100}
              step={5}
              format={(v) => `${v}%`}
              description='70–85% is usually visually identical.'
            />
            <OptionSelect
              label='Max width'
              description='Optionally scale down large images.'
              value={String(maxWidth)}
              onChange={(value) => setMaxWidth(Number(value))}
              options={MAX_WIDTHS.map((w) => ({
                value: String(w),
                label: w === 0 ? 'Keep original size' : `${w}px`,
              }))}
            />
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
