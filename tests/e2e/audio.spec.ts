import { test, expect } from '@playwright/test'
import { downloadFirst, fixture, realConsoleErrors, watchConsole } from './helpers'

test('extract audio from a video as mp3', async ({ page }) => {
  test.setTimeout(180_000)
  const errors = watchConsole(page)

  await page.goto('/tools/video/audio')
  await page.setInputFiles('input[type=file]', fixture('sample.mp4'))
  await page.click('button.w-full.py-6')

  await expect(page.getByText('Results')).toBeVisible({ timeout: 120_000 })
  const file = await downloadFirst(page)

  expect(file.name).toMatch(/\.mp3$/)
  expect(file.size).toBeGreaterThan(1000)
  // MP3 files written by lame start with an ID3v2 tag.
  expect(file.bytes().subarray(0, 3).toString('latin1')).toBe('ID3')

  expect(realConsoleErrors(errors)).toEqual([])
})

test('extracts lossless wav when selected', async ({ page }) => {
  test.setTimeout(180_000)

  await page.goto('/tools/video/audio')
  await page.locator('select').first().selectOption('wav')
  await page.setInputFiles('input[type=file]', fixture('sample.mp4'))
  await page.click('button.w-full.py-6')

  await expect(page.getByText('Results')).toBeVisible({ timeout: 120_000 })
  const file = await downloadFirst(page)

  expect(file.name).toMatch(/\.wav$/)
  expect(file.bytes().subarray(0, 4).toString('latin1')).toBe('RIFF')
})
