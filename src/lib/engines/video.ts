import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

const SINGLE_THREAD_BASE = '/ffmpeg/single'
const MULTI_THREAD_BASE = '/ffmpeg/mt'

let ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg | null = null
let loading: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null

/**
 * Loads the self-hosted ffmpeg.wasm core. Uses the multi-threaded core when
 * the page is cross-origin isolated (COOP/COEP headers set in next.config.ts),
 * falling back to the single-threaded core otherwise.
 */
async function getFfmpeg(onStatus: (message: string) => void): Promise<import('@ffmpeg/ffmpeg').FFmpeg> {
  if (ffmpeg?.loaded) return ffmpeg
  if (loading) return loading

  loading = (async () => {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg')
    const { toBlobURL } = await import('@ffmpeg/util')

    const multiThread = typeof window !== 'undefined' && window.crossOriginIsolated
    const base = multiThread ? MULTI_THREAD_BASE : SINGLE_THREAD_BASE
    onStatus(multiThread ? 'Loading multi-thread engine…' : 'Loading engine…')

    const instance = new FFmpeg()
    const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript')
    const wasmURL = await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm')
    if (multiThread) {
      const workerURL = await toBlobURL(`${base}/ffmpeg-core.worker.js`, 'text/javascript')
      await instance.load({ coreURL, wasmURL, workerURL })
    } else {
      await instance.load({ coreURL, wasmURL })
    }
    ffmpeg = instance
    return instance
  })()

  try {
    return await loading
  } catch {
    loading = null // allow retry
    throw new EngineError(
      'Could not load the conversion engine. Check your connection and try again.'
    )
  }
}

export type VideoFormat = 'mp4' | 'webm' | 'mov' | 'mkv'

interface CodecPreset {
  vcodec: string
  acodec: string
  ext: string
  mime: string
  extraArgs: string[]
}

const PRESETS: Record<VideoFormat, CodecPreset> = {
  mp4: { vcodec: 'libx264', acodec: 'aac', ext: 'mp4', mime: 'video/mp4', extraArgs: ['-tag:v', 'avc3'] },
  webm: { vcodec: 'libvpx-vp9', acodec: 'libopus', ext: 'webm', mime: 'video/webm', extraArgs: ['-b:v', '0'] },
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

async function execWithProgress(
  ffmpeg: import('@ffmpeg/ffmpeg').FFmpeg,
  args: string[],
  fileIndex: number,
  onProgress: ProgressCallback,
  message: string
) {
  const handler = ({ progress }: { progress: number }) => {
    const clamped = Math.min(1, Math.max(0, progress || 0))
    onProgress(fileIndex, 20 + clamped * 79, message)
  }
  ffmpeg.on('progress', handler)
  try {
    const code = await ffmpeg.exec(args)
    if (code !== 0) throw new EngineError('The engine could not process this file.')
  } finally {
    ffmpeg.off('progress', handler)
  }
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

    await execWithProgress(
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
      'Converting…'
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
    // Keep the original container where it has a sane codec pairing, else fall back to mp4
    const format: VideoFormat = extension === 'webm' ? 'webm' : extension === 'mkv' ? 'mkv' : 'mp4'
    const preset = PRESETS[format]
    const inputName = `input-${i}.${extension}`
    const outputName = `output-${i}.${preset.ext}`
    onProgress(i, 5, 'Loading file…')

    await ffmpeg.writeFile(inputName, await (await import('@ffmpeg/util')).fetchFile(files[i]))
    onProgress(i, 15, 'Loaded')

    await execWithProgress(
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
      'Compressing…'
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
