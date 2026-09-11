import { test, expect } from '@playwright/test'

test('hub lists every tool from the registry', async ({ page }) => {
  await page.goto('/tools')

  const toolHrefs = [
    '/tools/video/converter',
    '/tools/video/compressor',
    '/tools/image/convert',
    '/tools/image/compress',
    '/tools/image/resize',
    '/tools/image/crop',
    '/tools/image/background-remove',
    '/tools/pdf/image-to-pdf',
    '/tools/pdf/pdf-to-image',
    '/tools/pdf/docx-to-pdf',
    '/tools/pdf/pdf-to-docx',
    '/tools/pdf/merge',
    '/tools/pdf/split',
    '/tools/pdf/rotate',
  ]
  for (const href of toolHrefs) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(1)
  }
})

test('hub greets the user', async ({ page }) => {
  await page.goto('/tools')
  await expect(page.getByText(/Good (Morning|Afternoon|Evening)/)).toBeVisible()
})

test('category page lists its tools and links back', async ({ page }) => {
  await page.goto('/tools/pdf')
  await expect(page.getByRole('link', { name: 'Merge PDF' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'All tools' })).toBeVisible()
})

test('sidebar search filters tools', async ({ page }) => {
  await page.goto('/tools')
  const search = page.getByPlaceholder(/search/i)

  await search.fill('merge')
  await expect(page.getByText(/No tools match/)).toHaveCount(0)
  expect(
    await page.locator('[data-sidebar="sidebar"] a', { hasText: 'Merge PDF' }).count()
  ).toBeGreaterThan(0)

  await search.fill('zzzz-nothing')
  await expect(page.getByText(/No tools match/)).toBeVisible()
})
