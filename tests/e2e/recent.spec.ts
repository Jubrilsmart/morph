import { test, expect } from '@playwright/test'
import { fixture, realConsoleErrors, watchConsole } from './helpers'

test('a finished conversion appears in Recent and can be downloaded again', async ({ page }) => {
  test.setTimeout(120_000)
  const errors = watchConsole(page)

  // Run a fast conversion (image convert).
  await page.goto('/tools/image/convert')
  await page.setInputFiles('input[type=file]', fixture('sample-image.png'))
  await page.click('button.w-full.py-6')
  await expect(page.getByText('Results')).toBeVisible({ timeout: 60_000 })

  // The run is recorded on the Recent page. Navigate the way users do —
  // the sidebar link (client-side, so the in-flight OPFS write in
  // recordRun completes and the record flips to stored). A hard navigation
  // within milliseconds of completion would abort the byte write; the app
  // shows that case honestly as "not stored".
  await page.getByRole('link', { name: 'Recent Files' }).click()
  const row = page.locator('div.flex.items-center.gap-3', { hasText: 'sample-image' }).first()
  await expect(row).toBeVisible({ timeout: 15_000 })
  await expect(row.getByText(/Convert Image/)).toBeVisible()
  await expect(row.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 15_000 })

  // Re-download from storage — a real download event with the output name.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    row.getByRole('button', { name: 'Download' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.(webp|png)$/)

  // Deleting the entry empties the list.
  await row.getByRole('button', { name: /Remove/ }).click()
  await expect(page.getByText('No recent conversions yet')).toBeVisible()

  expect(realConsoleErrors(errors)).toEqual([])
})

test('recent is reachable from the sidebar and mobile nav links', async ({ page }) => {
  await page.goto('/tools')
  await expect(page.locator('a[href="/tools/recent"]').first()).toBeVisible()
  await expect(page.locator('a[href="/tools/settings"]').first()).toBeVisible()
})

test('settings page shows storage usage and clears history', async ({ page }) => {
  // Seed one record via a real run.
  await page.goto('/tools/image/convert')
  await page.setInputFiles('input[type=file]', fixture('sample-image.png'))
  await page.click('button.w-full.py-6')
  await expect(page.getByText('Results')).toBeVisible({ timeout: 60_000 })

  await page.goto('/tools/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText(/Used by this site/)).toBeVisible()
  // The retention select reflects the current setting (default: 25).
  await expect(
    page.locator('select').filter({ hasText: /Last 25 conversions/ })
  ).toHaveValue('25')

  await page.getByRole('button', { name: /Clear recent files/ }).click()
  await expect(page.getByText('Recent history cleared.')).toBeVisible()

  await page.goto('/tools/recent')
  await expect(page.getByText('No recent conversions yet')).toBeVisible()
})
