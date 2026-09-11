import path from 'node:path'
import fs from 'node:fs'
import { expect, type Page } from '@playwright/test'

export const RUN_BUTTON = 'button.w-full.py-6'

export const fixture = (...names: string[]): string[] =>
  names.map((name) => path.join(process.cwd(), 'tests/fixtures', name))

export function watchConsole(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (message) => {
    // Network failures are captured below with their URL attached; the
    // raw console text carries no URL and can't be filtered precisely.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => errors.push(String(error)))
  // Chrome's network errors don't name the resource — annotate them with
  // the failing URL so the filter below can be precise.
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errors.push(
        `Failed to load resource: ${response.status()} (${response.request().method()} ${response.url()})`
      )
    }
  })
  return errors
}

export function realConsoleErrors(errors: string[]): string[] {
  return errors.filter(
    (text) =>
      !text.includes('favicon') &&
      !text.includes('Download the React DevTools') &&
      // Safety net: src/app/favicon.ico covers Chrome's default /favicon.ico
      // request, but older caches/hard refreshes can still miss it.
      !/GET .+\/favicon\.ico/.test(text)
  )
}

/** Uploads files, clicks run, and waits for the Results card. */
export async function runTool(page: Page, url: string, files: string[], timeout = 120_000) {
  await page.goto(url)
  await page.setInputFiles('input[type=file]', files)
  await page.click(RUN_BUTTON)
  await expect(page.getByText('Results')).toBeVisible({ timeout })
}

export interface DownloadedFile {
  name: string
  size: number
  bytes: () => Buffer
}

/** Clicks the first Download link and returns the downloaded file. */
export async function downloadFirst(page: Page): Promise<DownloadedFile> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('a[download]').first().click(),
  ])
  const name = download.suggestedFilename()
  const tempPath = await download.path()
  return {
    name,
    size: fs.statSync(tempPath).size,
    bytes: () => fs.readFileSync(tempPath),
  }
}
