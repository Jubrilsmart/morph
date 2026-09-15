'use client'

import React, { useState } from 'react'
import ToolPage from '@/components/tools/ToolPage'
import ToolWorkspace from '@/components/tools/ToolWorkspace'
import { OptionsPanel, OptionSelect } from '@/components/tools/OptionControls'
import { toolByHref } from '@/lib/tools'
import {
  extractAudio,
  AUDIO_PRESETS,
  type AudioFormat,
  type AudioQuality,
} from '@/lib/engines/audio'

const tool = toolByHref('/tools/video/audio')

export default function AudioExtractorPage() {
  const [format, setFormat] = useState<AudioFormat>('mp3')
  const [quality, setQuality] = useState<AudioQuality>('balanced')
  const lossless = AUDIO_PRESETS[format].lossless

  return (
    <ToolPage tool={tool}>
      <ToolWorkspace
        accept='video/*,audio/*'
        hint='Pull the soundtrack out of any video, or convert audio files — all on your device'
        run={(files, onProgress) => extractAudio(files, { format, quality }, onProgress)}
        processLabel='Extracting'
        runLabel={`Extract ${format.toUpperCase()}`}
        options={
          <OptionsPanel>
            <OptionSelect
              label='Output format'
              value={format}
              onChange={(value) => setFormat(value as AudioFormat)}
              options={[
                { value: 'mp3', label: 'MP3 — universal' },
                { value: 'wav', label: 'WAV — lossless PCM' },
                { value: 'm4a', label: 'M4A — AAC' },
                { value: 'ogg', label: 'OGG — Opus' },
                { value: 'flac', label: 'FLAC — lossless' },
              ]}
            />
            <OptionSelect
              label='Quality'
              value={quality}
              onChange={(value) => setQuality(value as AudioQuality)}
              options={[
                { value: 'high', label: 'High — 320 kbps' },
                { value: 'balanced', label: 'Balanced — 192 kbps' },
                { value: 'small', label: 'Small — 128 kbps' },
              ]}
            />
            <p className='text-xs text-muted-foreground'>
              {lossless
                ? `${format.toUpperCase()} is lossless — the quality setting only applies to MP3, M4A and OGG.`
                : 'Higher bitrate keeps more detail and produces larger files.'}
            </p>
          </OptionsPanel>
        }
      />
    </ToolPage>
  )
}
