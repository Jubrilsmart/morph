import { EngineError, type ProgressCallback } from './types'
import { replaceExtension } from '../format'

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif'

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

const MIME_BY_EXTENSION: Record<string, ImageFormat> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
}

function detectMime(file: File): ImageFormat {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXTENSION[extension] ?? (file.type as ImageFormat)
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    throw new EngineError(`Could not decode ${file.name}. Is it a valid image?`)
  }
}

async function encode(
  source: ImageBitmap | HTMLCanvasElement,
  mime: ImageFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = source instanceof HTMLCanvasElement ? source.width : source.width
  canvas.height = source instanceof HTMLCanvasElement ? source.height : source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new EngineError('Could not create a 2D canvas context.')
  if (mime === 'image/jpeg') {
    // JPEG has no alpha channel — flatten onto white
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(source as CanvasImageSource, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality)
  )
  if (!blob) throw new EngineError('Your browser could not encode this format.')
  if (blob.type !== mime) {
    throw new EngineError(
      `Your browser cannot encode ${EXTENSIONS[mime]?.toUpperCase() ?? mime} images. Try PNG, JPEG or WEBP.`
    )
  }
  return blob
}

export async function convertImages(
  files: File[],
  options: { format: ImageFormat; quality: number },
  onProgress: ProgressCallback
) {
  const outputs = []
  for (let i = 0; i < files.length; i++) {
    onProgress(i, 5, 'Decoding…')
    const bitmap = await decode(files[i])
    onProgress(i, 60, 'Encoding…')
    const blob = await encode(bitmap, options.format, options.quality)
    bitmap.close()
    outputs.push({ name: replaceExtension(files[i].name, EXTENSIONS[options.format]), blob })
    onProgress(i, 100)
  }
  return outputs
}

export async function compressImages(
  files: File[],
  options: { format: ImageFormat | 'original'; quality: number; maxWidth?: number },
  onProgress: ProgressCallback
) {
  const outputs = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress(i, 5, 'Decoding…')
    const bitmap = await decode(file)
    const mime = options.format === 'original' ? detectMime(file) : options.format

    let source: ImageBitmap | HTMLCanvasElement = bitmap
    if (options.maxWidth && bitmap.width > options.maxWidth) {
      const scale = options.maxWidth / bitmap.width
      const canvas = document.createElement('canvas')
      canvas.width = options.maxWidth
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new EngineError('Could not create a 2D canvas context.')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      source = canvas
    }

    onProgress(i, 60, 'Compressing…')
    const blob = await encode(source, mime, options.quality)
    bitmap.close()
    outputs.push({ name: replaceExtension(file.name, EXTENSIONS[mime]), blob })
    onProgress(i, 100)
  }
  return outputs
}

export interface ResizeOptions {
  mode: 'percent' | 'pixels'
  percent: number
  width: number
  height: number
  keepAspect: boolean
}

export async function resizeImages(files: File[], options: ResizeOptions, onProgress: ProgressCallback) {
  const outputs = []
  for (let i = 0; i < files.length; i++) {
    onProgress(i, 5, 'Decoding…')
    const bitmap = await decode(files[i])

    let targetWidth: number
    let targetHeight: number
    if (options.mode === 'percent') {
      targetWidth = Math.max(1, Math.round((bitmap.width * options.percent) / 100))
      targetHeight = Math.max(1, Math.round((bitmap.height * options.percent) / 100))
    } else if (options.keepAspect) {
      const scale = Math.min(options.width / bitmap.width, options.height / bitmap.height)
      targetWidth = Math.max(1, Math.round(bitmap.width * scale))
      targetHeight = Math.max(1, Math.round(bitmap.height * scale))
    } else {
      targetWidth = options.width
      targetHeight = options.height
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new EngineError('Could not create a 2D canvas context.')
    ctx.imageSmoothingQuality = 'high'
    onProgress(i, 60, 'Resizing…')
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    const mime = detectMime(files[i])
    const blob = await encode(canvas, mime, 0.92)
    bitmap.close()
    outputs.push({ name: replaceExtension(files[i].name, `${targetWidth}x${targetHeight}.${EXTENSIONS[mime]}`), blob })
    onProgress(i, 100)
  }
  return outputs
}

export interface CropOptions {
  aspect: number | null // null = original aspect
  zoom: number // 1 = largest crop, higher = tighter crop
  offsetX: number // -1..1 relative to image bounds
  offsetY: number
}

export async function cropImages(files: File[], options: CropOptions, onProgress: ProgressCallback) {
  if (files.length !== 1) throw new EngineError('Crop works with a single image at a time.')

  onProgress(0, 5, 'Decoding…')
  const bitmap = await decode(files[0])

  const imageAspect = options.aspect ?? bitmap.width / bitmap.height
  // Start from the largest centered crop with the target aspect, then shrink by zoom
  let cropWidth = bitmap.width
  let cropHeight = cropWidth / imageAspect
  if (cropHeight > bitmap.height) {
    cropHeight = bitmap.height
    cropWidth = cropHeight * imageAspect
  }
  cropWidth = Math.max(1, Math.round(cropWidth / options.zoom))
  cropHeight = Math.max(1, Math.round(cropHeight / options.zoom))

  // Offset in pixels, clamped so the crop stays inside the image
  const maxOffsetX = (bitmap.width - cropWidth) / 2
  const maxOffsetY = (bitmap.height - cropHeight) / 2
  const cropX = Math.round(bitmap.width / 2 - cropWidth / 2 + options.offsetX * maxOffsetX)
  const cropY = Math.round(bitmap.height / 2 - cropHeight / 2 + options.offsetY * maxOffsetY)

  const canvas = document.createElement('canvas')
  canvas.width = cropWidth
  canvas.height = cropHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new EngineError('Could not create a 2D canvas context.')

  onProgress(0, 60, 'Cropping…')
  ctx.drawImage(bitmap, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

  const mime = detectMime(files[0])
  const blob = await encode(canvas, mime, 0.92)
  bitmap.close()
  onProgress(0, 100)
  return [{ name: replaceExtension(files[0].name, `cropped.${EXTENSIONS[mime]}`), blob }]
}
