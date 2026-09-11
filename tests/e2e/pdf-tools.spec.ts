import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { PDFDocument } from 'pdf-lib'
import { downloadFirst, fixture, runTool } from './helpers'

test('merge combines two PDFs into one with all pages', async ({ page }) => {
  await runTool(page, '/tools/pdf/merge', fixture('test-a.pdf', 'test-b.pdf'))
  const file = await downloadFirst(page)

  expect(file.name).toBe('merged.pdf')
  const merged = await PDFDocument.load(file.bytes(), { ignoreEncryption: true })
  expect(merged.getPageCount()).toBe(5)
})

test('split by ranges produces one file per range', async ({ page }) => {
  await page.goto('/tools/pdf/split')
  await page.setInputFiles('input[type=file]', fixture('test-a.pdf'))
  await page.selectOption('select', 'ranges')
  await page.locator('input[placeholder*="e.g."]').fill('1-2,3')
  await page.click('button.w-full.py-6')

  await expect(page.getByText('Results')).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('a[download]')).toHaveCount(2)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('a[download]').first().click(),
  ])
  expect(download.suggestedFilename()).toBe('test-a-pages-1-2.pdf')
  const part = await PDFDocument.load(fs.readFileSync(await download.path()), {
    ignoreEncryption: true,
  })
  expect(part.getPageCount()).toBe(2)
})

test('image to PDF embeds the image as a page', async ({ page }) => {
  await runTool(page, '/tools/pdf/image-to-pdf', fixture('sample-image.png'))
  const file = await downloadFirst(page)

  const pdf = await PDFDocument.load(file.bytes(), { ignoreEncryption: true })
  expect(pdf.getPageCount()).toBe(1)
})

test('PDF to image renders one download per page', async ({ page }) => {
  await runTool(page, '/tools/pdf/pdf-to-image', fixture('test-a.pdf'))
  await expect(page.locator('a[download]')).toHaveCount(3)
})

test('rotate turns every page by 90 degrees', async ({ page }) => {
  await runTool(page, '/tools/pdf/rotate', fixture('test-a.pdf'))
  const file = await downloadFirst(page)

  const pdf = await PDFDocument.load(file.bytes(), { ignoreEncryption: true })
  for (const page of pdf.getPages()) {
    expect(page.getRotation().angle).toBe(90)
  }
})

test('PDF to DOCX produces a real zip (docx) file', async ({ page }) => {
  await runTool(page, '/tools/pdf/pdf-to-docx', fixture('test-a.pdf'))
  const file = await downloadFirst(page)

  expect(file.name.endsWith('.docx')).toBe(true)
  // DOCX is a zip archive — check the PK magic bytes
  expect([...file.bytes().slice(0, 2)]).toEqual([0x50, 0x4b])
  expect(file.size).toBeGreaterThan(1000)
})
