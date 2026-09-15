import { getFfmpeg, execFfmpeg } from './ffmpeg'
import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

export type VideoFormat = 'mp4' | 'mov' | 'mkv'

interface CodecPreset {
  vcodec: string
  acodec: string
  ext: string
  mime: string
  extraArgs: string[]
}

// NOTE: WebM is deliberately not offered. The self-hosted @ffmpeg/core
// 0.12.10 has a broken libvpx: libvpx-vp9 traps with "RuntimeError: memory
// access out of bounds" a few dozen frames into the encode (verified on
// both the multi- and single-thread builds), and libvpx (VP8) is too slow
// to be usable. VP8/VP9 *decoding* works fine — see compressOutputFormat.
const PRESETS: Record<VideoFormat, CodecPreset> = {
  mp4: { vcodec: 'libx264', acodec: 'aac', ext: 'mp4', mime: 'video/mp4', extraArgs: ['-tag:v', 'avc3'] },
  mov: { vcodec: 'libx264', acodec: 'aac', ext: 'mov', mime: 'video/quicktime', extraArgs: [] },
  mkv: { vcodec: 'libx264', acodec: 'aac', ext: 'mkv', mime: 'video/x-matroska', extraArgs: [] },
}

export type Resolution = 'keep' | '1080' | '720' | '480'

function scaleArgs(resolution: Resolution): string[] {
  if (resolution === 'keep') return []
  return ['-vf', `scale=-2:${resolution}`]
}

function inputExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() || 'mp4'
}

/**
 * Output container the compressor uses for a given input extension. MKV
 * keeps its container (H.264-in-MKV works); WebM inputs are re-encoded to
 * MP4 because the wasm core cannot encode VP8/VP9 (see PRESETS note).
 * Exported for unit tests.
 */
export function compressOutputFormat(extension: string): VideoFormat {
  if (extension === 'mkv') return 'mkv'
  return 'mp4'
}

export interface ConvertVideoOptions {
  format: VideoFormat
  resolution: Resolution
  quality: 'high' | 'balanced' | 'small'
}

const CRF: Record<ConvertVideoOptions['quality'], number> = {
  high: 18,
  balanced: 23,
  small: 28,
}

export async function convertVideos(
  files: File[],
  options: ConvertVideoOptions,
  onProgress: ProgressCallback
) {
  const ffmpeg = await getFfmpeg((message) => onProgress(0, 2, message))
  const preset = PRESETS[options.format]
  const outputs = []

  for (let i = 0; i < files.length; i++) {
    const inputName = `input-${i}.${inputExtension(files[i])}`
    const outputName = `output-${i}.${preset.ext}`
    onProgress(i, 5, 'Loading file…')

    await ffmpeg.writeFile(inputName, await (await import('@ffmpeg/util')).fetchFile(files[i]))
    onProgress(i, 15, 'Loaded')

    await execFfmpeg(
      ffmpeg,
      [
        '-i',
        inputName,
        '-c:v',
        preset.vcodec,
        '-crf',
        String(CRF[options.quality]),
        ...preset.extraArgs,
        '-c:a',
        preset.acodec,
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
      blob: new Blob([new Uint8Array(data)], { type: preset.mime }),
    })

    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
    onProgress(i, 100)
  }

  return outputs
}

export interface CompressVideoOptions {
  quality: number // CRF 18 (best) … 35 (smallest)
  resolution: Resolution
}

export async function compressVideos(
  files: File[],
  options: CompressVideoOptions,
  onProgress: ProgressCallback
) {
  const ffmpeg = await getFfmpeg((message) => onProgress(0, 2, message))
  const outputs = []

  for (let i = 0; i < files.length; i++) {
    const extension = inputExtension(files[i])
    const format = compressOutputFormat(extension)
    const preset = PRESETS[format]
    const inputName = `input-${i}.${extension}`
    const outputName = `output-${i}.${preset.ext}`
    onProgress(i, 5, 'Loading file…')

    await ffmpeg.writeFile(inputName, await (await import('@ffmpeg/util')).fetchFile(files[i]))
    onProgress(i, 15, 'Loaded')

    await execFfmpeg(
      ffmpeg,
      [
        '-i',
        inputName,
        '-c:v',
        preset.vcodec,
        '-crf',
        String(options.quality),
        ...preset.extraArgs,
        '-c:a',
        preset.acodec,
        '-ac',
        '2',
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
      blob: new Blob([new Uint8Array(data)], { type: preset.mime }),
    })

    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
    onProgress(i, 100)
  }

  return outputs
}
