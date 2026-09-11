'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CircleCheck, CircleX, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'
import type { QueuedFile } from './ToolWorkspace'

const STEPS = ['Reading file', 'Loaded', 'Converting', 'Complete'] as const

/** Which step a file is currently on, derived from its progress. */
function currentStep(file: QueuedFile): number {
  if (file.status === 'done') return 3
  if (file.status === 'error') return 2
  if (file.progress >= 20) return 2
  if (file.progress >= 10) return 1
  return 0
}

function StepRow({ step, failed }: { step: number; failed: boolean }) {
  return (
    <div className='flex items-center gap-1 sm:gap-2'>
      {STEPS.map((label, index) => {
        const isDone = index < step || (index === 3 && step === 3)
        const isActive = index === step && !failed
        return (
          <React.Fragment key={label}>
            {index > 0 && (
              <span
                aria-hidden='true'
                className={cn(
                  'h-px flex-1 min-w-2 bg-border',
                  index <= step && !failed && 'bg-primary/60'
                )}
              />
            )}
            <span
              className={cn(
                'flex items-center gap-1 text-[10px] sm:text-xs whitespace-nowrap',
                isDone && !failed && 'text-foreground',
                isActive && 'text-primary font-semibold',
                index > step && 'text-muted-foreground/60',
                failed && index === 2 && 'text-destructive font-semibold',
                failed && index !== 2 && 'text-muted-foreground/60'
              )}
            >
              {isDone && !failed ? (
                <CircleCheck className='size-3 sm:size-3.5 text-primary' />
              ) : failed && index === 2 ? (
                <CircleX className='size-3 sm:size-3.5 text-destructive' />
              ) : isActive ? (
                <Loader2 className='size-3 sm:size-3.5 animate-spin text-primary' />
              ) : (
                <span className='size-1.5 rounded-full bg-muted-foreground/40' />
              )}
              <span className='hidden min-[420px]:inline'>{label}</span>
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function FileProgress({ file }: { file: QueuedFile }) {
  const failed = file.status === 'error'
  const step = currentStep(file)
  return (
    <div className='flex flex-col gap-2.5'>
      <div className='flex items-center gap-2 text-sm'>
        <span className='truncate font-medium flex-1' title={file.file.name}>
          {file.file.name}
        </span>
        <span className='text-xs text-muted-foreground shrink-0'>{formatBytes(file.file.size)}</span>
        <span
          className={cn(
            'text-sm font-bold tabular-nums shrink-0 w-12 text-right',
            failed ? 'text-destructive' : 'text-primary'
          )}
        >
          {failed ? '—' : `${Math.round(file.progress)}%`}
        </span>
      </div>

      <StepRow step={step} failed={failed} />

      <Progress
        value={failed ? 100 : file.progress}
        className={cn('h-3', failed && '[&>div]:bg-destructive')}
      />

      {failed ? (
        <p className='text-xs font-medium text-destructive'>{file.message ?? 'Conversion failed.'}</p>
      ) : (
        <p className='text-xs text-muted-foreground'>
          {file.status === 'queued'
            ? 'Waiting…'
            : file.status === 'done'
              ? 'Complete.'
              : (file.message ?? STEPS[step])}
        </p>
      )}
    </div>
  )
}

/**
 * Bold, standalone live-status card shown while a conversion runs (and kept
 * visible when it fails, so the error is impossible to miss).
 */
export default function ConversionProgress({ files }: { files: QueuedFile[] }) {
  const active = files.filter((f) => f.status !== 'done')
  if (active.length === 0) return null

  const failed = active.some((f) => f.status === 'error')
  const running = active.some((f) => f.status === 'processing')
  const processingIndex = files.findIndex((f) => f.status === 'processing')
  const currentFileNumber = processingIndex === -1 ? files.length : processingIndex + 1

  return (
    <Card
      className={cn(
        'border-2 shadow-lg',
        failed ? 'border-destructive/60 bg-destructive/5' : 'border-primary/60 bg-primary/5'
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(
            'flex items-center gap-2 text-base font-bold',
            failed && 'text-destructive'
          )}
        >
          {failed ? (
            <>
              <CircleX className='size-5' />
              Conversion failed
            </>
          ) : (
            <>
              <Loader2 className='size-5 animate-spin text-primary' />
              {running ? 'Converting…' : 'Preparing…'}
            </>
          )}
          <span className='ml-auto text-xs font-normal text-muted-foreground'>
            {files.length > 1 && `file ${currentFileNumber} of ${files.length}`}
          </span>
        </CardTitle>
        {!failed && (
          <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <ShieldCheck className='size-3.5 text-primary' />
            Everything is processed on your device — nothing leaves this tab.
          </p>
        )}
      </CardHeader>
      <CardContent className='flex flex-col gap-5'>
        {active.map((file) => (
          <FileProgress key={file.id} file={file} />
        ))}
      </CardContent>
    </Card>
  )
}
