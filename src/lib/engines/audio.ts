import { getFfmpeg, execFfmpeg } from './ffmpeg'
import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

export type AudioFormat = 'mp3' | 'wav' | 'm4a' | 'ogg' | 'flac'

export interface AudioPreset {
  acodec: string
  ext: string
  mime: string
  extraArgs: string[]
  /** Lossless formats ignore the quality/bitrate setting. */
  lossless: boolean
}

export const AUDIO_PRESETS: Record<AudioFormat, AudioPreset> = {
  mp3: { acodec: 'libmp3lame', ext: 'mp3', mime: 'audio/mpeg', extraArgs: [], lossless: false },
  wav: { acodec: 'pcm_s16le', ext: 'wav', mime: 'audio/wav', extraArgs: [], lossless: true },
  m4a: { acodec: 'aac', ext: 'm4a', mime: 'audio/mp4', extraArgs: ['-movflags', '+faststart'], lossless: false },
  ogg: { acodec: 'libopus', ext: 'ogg', mime: 'audio/ogg', extraArgs: [], lossless: false },
  flac: { acodec: 'flac', ext: 'flac', mime: 'audio/flac', extraArgs: [], lossless: true },
}

export type AudioQuality = 'high' | 'balanced' | 'small'

const BITRATE: Record<AudioQuality, string> = {
  high: '320k',
  balanced: '192k',
  small: '128k',
}

function inputExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() || 'mp4'
}

/**
 * ffmpeg args for one audio extraction/conversion. Exported for unit tests.
 * `-vn` drops the video track, so the same command extracts the soundtrack
 * from a video file or re-encodes an audio-only input.
 */
export function buildAudioArgs(
  inputName: string,
  outputName: string,
  format: AudioFormat,
  quality: AudioQuality
): string[] {
  const preset = AUDIO_PRESETS[format]
  return [
    '-i',
    inputName,
    '-vn',
    '-c:a',
    preset.acodec,
    ...preset.extraArgs,
    ...(preset.lossless ? [] : ['-b:a', BITRATE[quality]]),
    outputName,
  ]
}

export interface ExtractAudioOptions {
  format: AudioFormat
  quality: AudioQuality
}

/**
 * Extracts the audio track from video files, or converts audio files
 * between formats. Runs entirely on the shared wasm engine.
 */
export async function extractAudio(
  files: File[],
  options: ExtractAudioOptions,
  onProgress: ProgressCallback
) {
  const preset = AUDIO_PRESETS[options.format]
  const ffmpeg = await getFfmpeg((message) => onProgress(0, 2, message))
  const outputs = []

  for (let i = 0; i < files.length; i++) {
    const inputName = `audio-input-${i}.${inputExtension(files[i])}`
    const outputName = `audio-output-${i}.${preset.ext}`
    onProgress(i, 5, 'Loading file…')

    await ffmpeg.writeFile(inputName, await (await import('@ffmpeg/util')).fetchFile(files[i]))
    onProgress(i, 15, 'Loaded')

    await execFfmpeg(
      ffmpeg,
      buildAudioArgs(inputName, outputName, options.format, options.quality),
      i,
      onProgress,
      { message: 'Encoding audio…' }
    )

    const data = await ffmpeg.readFile(outputName)
    if (!(data instanceof Uint8Array) || data.length === 0) {
      throw new EngineError(`Audio extraction produced no output for ${files[i].name}.`)
    }
    outputs.push({
      name: replaceExtension(files[i].name, preset.ext),
      blob: new Blob([new Uint8Array(data)], { type: preset.mime }),
    })

    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
    onProgress(i, 100)
  }

  return outputs
}
