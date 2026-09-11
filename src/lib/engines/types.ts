export interface OutputFile {
  name: string
  blob: Blob
}

/** Progress is 0-100 per input file index. */
export type ProgressCallback = (fileIndex: number, progress: number, message?: string) => void

export type EngineRun = (files: File[], onProgress: ProgressCallback) => Promise<OutputFile[]>

export class EngineError extends Error {}
