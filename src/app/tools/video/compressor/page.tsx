'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect, OptionSlider } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { compressVideos, type Resolution } from '@/lib/engines/video'

const tool = toolByHref('/tools/video/compressor')

export default function VideoCompressorPage() {
  const [quality, setQuality] = useState(28)
  const [resolution, setResolution] = useState<Resolution>('keep')

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='video/*'
        hint='Local execution up to 4GB files — the engine loads once, then works offline'
        run={(files, onProgress) => compressVideos(files, { quality, resolution }, onProgress)}
        runLabel='Compress videos'
        options={
          <OptionsPanel>
            <OptionSlider
              label='Compression level'
              value={quality}
              onChange={setQuality}
              min={18}
              max={35}
              format={(v) =>
                v <= 22 ? 'Gentle' : v <= 27 ? 'Balanced' : v <= 31 ? 'Strong' : 'Aggressive'
              }
              description='Higher compression means smaller files and lower quality.'
            />
            <OptionSelect
              label='Resolution'
              value={resolution}
              onChange={(value) => setResolution(value as Resolution)}
              options={[
                { value: 'keep', label: 'Keep original' },
                { value: '1080', label: 'Scale to 1080p' },
                { value: '720', label: 'Scale to 720p' },
                { value: '480', label: 'Scale to 480p' },
              ]}
            />
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
