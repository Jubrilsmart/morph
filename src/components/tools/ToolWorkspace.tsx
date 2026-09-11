'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress' // created below
import {
  CircleCheck,
  CircleX,
  Download,
  FileUp,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/format'
import type { EngineRun, OutputFile } from '@/lib/engines/types'
import ConversionProgress from './ConversionProgress'

export interface QueuedFile {
  id: string
  file: File
  status: 'queued' | 'processing' | 'done' | 'error'
  progress: number
  message?: string
}

export interface WorkspaceOutput extends OutputFile {
  url: string
}

interface ToolWorkspaceProps {
  accept: string
  multiple?: boolean
  minFiles?: number
  run: EngineRun
  options?: React.ReactNode | ((files: File[]) => React.ReactNode)
  runLabel?: string
  runDisabled?: boolean
  scaffold?: boolean
  hint?: string
}

export default function ToolWorkspace({
  accept,
  multiple = true,
  minFiles = 1,
  run,
  options,
  runLabel = 'Convert',
  runDisabled = false,
  scaffold = false,
  hint,
}: ToolWorkspaceProps) {
  const [files, setFiles] = useState<QueuedFile[]>([])
  const [outputs, setOutputs] = useState<WorkspaceOutput[]>([])
  const [running, setRunning] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const outputsRef = useRef<WorkspaceOutput[]>([])
  useEffect(() => {
    outputsRef.current = outputs
  }, [outputs])

  // Revoke object URLs when unmounted or outputs replaced
  useEffect(() => {
    return () => {
      outputsRef.current.forEach((output) => URL.revokeObjectURL(output.url))
    }
  }, [])

  const clearOutputs = useCallback(() => {
    outputsRef.current.forEach((output) => URL.revokeObjectURL(output.url))
    setOutputs([])
  }, [])

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming)
      if (list.length === 0) return
      if (!multiple) {
        clearOutputs()
        setFiles(list.slice(0, 1).map((file) => ({ id: crypto.randomUUID(), file, status: 'queued' as const, progress: 0 })))
        return
      }
      clearOutputs()
      setFiles((prev) => [
        ...prev,
        ...list.map((file) => ({ id: crypto.randomUUID(), file, status: 'queued' as const, progress: 0 })),
      ])
    },
    [multiple, clearOutputs]
  )

  const removeFile = useCallback(
    (id: string) => {
      clearOutputs()
      setFiles((prev) => prev.filter((f) => f.id !== id))
    },
    [clearOutputs]
  )

  const clearAll = useCallback(() => {
    clearOutputs()
    setFiles([])
  }, [clearOutputs])

  const updateFile = useCallback((index: number, patch: Partial<QueuedFile>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }, [])

  const handleRun = useCallback(async () => {
    if (files.length < minFiles) {
      toast.error(minFiles > 1 ? `Select at least ${minFiles} files.` : 'Select a file first.')
      return
    }
    setRunning(true)
    clearOutputs()
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'queued', progress: 0, message: undefined })))
    try {
      const results = await run(
        files.map((f) => f.file),
        (index, progress, message) => updateFile(index, { status: 'processing', progress, message })
      )
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'done', progress: 100 })))
      const withUrls = results.map((result) => ({ ...result, url: URL.createObjectURL(result.blob) }))
      setOutputs(withUrls)
      toast.success(
        withUrls.length === 1
          ? `Done — ${withUrls[0].name} is ready.`
          : `Done — ${withUrls.length} files are ready.`
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Conversion failed.'
      setFiles((prev) => prev.map((f) => (f.status === 'processing' ? { ...f, status: 'error', message } : f)))
      toast.error(message)
    } finally {
      setRunning(false)
    }
  }, [files, minFiles, run, updateFile, clearOutputs])

  const downloadAll = useCallback(() => {
    outputs.forEach((output, index) => {
      setTimeout(() => {
        const anchor = document.createElement('a')
        anchor.href = output.url
        anchor.download = output.name
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }, index * 350)
    })
  }, [outputs])

  const canRun = !scaffold && !running && !runDisabled && files.length >= minFiles

  return (
    <div className='flex flex-col gap-6'>
      {/* Dropzone */}
      <div
        role='button'
        tabIndex={0}
        aria-label='Drop files here or click to browse'
        onClick={() => !scaffold && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !scaffold) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!scaffold) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!scaffold) addFiles(e.dataTransfer.files)
        }}
        className={cn(
          'w-full rounded-xl border-2 border-dashed border-primary p-8 flex flex-col justify-center items-center gap-2 text-center transition-colors',
          dragging ? 'bg-primary/10' : 'bg-background hover:bg-accent/30',
          scaffold && 'opacity-50 pointer-events-none'
        )}
      >
        <div className='p-3.75 bg-primary/20 rounded-full'>
          <FileUp className='h-4.5 w-4.5 text-primary' />
        </div>
        <p className='text-sm font-medium'>Drag and drop {multiple ? 'files' : 'a file'} here</p>
        <p className='text-xs text-muted-foreground'>
          {scaffold ? 'This engine is not available yet.' : hint ?? 'or click to browse — files stay on your device'}
        </p>
        <input
          ref={inputRef}
          type='file'
          accept={accept}
          multiple={multiple}
          className='hidden'
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {/* Options */}
      {options && (
        <div className={cn(running && 'pointer-events-none opacity-60')}>
          {typeof options === 'function' ? options(files.map((f) => f.file)) : options}
        </div>
      )}

      {/* Queue */}
      {files.length > 0 && (
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>Files ({files.length})</CardTitle>
            <Button variant='ghost' size='sm' onClick={clearAll} disabled={running}>
              <Trash2 className='size-3.5' />
              Clear all
            </Button>
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {files.map((item) => (
              <div key={item.id} className='flex flex-col gap-1.5'>
                <div className='flex items-center gap-3 text-sm'>
                  {item.status === 'done' ? (
                    <CircleCheck className='size-4 shrink-0 text-green-500' />
                  ) : item.status === 'error' ? (
                    <CircleX className='size-4 shrink-0 text-destructive' />
                  ) : item.status === 'processing' ? (
                    <Loader2 className='size-4 shrink-0 animate-spin text-primary' />
                  ) : (
                    <FileUp className='size-4 shrink-0 text-muted-foreground' />
                  )}
                  <span className='truncate flex-1' title={item.file.name}>{item.file.name}</span>
                  <span className='text-xs text-muted-foreground shrink-0'>{formatBytes(item.file.size)}</span>
                  <button
                    aria-label={`Remove ${item.file.name}`}
                    onClick={() => removeFile(item.id)}
                    disabled={running}
                    className='text-muted-foreground hover:text-destructive disabled:opacity-40 shrink-0'
                  >
                    <X className='size-4' />
                  </button>
                </div>
                {(item.status === 'processing' || item.message) && (
                  <div className='flex items-center gap-2 text-xs text-muted-foreground pl-7'>
                    {item.status === 'processing' && (
                      <Progress value={item.progress} className='h-1.5 flex-1' />
                    )}
                    {item.message}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Run */}
      <Button
        size='lg'
        className='w-full py-6 hover:cursor-pointer'
        disabled={!canRun}
        onClick={handleRun}
      >
        {running ? (
          <>
            <Loader2 className='animate-spin' />
            Processing…
          </>
        ) : (
          runLabel
        )}
      </Button>

      {/* Live conversion progress — bold standalone card while running, kept on failure */}
      {(running || files.some((f) => f.status === 'error')) && <ConversionProgress files={files} />}

      {/* Results */}
      {outputs.length > 0 && (
        <Card className='border-primary/40 bg-primary/5'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle className='text-base'>Results</CardTitle>
            {outputs.length > 1 && (
              <Button variant='outline' size='sm' onClick={downloadAll}>
                <Download className='size-3.5' />
                Download all
              </Button>
            )}
          </CardHeader>
          <CardContent className='flex flex-col gap-3'>
            {outputs.map((output) => (
              <div key={output.url} className='flex items-center gap-3 text-sm'>
                <CircleCheck className='size-4 shrink-0 text-green-500' />
                <span className='truncate flex-1'>{output.name}</span>
                <span className='text-xs text-muted-foreground shrink-0'>{formatBytes(output.blob.size)}</span>
                <a
                  href={output.url}
                  download={output.name}
                  className='shrink-0'
                >
                  <Button size='sm'>
                    <Download className='size-3.5' />
                    Download
                  </Button>
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
