import { getFfmpeg, execFfmpeg } from './ffmpeg'
import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

export type VideoFormat = 'mp4' | 'mov' | 'mkv'
export type Resolution = 'keep' | '1080' | '720' | '480'

interface CodecPreset {
  vcodec: string
  acodec: string
  ext: string
  mime: string
  extraArgs: string[]
}

const PRESETS: Record<VideoFormat, CodecPreset> = {
  mp4: { vcodec: 'libx264', acodec: 'aac', ext: 'mp4', mime: 'video/mp4', extraArgs: ['-tag:v', 'avc3'] },
  mov: { vcodec: 'libx264', acodec: 'aac', ext: 'mov', mime: 'video/quicktime', extraArgs: [] },
  mkv: { vcodec: 'libx264', acodec: 'aac', ext: 'mkv', mime: 'video/x-matroska', extraArgs: [] },
}

const CRF: Record<'high' | 'balanced' | 'small', number> = {
  high: 18,
  balanced: 23,
  small: 28,
}

function scaleArgs(resolution: Resolution): string[] {
  if (resolution === 'keep') return []
  return ['-vf', `scale=-2:${resolution},format=yuv420p`]
}

function inputExtension(file: File): string {
  const parts = file.name.split('.')
  if (parts.length <= 1) return 'mp4'
  return parts.pop()!.toLowerCase()
}

// Determines if it's safe to use multi-threaded audio copying
function getAudioArgs(ext: string, targetAcodec: string): { threads: string; args: string[] } {
  const safeExtensions = ['mp4', 'mov', 'mkv']

  if (safeExtensions.includes(ext)) {
    // Multi-threaded copy: Fast and safe for standard formats
    return {
      threads: '4',
      args: ['-c:a', 'copy']
    }
  }

  // Single-threaded re-encode fallback: Prevents deadlocks on weirder formats
  return {
    threads: '1',
    args: ['-c:a', targetAcodec]
  }
}

export function compressOutputFormat(extension: string): VideoFormat {
  return extension === 'mkv' ? 'mkv' : 'mp4'
}

export interface ConvertVideoOptions {
  format: VideoFormat
  resolution: Resolution
  quality: 'high' | 'balanced' | 'small'
}

export async function convertVideos(
  files: File[],
  options: ConvertVideoOptions,
  onProgress: ProgressCallback
) {
  let currentTrackedIndex = 0
  const ffmpeg = await getFfmpeg((message) => onProgress(currentTrackedIndex, 2, message))
  const preset = PRESETS[options.format]
  const { fetchFile } = await import('@ffmpeg/util')
  const outputs = []

  for (let i = 0; i < files.length; i++) {
    currentTrackedIndex = i
    const ext = inputExtension(files[i])
    const inputName = `input-${i}.${ext}`
    const outputName = `output-${i}.${preset.ext}`
    const audioStrategy = getAudioArgs(ext, preset.acodec)

    onProgress(i, 5, 'Loading file…')
    await ffmpeg.writeFile(inputName, await fetchFile(files[i]))
    onProgress(i, 15, 'Loaded')

    await execFfmpeg(
      ffmpeg,
      [
        '-threads', audioStrategy.threads,
        '-i', inputName,
        '-c:v', preset.vcodec,
        '-preset', 'ultrafast',
        '-crf', String(CRF[options.quality]),
        ...preset.extraArgs,
        ...audioStrategy.args,
        ...scaleArgs(options.resolution),
        outputName,
      ],
      i,
      onProgress,
      { message: 'Converting…' }
    )

    const data = await ffmpeg.readFile(outputName)
    if (!(data instanceof Uint8Array) || data.length === 0) {
      throw new EngineError(`Conversion produced no output for ${files[i].name}.`)
    }

    outputs.push({
      name: replaceExtension(files[i].name, preset.ext),
      blob: new Blob([data as any], { type: preset.mime }),
    })

    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
    onProgress(i, 100)
  }

  return outputs
}

export interface CompressVideoOptions {
  quality: number
  resolution: Resolution
}

export async function compressVideos(
  files: File[],
  options: CompressVideoOptions,
  onProgress: ProgressCallback
) {
  let currentTrackedIndex = 0
  const ffmpeg = await getFfmpeg((message) => onProgress(currentTrackedIndex, 2, message))
  const { fetchFile } = await import('@ffmpeg/util')
  const outputs = []

  for (let i = 0; i < files.length; i++) {
    currentTrackedIndex = i
    const ext = inputExtension(files[i])
    const format = compressOutputFormat(ext)
    const preset = PRESETS[format]
    const inputName = `input-${i}.${ext}`
    const outputName = `output-${i}.${preset.ext}`
    const audioStrategy = getAudioArgs(ext, preset.acodec)

    onProgress(i, 5, 'Loading file…')
    await ffmpeg.writeFile(inputName, await fetchFile(files[i]))
    onProgress(i, 15, 'Loaded')

    await execFfmpeg(
      ffmpeg,
      [
        '-threads', audioStrategy.threads,
        '-i', inputName,
        '-c:v', preset.vcodec,
        '-preset', 'ultrafast',
        '-crf', String(options.quality),
        ...preset.extraArgs,
        ...audioStrategy.args,
        ...scaleArgs(options.resolution),
        outputName,
      ],
      i,
      onProgress,
      { message: 'Compressing…' }
    )

    const data = await ffmpeg.readFile(outputName)
    if (!(data instanceof Uint8Array) || data.length === 0) {
      throw new EngineError(`Compression produced no output for ${files[i].name}.`)
    }

    outputs.push({
      name: replaceExtension(files[i].name, `compressed.${preset.ext}`),
      blob: new Blob([data as any], { type: preset.mime }),
    })

    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
    onProgress(i, 100)
  }

  return outputs
}
