import { describe, it, expect } from 'vitest'
import {
  AUDIO_PRESETS,
  buildAudioArgs,
  type AudioFormat,
  type AudioQuality,
} from '@/lib/engines/audio'
import { compressOutputFormat } from '@/lib/engines/video'
import { toolByHref } from '@/lib/tools'

describe('audio presets', () => {
  const formats = Object.keys(AUDIO_PRESETS) as AudioFormat[]

  it('covers mp3, wav, m4a, ogg and flac', () => {
    expect(formats.sort()).toEqual(['flac', 'm4a', 'mp3', 'ogg', 'wav'])
  })

  it('each preset has a codec, extension and mime type', () => {
    for (const format of formats) {
      expect(AUDIO_PRESETS[format].acodec.length).toBeGreaterThan(0)
      expect(AUDIO_PRESETS[format].ext).toBe(format)
      expect(AUDIO_PRESETS[format].mime).toMatch(/^audio\//)
    }
  })

  it('marks wav and flac as lossless and everything else lossy', () => {
    expect(AUDIO_PRESETS.wav.lossless).toBe(true)
    expect(AUDIO_PRESETS.flac.lossless).toBe(true)
    expect(AUDIO_PRESETS.mp3.lossless).toBe(false)
    expect(AUDIO_PRESETS.m4a.lossless).toBe(false)
    expect(AUDIO_PRESETS.ogg.lossless).toBe(false)
  })
})

describe('buildAudioArgs', () => {
  it('extracts to mp3 with the quality bitrate', () => {
    expect(buildAudioArgs('input-0.mp4', 'output-0.mp3', 'mp3', 'balanced')).toEqual([
      '-i',
      'input-0.mp4',
      '-vn',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '192k',
      'output-0.mp3',
    ])
  })

  it('maps quality to a bitrate for lossy formats', () => {
    for (const quality of ['high', 'balanced', 'small'] as AudioQuality[]) {
      const args = buildAudioArgs('in.mp4', `out.${AUDIO_PRESETS.m4a.ext}`, 'm4a', quality)
      const expected = quality === 'high' ? '320k' : quality === 'balanced' ? '192k' : '128k'
      expect(args).toContain('-b:a')
      expect(args[args.indexOf('-b:a') + 1]).toBe(expected)
    }
  })

  it('omits the bitrate for lossless formats', () => {
    expect(buildAudioArgs('in.mp4', 'out.wav', 'wav', 'small')).not.toContain('-b:a')
    expect(buildAudioArgs('in.mp4', 'out.flac', 'flac', 'high')).not.toContain('-b:a')
  })

  it('drops the video track for every format', () => {
    for (const format of Object.keys(AUDIO_PRESETS) as AudioFormat[]) {
      expect(buildAudioArgs('in.mp4', 'out.x', format, 'balanced')).toContain('-vn')
    }
  })
})

describe('compressOutputFormat', () => {
  it('re-encodes webm inputs to mp4 (the wasm core cannot encode VP8/VP9)', () => {
    expect(compressOutputFormat('webm')).toBe('mp4')
  })

  it('keeps the mkv container', () => {
    expect(compressOutputFormat('mkv')).toBe('mkv')
  })

  it('defaults everything else to mp4', () => {
    expect(compressOutputFormat('mp4')).toBe('mp4')
    expect(compressOutputFormat('mov')).toBe('mp4')
    expect(compressOutputFormat('avi')).toBe('mp4')
  })
})

describe('extract audio tool registration', () => {
  it('is registered as a ready video tool', () => {
    const tool = toolByHref('/tools/video/audio')
    expect(tool.id).toBe('video-audio-extract')
    expect(tool.category).toBe('video')
    expect(tool.status).toBe('ready')
  })
})
