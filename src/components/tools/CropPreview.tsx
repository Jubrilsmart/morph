'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { CropOptions } from '@/lib/engines/image'

const CANVAS_W = 640
const CANVAS_H = 400

interface CropPreviewProps {
  file: File | null
  options: CropOptions
  onOffsetChange: (offsetX: number, offsetY: number) => void
}

export default function CropPreview({ file, options, onOffsetChange }: CropPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null)
  const dragState = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    if (!file) {
      // Deferred so the clear doesn't run synchronously during the effect phase
      let cancelled = false
      Promise.resolve().then(() => {
        if (!cancelled) setBitmap(null)
      })
      return () => {
        cancelled = true
      }
    }
    let cancelled = false
    let loaded: ImageBitmap | null = null
    createImageBitmap(file)
      .then((b) => {
        if (cancelled) {
          b.close()
          return
        }
        loaded = b
        setBitmap(b)
      })
      .catch(() => setBitmap(null))
    return () => {
      cancelled = true
      loaded?.close()
    }
  }, [file])

  useEffect(() => {
    return () => bitmap?.close()
  }, [bitmap])

  /** Natural-space crop rect, mirrors the engine's math */
  const cropRect = useCallback(() => {
    if (!bitmap) return null
    const imageAspect = options.aspect ?? bitmap.width / bitmap.height
    let cropWidth = bitmap.width
    let cropHeight = cropWidth / imageAspect
    if (cropHeight > bitmap.height) {
      cropHeight = bitmap.height
      cropWidth = cropHeight * imageAspect
    }
    cropWidth = Math.max(1, cropWidth / options.zoom)
    cropHeight = Math.max(1, cropHeight / options.zoom)
    const maxOffsetX = (bitmap.width - cropWidth) / 2
    const maxOffsetY = (bitmap.height - cropHeight) / 2
    const cropX = bitmap.width / 2 - cropWidth / 2 + options.offsetX * maxOffsetX
    const cropY = bitmap.height / 2 - cropHeight / 2 + options.offsetY * maxOffsetY
    return { cropX, cropY, cropWidth, cropHeight, maxOffsetX, maxOffsetY }
  }, [bitmap, options])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !bitmap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = Math.min(CANVAS_W / bitmap.width, CANVAS_H / bitmap.height)
    const displayWidth = bitmap.width * scale
    const displayHeight = bitmap.height * scale
    const dx = (CANVAS_W - displayWidth) / 2
    const dy = (CANVAS_H - displayHeight) / 2

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.drawImage(bitmap, dx, dy, displayWidth, displayHeight)

    const rect = cropRect()
    if (!rect) return
    const rx = dx + rect.cropX * scale
    const ry = dy + rect.cropY * scale
    const rw = rect.cropWidth * scale
    const rh = rect.cropHeight * scale

    // Dim everything outside the crop
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_W, CANVAS_H)
    ctx.rect(rx, ry, rw, rh)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fill('evenodd')
    ctx.restore()

    // Crop frame
    ctx.strokeStyle = 'oklch(0.67 0.19 275)'
    ctx.lineWidth = 2
    ctx.strokeRect(rx, ry, rw, rh)
  }, [bitmap, cropRect])

  const pointerToOffsetDelta = (deltaPxX: number, deltaPxY: number) => {
    const rect = cropRect()
    if (!rect || !bitmap) return null
    const scale = Math.min(CANVAS_W / bitmap.width, CANVAS_H / bitmap.height)
    if (rect.maxOffsetX === 0 && rect.maxOffsetY === 0) return null
    return {
      dx: rect.maxOffsetX > 0 ? deltaPxX / (rect.maxOffsetX * scale) : 0,
      dy: rect.maxOffsetY > 0 ? deltaPxY / (rect.maxOffsetY * scale) : 0,
    }
  }

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - bounds.left) / bounds.width) * CANVAS_W,
      y: ((e.clientY - bounds.top) / bounds.height) * CANVAS_H,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!bitmap) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const point = getCanvasPoint(e)
    dragState.current = { x: point.x, y: point.y, offsetX: options.offsetX, offsetY: options.offsetY }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragState.current
    if (!drag) return
    const point = getCanvasPoint(e)
    const delta = pointerToOffsetDelta(point.x - drag.x, point.y - drag.y)
    if (!delta) return
    const nextX = Math.min(1, Math.max(-1, drag.offsetX + delta.dx))
    const nextY = Math.min(1, Math.max(-1, drag.offsetY + delta.dy))
    onOffsetChange(nextX, nextY)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragState.current = null
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      {file ? (
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className='w-full touch-none rounded-lg select-none'
        >
          Crop preview
        </canvas>
      ) : (
        <p className='text-sm text-muted-foreground text-center py-16'>
          Add an image above to see the crop preview.
        </p>
      )}
      {file && (
        <p className='text-xs text-muted-foreground text-center mt-3'>
          Drag inside the frame to reposition the crop.
        </p>
      )}
    </div>
  )
}
