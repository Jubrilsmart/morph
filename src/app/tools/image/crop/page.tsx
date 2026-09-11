'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import CropPreview from '@/components/tools/CropPreview'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { cropImages, type CropOptions } from '@/lib/engines/image'

const tool = toolByHref('/tools/image/crop')

const ASPECTS: { value: string; label: string; aspect: number | null }[] = [
  { value: 'original', label: 'Original', aspect: null },
  { value: '1:1', label: 'Square 1:1', aspect: 1 },
  { value: '4:3', label: 'Classic 4:3', aspect: 4 / 3 },
  { value: '3:4', label: 'Portrait 3:4', aspect: 3 / 4 },
  { value: '16:9', label: 'Wide 16:9', aspect: 16 / 9 },
  { value: '9:16', label: 'Story 9:16', aspect: 9 / 16 },
]

export default function ImageCropPage() {
  const [aspectKey, setAspectKey] = useState('1:1')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const aspect = ASPECTS.find((a) => a.value === aspectKey)?.aspect ?? null
  const options: CropOptions = { aspect, zoom, offsetX: offset.x, offsetY: offset.y }

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='image/*'
        multiple={false}
        minFiles={1}
        run={(files, onProgress) => cropImages(files, options, onProgress)}
        runLabel='Crop image'
        hint='One image at a time — the crop preview appears after you add a file'
        options={(files) => (
          <>
            <OptionsPanel>
              <OptionSelect
                label='Aspect ratio'
                value={aspectKey}
                onChange={setAspectKey}
                options={ASPECTS.map(({ value, label }) => ({ value, label }))}
              />
              <OptionSlider
                label='Zoom'
                value={zoom}
                onChange={setZoom}
                min={1}
                max={4}
                step={0.1}
                format={(v) => `${v.toFixed(1)}×`}
                description='Higher zoom crops a tighter region.'
              />
            </OptionsPanel>
            <CropPreview
              file={files[0] ?? null}
              options={options}
              onOffsetChange={(x, y) => setOffset({ x, y })}
            />
          </>
        )}
      />
    </ToolPage>
  )
}
