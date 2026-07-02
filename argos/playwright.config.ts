import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  timeout: 60_000,
  retries: 1,
  workers: 4,
  reporter: [
    ['list'],
    [
      '@argos-ci/playwright/reporter',
      { uploadToArgos: !!process.env.ARGOS_TOKEN || !!process.env.CI },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:6006',
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: ['--disable-lcd-text', '--font-render-hinting=none'],
    },
  },
  webServer: {
    command:
      'npx http-server ../libs/ui-react/storybook-static --port 6006 --silent',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
