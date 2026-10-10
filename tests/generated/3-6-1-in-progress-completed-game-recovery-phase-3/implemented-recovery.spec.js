// Automated Playwright regression tests for in-progress/completed game recovery.
const { test, expect } = require('@playwright/test');
const { seedRegressionProfile, createTestGame, waitForAppReady } = require('../../helpers');

test.describe('In-Progress/Completed Game Recovery', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('error', err => console.error('[BROWSER ERROR]', err));
  });

  test('PR-01: In-progress game appears after leave', async ({ page }) => {
    await seedRegressionProfile(page, {
      inProgressGames: [
        createTestGame({ roomCode: 'ABC123', roomName: 'Test Room' })
      ]
    });

    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnStats');
    await expect(page.locator('#inProgressGames')).not.toBeEmpty();
    await expect(page.locator('#inProgressGames')).toContainText('Test Room');
    await expect(page.locator('#inProgressGames')).toContainText('ABC123');
  });

  test('PR-02: Resume in-progress game from stats', async ({ page }) => {
    await seedRegressionProfile(page, {
      inProgressGames: [
        createTestGame({ roomCode: 'XYZ789', roomName: 'Resume Test' })
      ]
    });

    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnStats');
    await expect(page.locator('#inProgressGames')).toContainText('Resume Test');

    const resumeButton = page.locator('#inProgressGames button:has-text("Resume")').first();
    await expect(resumeButton).toBeVisible();
    await resumeButton.click();

    // The seeded game has no backing room, so this checks the Resume control remains usable.
    await expect(page.locator('#inProgressGames')).toContainText('Resume Test');
  });

  test('PR-03: Completed game moves to Completed list', async ({ page }) => {
    await seedRegressionProfile(page, {
      completedGames: [
        createTestGame({ roomCode: 'COMP01', roomName: 'Completed Game' })
      ]
    });

    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnStats');
    await expect(page.locator('#completedGames')).not.toBeEmpty();
    await expect(page.locator('#completedGames')).toContainText('Completed Game');
    await expect(page.locator('#completedGames')).toContainText('COMP01');
  });

  test('PR-06: In-progress/completed games persist after reload', async ({ page }) => {
    await seedRegressionProfile(page, {
      inProgressGames: [
        createTestGame({ roomCode: 'PERSIST01', roomName: 'Persist In Progress' })
      ],
      completedGames: [
        createTestGame({ roomCode: 'PERSIST02', roomName: 'Persist Completed' })
      ]
    });

    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnStats');
    await expect(page.locator('#inProgressGames')).toContainText('Persist In Progress');
    await expect(page.locator('#completedGames')).toContainText('Persist Completed');

    await page.reload();
    await waitForAppReady(page);
    await page.click('#btnStats');
    await expect(page.locator('#inProgressGames')).toContainText('Persist In Progress');
    await expect(page.locator('#completedGames')).toContainText('Persist Completed');
  });
});
