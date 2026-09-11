import { test, expect } from '@playwright/test'
import { realConsoleErrors, watchConsole } from './helpers'

test('landing page renders hero, nav and FAQ without console errors', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/')

  await expect(page.locator('nav')).toBeVisible()
  await expect(page.getByText('Completely Offline').first()).toBeVisible()
  await expect(page.locator('#faq')).toBeVisible()

  // Give late errors (hydration, chunk loads) a moment to surface.
  await page.waitForTimeout(1500)
  expect(realConsoleErrors(errors)).toEqual([])
})

test('hero CTA navigates to the tools hub', async ({ page }) => {
  await page.goto('/')
  // The CTA is a Button rendered as a link, so Base UI exposes it with
  // button semantics — see the nativeButton handling in ui/button.tsx.
  await page.getByRole('button', { name: 'Start Converting' }).first().click()
  await expect(page).toHaveURL(/\/tools$/)
})

test('no Base UI nativeButton warning anywhere on the page', async ({ page }) => {
  const errors = watchConsole(page)
  await page.goto('/')
  await page.waitForTimeout(1500)
  expect(errors.some((text) => text.includes('nativeButton'))).toBe(false)
})
