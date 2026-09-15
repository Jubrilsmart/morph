import { describe, it, expect, vi } from 'vitest'
import { execFfmpeg, toEngineError } from '@/lib/engines/ffmpeg'
import type { ProgressCallback } from '@/lib/engines/types'

type FFmpeg = import('@ffmpeg/ffmpeg').FFmpeg
type Listener = (event: unknown) => void

/**
 * A fake FFmpeg instance recording on/off calls. `execImpl` decides how the
 * exec promise behaves (success, non-zero exit, wasm crash, hang).
 */
function makeFfmpeg(execImpl: (args: string[]) => Promise<number> = async () => 0) {
  const listeners: Record<'log' | 'progress', Listener[]> = { log: [], progress: [] }
  return {
    loaded: true,
    on: vi.fn((event: 'log' | 'progress', cb: Listener) => {
      listeners[event].push(cb)
    }),
    off: vi.fn((event: 'log' | 'progress', cb: Listener) => {
      listeners[event] = listeners[event].filter((f) => f !== cb)
    }),
    exec: vi.fn(execImpl),
    terminate: vi.fn(),
    /** Test hook: emit a core event the way the real worker does. */
    emit(event: 'log' | 'progress', data: unknown) {
      listeners[event].forEach((f) => f(data))
    },
  }
}

const asInstance = (fake: ReturnType<typeof makeFfmpeg>) => fake as unknown as FFmpeg
const noopProgress: ProgressCallback = () => {}

describe('toEngineError', () => {
  it('maps wasm out-of-bounds traps to a memory message', () => {
    const error = toEngineError('RuntimeError: memory access out of bounds')
    expect(error.message).toMatch(/out of memory/i)
  })

  it('keeps the message of plain-string rejections', () => {
    // The ffmpeg.wasm worker rejects with e.toString(), not an Error.
    expect(toEngineError('aborted: CompileError').message).toBe('aborted: CompileError')
  })

  it('falls back to a generic message for empty rejections', () => {
    expect(toEngineError(undefined).message).toMatch(/could not process/i)
  })
})

describe('execFfmpeg', () => {
  it('resolves on exit code 0 and reports progress in the 20–99 band', async () => {
    const onProgress = vi.fn()
    const fake = makeFfmpeg(() => {
      fake.emit('progress', { progress: 0 })
      fake.emit('progress', { progress: 0.5 })
      return Promise.resolve(0)
    })

    await execFfmpeg(asInstance(fake), ['-i', 'a.mp4', 'a.mp4'], 3, onProgress, {
      message: 'Converting…',
    })

    expect(fake.terminate).not.toHaveBeenCalled()
    // fileIndex passthrough; progress 0 → 20, progress 0.5 → 59.5 (of 20–99)
    expect(onProgress).toHaveBeenCalledWith(3, 20, 'Converting…')
    expect(onProgress).toHaveBeenCalledWith(3, 59.5, 'Converting…')
  })

  it('rejects non-zero exit codes without terminating the (still-usable) core', async () => {
    const fake = makeFfmpeg(async () => 1)
    await expect(
      execFfmpeg(asInstance(fake), [], 0, noopProgress)
    ).rejects.toThrow(/could not process this file/)
    expect(fake.terminate).not.toHaveBeenCalled()
  })

  it('terminates the poisoned worker when exec rejects with a wasm crash string', async () => {
    const fake = makeFfmpeg(() => Promise.reject('RuntimeError: memory access out of bounds'))
    await expect(execFfmpeg(asInstance(fake), [], 0, noopProgress)).rejects.toThrow(
      /out of memory/i
    )
    expect(fake.terminate).toHaveBeenCalledTimes(1)
  })

  it('times out a hung exec via the inactivity watchdog and terminates the worker', async () => {
    const fake = makeFfmpeg(() => new Promise<number>(() => {}))
    await expect(
      execFfmpeg(asInstance(fake), [], 0, noopProgress, { watchdogMs: 120 })
    ).rejects.toThrow(/stopped responding/i)
    expect(fake.terminate).toHaveBeenCalledTimes(1)
  })

  it('does not fire the watchdog while the engine keeps reporting activity', async () => {
    // exec resolves after 300ms; the fake emits a log line every 40ms so the
    // 100ms watchdog must never trip.
    const fake = makeFfmpeg(
      () =>
        new Promise<number>((resolve) => {
          const beats = setInterval(() => fake.emit('log', { message: 'frame= 42' }), 40)
          setTimeout(() => {
            clearInterval(beats)
            resolve(0)
          }, 300)
        })
    )
    await expect(
      execFfmpeg(asInstance(fake), [], 0, noopProgress, { watchdogMs: 100 })
    ).resolves.toBeUndefined()
    expect(fake.terminate).not.toHaveBeenCalled()
  })

  it('removes its log and progress listeners when the run ends', async () => {
    const fake = makeFfmpeg()
    await execFfmpeg(asInstance(fake), [], 0, noopProgress)
    expect(fake.off).toHaveBeenCalledWith('log', expect.any(Function))
    expect(fake.off).toHaveBeenCalledWith('progress', expect.any(Function))
  })
})
