import { test, expect } from '@playwright/test'
import { downloadFirst, fixture, runTool } from './helpers'

test('DOCX to PDF renders the document and produces a real PDF', async ({ page }) => {
  await runTool(page, '/tools/pdf/docx-to-pdf', fixture('test.docx'), 180_000)
  const file = await downloadFirst(page)

  expect(file.name).toBe('test.pdf')
  expect(file.size).toBeGreaterThan(1000)
  // PDF magic bytes
  expect(file.bytes().subarray(0, 5).toString()).toBe('%PDF-')
})

test('DOCX to PDF shows the sequential step cards', async ({ page }) => {
  await page.goto('/tools/pdf/docx-to-pdf')
  await page.setInputFiles('input[type=file]', fixture('test.docx'))
  await page.click('button.w-full.py-6')

  // The processing card must be visible at some point during the run.
  await expect(page.getByText('Rendering document', { exact: false })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('Results')).toBeVisible({ timeout: 180_000 })
})
