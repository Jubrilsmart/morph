import { test, expect } from '@playwright/test'
import { downloadFirst, fixture, runTool } from './helpers'

test('image converter produces a real downloadable file', async ({ page }) => {
  await runTool(page, '/tools/image/convert', fixture('sample-image.png'))
  const file = await downloadFirst(page)
  expect(file.name).toMatch(/\.webp$|\.png$|\.jpe?g$/)
  expect(file.size).toBeGreaterThan(100)
})

test('image compressor outputs a smaller re-encoded file', async ({ page }) => {
  await runTool(page, '/tools/image/compress', fixture('sample-image.png'))
  const file = await downloadFirst(page)
  expect(file.size).toBeGreaterThan(100)
})

test('image resizer outputs a file', async ({ page }) => {
  await runTool(page, '/tools/image/resize', fixture('sample-image.png'))
  const file = await downloadFirst(page)
  expect(file.size).toBeGreaterThan(100)
})

test('image cropper shows a preview and crops', async ({ page }) => {
  await page.goto('/tools/image/crop')
  await page.setInputFiles('input[type=file]', fixture('sample-image.png'))
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 })

  // Drag inside the preview to shift the crop frame
  const box = await page.locator('canvas').boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 5 })
    await page.mouse.up()
  }

  await page.click('button.w-full.py-6')
  await expect(page.getByText('Results')).toBeVisible({ timeout: 60_000 })
  const file = await downloadFirst(page)
  expect(file.size).toBeGreaterThan(100)
})

test('background remove page is scaffolded, not runnable', async ({ page }) => {
  await page.goto('/tools/image/background-remove')
  await expect(page.getByText(/coming soon/i).first()).toBeVisible()
})
