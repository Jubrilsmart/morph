import { defineConfig } from '@playwright/test'

// E2E runs against a production build on port 3100 so it never collides with
// a dev server on 3000. Point PLAYWRIGHT_CHROMIUM_PATH at another Chromium if
// the system one (/usr/bin/chromium) isn't present on your machine.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1, // the video engine is heavy; run serially
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3100',
    headless: true,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
  },
  webServer: {
    command: 'yarn build && yarn start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 420_000,
  },
})
