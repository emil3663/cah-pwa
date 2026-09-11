// Playwright tests for seedable Authentication/Landing tests
// Tests that can run without Firebase: LG-18, LG-19, LG-20, LG-23
const { test, expect } = require('@playwright/test');
const { seedRegressionProfile, waitForAppReady } = require('../../helpers');

test.describe('3-1 Auth - Seedable Tests', () => {
  test('LG-18: Local regression account sign-in', async ({ page }) => {
    // Seed regression profile → auto-login activates on localhost
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    // Menu should show with greeting
    await expect(page.locator('#screen-menu')).toBeVisible();
    await expect(page.locator('#greetName')).toContainText('Regression QA');
    // Regression mode indicator visible
    await expect(page.locator('div:has-text("TEST MODE: Regression bypass active")').first()).toBeVisible();
  });

  test('LG-19: Build/update tag visibility', async ({ page }) => {
    // No seed → landing screen shown
    await page.goto('/');
    await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 10000 });
    // Build tag should exist
    await expect(page.locator('#buildTag')).not.toBeEmpty();
    await expect(page.locator('#appBuildBadge')).not.toBeEmpty();
  });

  test('LG-20: Local admin account sign-in', async ({ page }) => {
    // Admin auto-login bypass doesn't call updateAdminUi, so admin button stays hidden.
    // Use the form sign-in flow which properly initializes admin state.
    await page.goto('/');
    await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 10000 });
    // Fill admin credentials
    await page.fill('#playerEmail', 'admin@test.local');
    await page.fill('#playerPassword', 'Admin123!');
    await page.click('#btnSignIn');
    // Wait for greeting to show admin name (indicates sign-in completed)
    await expect(page.locator('#greetName')).toContainText('admin', { timeout: 15000 });
  });

  test('LG-23: Admin section visibility', async ({ page }) => {
    // Sign in as admin via form (properly initializes isAdminSession and shows admin button)
    await page.goto('/');
    await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 10000 });
    await page.fill('#playerEmail', 'admin@test.local');
    await page.fill('#playerPassword', 'Admin123!');
    await page.click('#btnSignIn');
    // Wait for admin sign-in to complete
    await expect(page.locator('#greetName')).toContainText('admin', { timeout: 15000 });
    // Admin card should be visible now (updateAdminUi called by handleSignIn)
    // Small wait for UI to update
    await page.waitForTimeout(500);
    await expect(page.locator('#btnAdmin')).not.toBeHidden();
    // Click admin card
    await page.click('#btnAdmin');
    await expect(page.locator('#screen-admin')).toBeVisible();
  });
});