import { test, expect } from '@playwright/test'

test('PWA manifest is linked and well-formed', async ({ page }) => {
  await page.goto('/tools')

  const manifestUrl = await page.evaluate(() => {
    const link = document.querySelector('link[rel="manifest"]')
    return link instanceof HTMLLinkElement ? link.href : null
  })
  expect(manifestUrl).toContain('/manifest.webmanifest')

  const response = await page.request.get('/manifest.webmanifest')
  expect(response.ok()).toBe(true)
  const manifest = await response.json()
  expect(manifest.name.toLowerCase()).toContain('morph')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.length).toBeGreaterThan(0)
})

test('page is cross-origin isolated (enables multi-threaded wasm)', async ({ page }) => {
  await page.goto('/tools')
  await expect
    .poll(() => page.evaluate(() => window.crossOriginIsolated))
    .toBe(true)
})

test('service worker and wasm assets are served', async ({ page }) => {
  const sw = await page.request.get('/sw.js')
  expect(sw.ok()).toBe(true)
  expect((await sw.text()).length).toBeGreaterThan(100)

  for (const asset of [
    '/ffmpeg/single/ffmpeg-core.wasm',
    '/ffmpeg/mt/ffmpeg-core.wasm',
    '/pdf.worker.min.mjs',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
  ]) {
    const response = await page.request.get(asset)
    expect(response.ok(), asset).toBe(true)
  }
})
