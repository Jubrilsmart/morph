'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CircleCheck, CircleX, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'
import type { QueuedFile } from './ToolWorkspace'

export type RunStatus = 'running' | 'success' | 'error'

/**
 * Progress convention shared with the engines:
 * 0–9 reading the file, 10–19 loaded/prepared, 20–99 processing (convert,
 * compress, merge…), 100 complete. Each phase renders as its own card that
 * appears sequentially; the processing card carries a bar normalized to
 * 0–100% for that step alone.
 */
export function stepFromProgress(progress: number): number {
  if (progress >= 20) return 2
  if (progress >= 10) return 1
  return 0
}

/** Bar value inside the processing step (overall progress 20 → 100). */
function processingBar(progress: number): number {
  return Math.min(100, Math.max(0, ((progress - 20) / 80) * 100))
}

type StepState = 'done' | 'active' | 'failed'

function StepCard({
  label,
  state,
  bar,
  message,
}: {
  label: string
  state: StepState
  bar?: number
  message?: string
}) {
  return (
    <Card
      className={cn(
        'gap-2 py-3.5 transition-colors',
        state === 'done' && 'border-border/70 bg-card/60',
        state === 'active' && 'border-primary/60 bg-primary/5 shadow-md',
        state === 'failed' && 'border-destructive/60 bg-destructive/5'
      )}
    >
      <CardContent className='flex items-center gap-2.5 px-4 py-0'>
        {state === 'done' ? (
          <CircleCheck className='size-5 shrink-0 text-green-500' />
        ) : state === 'failed' ? (
          <CircleX className='size-5 shrink-0 text-destructive' />
        ) : (
          <Loader2 className='size-5 shrink-0 animate-spin text-primary' />
        )}
        <span
          className={cn(
            'text-sm font-semibold',
            state === 'active' && 'text-primary',
            state === 'failed' && 'text-destructive',
            state === 'done' && 'text-muted-foreground'
          )}
        >
          {label}
        </span>
        {state === 'active' && bar !== undefined && (
          <span className='ml-auto text-sm font-bold tabular-nums text-primary'>
            {Math.round(bar)}%
          </span>
        )}
      </CardContent>
      {state === 'active' && bar !== undefined && (
        <CardContent className='flex flex-col gap-1.5 px-4 py-0'>
          <Progress value={bar} className='h-3' />
          {message && <p className='text-xs text-muted-foreground'>{message}</p>}
        </CardContent>
      )}
      {state === 'failed' && message && (
        <CardContent className='px-4 py-0'>
          <p className='text-xs font-medium text-destructive'>{message}</p>
        </CardContent>
      )}
    </Card>
  )
}

function FinishedFile({ file }: { file: QueuedFile }) {
  return (
    <Card className='gap-0 border-border/50 bg-card/40 py-2.5'>
      <CardContent className='flex items-center gap-2.5 px-4 py-0'>
        <CircleCheck className='size-4 shrink-0 text-green-500' />
        <span className='truncate text-sm text-muted-foreground' title={file.file.name}>
          {file.file.name}
        </span>
        <span className='ml-auto shrink-0 text-xs text-muted-foreground'>
          {formatBytes(file.file.size)}
        </span>
      </CardContent>
    </Card>
  )
}

/**
 * Sequential per-step progress cards shown from the moment a run starts.
 * Stays visible after success (one-line recap) and after failure (the failed
 * step card with the error message) until files change or a new run starts.
 */
export default function ConversionProgress({
  files,
  processLabel,
  status,
}: {
  files: QueuedFile[]
  processLabel: string
  status: RunStatus
}) {
  const steps = ['Reading file', 'Loaded', processLabel, 'Complete']

  if (status === 'success') {
    return (
      <Card className='gap-0 border-green-500/50 bg-green-500/5 py-3' aria-live='polite'>
        <CardContent className='flex items-center gap-2.5 px-4 py-0'>
          <CircleCheck className='size-5 shrink-0 text-green-500' />
          <span className='text-sm font-semibold'>
            Complete — {files.length} file{files.length === 1 ? '' : 's'} processed
          </span>
        </CardContent>
      </Card>
    )
  }

  const errorFile = files.find((f) => f.status === 'error')
  const errorIdx = errorFile ? files.indexOf(errorFile) : -1
  // The file currently being worked on: first that hasn't reached 100%.
  const currentIdx = files.findIndex((f) => f.progress < 100 && f.status !== 'error')
  const current = !errorFile && currentIdx >= 0 ? files[currentIdx] : undefined
  const cursor = errorFile ? errorIdx : currentIdx
  const finished = cursor > 0 ? files.slice(0, cursor) : []
  const waiting = cursor >= 0 ? files.slice(cursor + 1) : []

  return (
    <div className='flex flex-col gap-3' aria-live='polite'>
      {finished.map((file) => (
        <FinishedFile key={file.id} file={file} />
      ))}

      {errorFile ? (
        <>
          {steps.slice(0, stepFromProgress(errorFile.progress)).map((label) => (
            <StepCard key={label} label={label} state='done' />
          ))}
          <StepCard
            label={steps[stepFromProgress(errorFile.progress)] ?? processLabel}
            state='failed'
            message={errorFile.message ?? 'Conversion failed.'}
          />
        </>
      ) : current ? (
        <>
          {steps.slice(0, stepFromProgress(current.progress)).map((label) => (
            <StepCard key={label} label={label} state='done' />
          ))}
          <StepCard
            label={steps[stepFromProgress(current.progress)]}
            state='active'
            bar={stepFromProgress(current.progress) === 2 ? processingBar(current.progress) : undefined}
            message={stepFromProgress(current.progress) === 2 ? current.message : undefined}
          />
        </>
      ) : (
        // All files reached 100% but the run hasn't resolved yet (final write)
        <>
          {steps.slice(0, 3).map((label) => (
            <StepCard key={label} label={label} state='done' />
          ))}
          <StepCard label={steps[3]} state='active' />
        </>
      )}

      {waiting.length > 0 && (
        <p className='px-1 text-xs text-muted-foreground'>
          {waiting.length} more file{waiting.length === 1 ? '' : 's'} waiting
        </p>
      )}
      {status === 'running' && (
        <p className='flex items-center gap-1.5 px-1 text-xs text-muted-foreground'>
          <ShieldCheck className='size-3.5 text-primary' />
          Everything is processed on your device — nothing leaves this tab.
        </p>
      )}
    </div>
  )
}
