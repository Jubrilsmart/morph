'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import { convertVideos, type Resolution, type VideoFormat } from '@/lib/engines/video'

const tool = toolByHref('/tools/video/converter')

export default function VideoConverterPage() {
  const [format, setFormat] = useState<VideoFormat>('mp4')
  const [resolution, setResolution] = useState<Resolution>('keep')
  const [quality, setQuality] = useState<'high' | 'balanced' | 'small'>('balanced')

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='video/*'
        hint='Local execution up to 4GB files — the engine loads once, then works offline'
        run={(files, onProgress) => convertVideos(files, { format, resolution, quality }, onProgress)}
        processLabel='Converting'
        runLabel={`Convert to ${format.toUpperCase()}`}
        options={
          <OptionsPanel>
            <OptionSelect
              label='Output format'
              value={format}
              onChange={(value) => setFormat(value as VideoFormat)}
              options={[
                { value: 'mp4', label: 'MP4 — universal (H.264)' },
                { value: 'webm', label: 'WebM — web-native (VP9)' },
                { value: 'mov', label: 'MOV — QuickTime' },
                { value: 'mkv', label: 'MKV — flexible container' },
              ]}
            />
            <OptionSelect
              label='Resolution'
              value={resolution}
              onChange={(value) => setResolution(value as Resolution)}
              options={[
                { value: 'keep', label: 'Keep original' },
                { value: '1080', label: '1080p' },
                { value: '720', label: '720p' },
                { value: '480', label: '480p' },
              ]}
            />
            <OptionSelect
              label='Quality'
              value={quality}
              onChange={(value) => setQuality(value as 'high' | 'balanced' | 'small')}
              options={[
                { value: 'high', label: 'High — larger files' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'small', label: 'Small — maximum savings' },
              ]}
            />
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
