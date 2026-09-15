'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AudioLines,
  Clock,
  Download,
  ExternalLink,
  File,
  FileText,
  Film,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { formatBytes } from '@/lib/format'
import {
  clearHistory,
  deleteHistoryRecord,
  listHistory,
  readOutputFile,
  type HistoryRecord,
} from '@/lib/history'

function iconFor(mime: string) {
  if (mime.startsWith('video/')) return Film
  if (mime.startsWith('audio/')) return AudioLines
  if (mime.startsWith('image/')) return ImageIcon
  if (mime === 'application/pdf' || mime.startsWith('text/')) return FileText
  return File
}

const PREVIEWABLE = /^(video\/|audio\/|image\/|application\/pdf$|text\/)/

/** Opens a stored output — download it again, or preview in a new tab. */
async function openOutput(record: HistoryRecord, download: boolean) {
  const blob = await readOutputFile(record.id)
  if (!blob) {
    toast.error('This file is no longer stored on this device. Run the conversion again.')
    return
  }
  const url = URL.createObjectURL(blob)
  if (download) {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = record.outputName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  } else {
    window.open(url, '_blank')
    // keep the URL alive for the preview tab; browsers revoke with ours
  }
}

function relativeTime(timestamp: number): string {
  const delta = Date.now() - timestamp
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(timestamp).toLocaleDateString()
}

export default function RecentPage() {
  const [records, setRecords] = useState<HistoryRecord[] | null>(null)

  const refresh = useCallback(() => {
    listHistory().then(setRecords)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // A conversion that finished on another tab of the app a moment ago may
  // still be committing its record — while the list is empty (or loading),
  // re-check briefly so the user doesn't land on a stale empty state.
  useEffect(() => {
    if (records !== null && records.length > 0) return
    const interval = setInterval(refresh, 1000)
    const stop = setTimeout(() => clearInterval(interval), 10_000)
    return () => {
      clearInterval(interval)
      clearTimeout(stop)
    }
  }, [records, refresh])

  const remove = useCallback(
    async (record: HistoryRecord) => {
      await deleteHistoryRecord(record.id)
      refresh()
    },
    [refresh]
  )

  const clearAll = useCallback(async () => {
    await clearHistory()
    toast.success('Recent history cleared.')
    refresh()
  }, [refresh])

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <h1 className='text-2xl font-black p-2'>Recent</h1>
        <p className='text-xs md:text-sm text-muted-foreground px-2'>
          Your recent conversions, saved on this device — open or download them again without re-running the engine.
        </p>
      </div>

      {records === null ? (
        <Card>
          <CardContent className='py-10 text-center text-sm text-muted-foreground'>
            Loading…
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center gap-3 py-12 text-center'>
            <Clock className='size-8 text-muted-foreground' />
            <p className='text-sm font-medium'>No recent conversions yet</p>
            <p className='text-xs text-muted-foreground'>
              Files you convert appear here, kept on your device.
            </p>
            <a href='/tools'>
              <Button variant='outline' size='sm' className='mt-1'>
                Browse tools
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>Files ({records.length})</CardTitle>
            <Button variant='ghost' size='sm' onClick={clearAll}>
              <Trash2 className='size-3.5' />
              Clear all
            </Button>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {records.map((record) => {
              const Icon = iconFor(record.mime)
              const previewable = PREVIEWABLE.test(record.mime)
              return (
                <div key={record.id} className='flex items-center gap-3 text-sm'>
                  <Icon className='size-4 shrink-0 text-primary' />
                  <div className='min-w-0 flex-1'>
                    <p className='truncate font-medium' title={record.outputName}>
                      {record.outputName}
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {record.toolTitle || 'Conversion'} · {formatBytes(record.size)} · {relativeTime(record.createdAt)}
                    </p>
                  </div>
                  {record.stored ? (
                    <>
                      {previewable && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => void openOutput(record, false)}
                        >
                          <ExternalLink className='size-3.5' />
                          Open
                        </Button>
                      )}
                      <Button size='sm' onClick={() => void openOutput(record, true)}>
                        <Download className='size-3.5' />
                        Download
                      </Button>
                    </>
                  ) : (
                    <span className='shrink-0 text-xs text-muted-foreground'>not stored</span>
                  )}
                  <button
                    aria-label={`Remove ${record.outputName} from recent`}
                    onClick={() => void remove(record)}
                    className='text-muted-foreground hover:text-destructive shrink-0'
                  >
                    <Trash2 className='size-4' />
                  </button>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <p className='px-1 text-xs text-muted-foreground'>
        Outputs are stored in your browser&apos;s private storage and never leave this device. Manage retention in{' '}
        <Link href='/tools/settings' className='underline underline-offset-2'>
          Settings
        </Link>
        .
      </p>
    </div>
  )
}
