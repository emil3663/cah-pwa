// Playwright test: PW-01 — manifest.json is valid and parseable
const { test, expect } = require('@playwright/test');

test.describe('3-7-pwa - PW-01', () => {
  test('PW-01: manifest.json valid', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response.ok()).toBeTruthy();
    const manifest = await response.json();
    expect(manifest).toHaveProperty('name', 'Cards Against Humanity');
    expect(manifest).toHaveProperty('short_name', 'CAH');
    expect(manifest).toHaveProperty('display', 'standalone');
    expect(manifest).toHaveProperty('start_url');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(1);
    // Verify icons reference existing files
    for (const icon of manifest.icons) {
      const iconResp = await page.goto('/' + icon.src);
      expect(iconResp.ok()).toBeTruthy();
    }
  });
});