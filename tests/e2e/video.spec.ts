import { test, expect, type Page } from '@playwright/test'
import { downloadFirst, fixture, realConsoleErrors, watchConsole } from './helpers'

const STEP_LABELS = ['Reading file', 'Loaded', 'Converting', 'Complete'] as const

/**
 * Samples the page while a run is in flight and records which step cards
 * were visible. The video engine is the best window for this: wasm load,
 * file write and a multi-second conversion each take real time.
 */
async function observeSteps(page: Page): Promise<Set<string>> {
  const seen = new Set<string>()
  const deadline = Date.now() + 240_000
  while (Date.now() < deadline) {
    if (await page.getByText('Results').isVisible().catch(() => false)) break
    const text = await page.evaluate(() => document.body.innerText)
    for (const label of STEP_LABELS) {
      if (text.includes(label)) seen.add(label)
    }
    await page.waitForTimeout(200)
  }
  return seen
}

test('video converter runs in wasm and downloads a real output', async ({ page }) => {
  test.setTimeout(300_000)
  const errors = watchConsole(page)

  await page.goto('/tools/video/converter')
  await page.setInputFiles('input[type=file]', fixture('sample.mp4'))
  await page.click('button.w-full.py-6')

  const seen = await observeSteps(page)

  // Sequential step cards appeared during the run.
  expect(seen.has('Converting')).toBe(true)
  expect([...seen].length).toBeGreaterThanOrEqual(2)

  await expect(page.getByText('Results')).toBeVisible({ timeout: 60_000 })
  const file = await downloadFirst(page)
  expect(file.size).toBeGreaterThan(1000)
  expect(file.name).toMatch(/\.(mp4|mov|mkv)$/)

  expect(realConsoleErrors(errors)).toEqual([])
})

test('converting card carries its own 0-100 progress bar', async ({ page }) => {
  test.setTimeout(240_000)

  await page.goto('/tools/video/converter')
  // The 12s clip keeps the encode phase running for several seconds so the
  // active Converting card (with its bar) is reliably observable.
  await page.setInputFiles('input[type=file]', fixture('sample-long.mp4'))
  await page.click('button.w-full.py-6')

  // Wait for the Converting step card (a card containing a progress bar),
  // then sample the percentage it reports while the run is in flight.
  // Everything is read via page.evaluate — locator actions auto-wait, and
  // the card unmounts when the run finishes, which would hang the loop.
  const hasConvertingBar = () =>
    page.evaluate(() => {
      const cards = [...document.querySelectorAll<HTMLElement>('[data-slot="card"]')]
      return cards.some(
        (card) => card.innerText.includes('Converting') && card.querySelector('[role="progressbar"]') !== null
      )
    })
  await expect
    .poll(hasConvertingBar, { timeout: 200_000, intervals: [150, 250, 250, 500, 1000] })
    .toBe(true)

  const percentages: number[] = []
  const deadline = Date.now() + 180_000
  while (Date.now() < deadline) {
    const text = await page.evaluate(() => document.body.innerText)
    if (text.includes('Converting')) {
      const match = text.match(/(\d{1,3})\s*%/)
      if (match) percentages.push(Number(match[1]))
    }
    if (text.includes('Results')) break
    await page.waitForTimeout(250)
  }

  expect(percentages.length).toBeGreaterThan(0)
  expect(Math.max(...percentages)).toBeLessThanOrEqual(100)
  expect(Math.min(...percentages)).toBeGreaterThanOrEqual(0)
})

test('converts a VP8/VP9 webm input to mp4 and survives a second run', async ({ page }) => {
  test.setTimeout(300_000)
  const errors = watchConsole(page)

  // VP8/VP9 *decoding* works in the wasm core (only encoding is broken), so
  // webm must convert to mp4 like any other input.
  await page.goto('/tools/video/converter')
  await page.setInputFiles('input[type=file]', fixture('sample.webm'))
  await page.click('button.w-full.py-6')
  await expect(page.getByText('Results')).toBeVisible({ timeout: 120_000 })
  const webmRun = await downloadFirst(page)
  expect(webmRun.name).toMatch(/\.mp4$/)
  expect(webmRun.bytes().subarray(4, 8).toString('latin1')).toBe('ftyp')

  // The engine singleton must stay usable after a successful run.
  await page.setInputFiles('input[type=file]', fixture('sample.mp4'))
  await page.click('button.w-full.py-6')
  await expect(page.getByText('Results')).toBeVisible({ timeout: 120_000 })

  expect(realConsoleErrors(errors)).toEqual([])
})
