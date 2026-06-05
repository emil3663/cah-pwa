// Playwright configuration for CAH-pwa
// Docs: https://playwright.dev/docs/test-configuration

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  webServer: {
    command: 'npx http-server . -p 8081 --cors -c-1',
    port: 8081,
    timeout: 10000,
    reuseExistingServer: false,
  },
  use: {
    headless: true,
    baseURL: 'http://localhost:8081',
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
};

module.exports = config;