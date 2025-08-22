import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL || 'https://www.hexly-faq.ru/'

export default defineConfig({
  testDir: './tests/e2e',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})


