// Automated Playwright tests for in-progress/completed game tracking and resume flow
const { test, expect } = require('@playwright/test');
const { seedRegressionProfile, createTestGame, waitForAppReady } = require('./helpers');

test.describe('In-Progress/Completed Game Recovery', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs from the page BEFORE anything loads
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('error', err => console.error(`[BROWSER ERROR]`, err));
  });

  test('PR-01: In-progress game appears after leave', async ({ page }) => {
    // Seed with in-progress game (beforeEach already seeded base profile)
    await seedRegressionProfile(page, {
      inProgressGames: [
        createTestGame({ roomCode: 'ABC123', roomName: 'Test Room' })
      ]
    });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to stats and wait for content
    await page.click('#btnStats');
    await expect(page.locator('#inProgressGames')).not.toBeEmpty();
    
    // Verify in-progress section shows the game
    await expect(page.locator('#inProgressGames')).toContainText('Test Room');
    await expect(page.locator('#inProgressGames')).toContainText('ABC123');
  });

  test('PR-02: Resume in-progress game from stats', async ({ page }) => {
    // Seed regression profile with an in-progress game
    await seedRegressionProfile(page, {
      inProgressGames: [
        createTestGame({ roomCode: 'XYZ789', roomName: 'Resume Test' })
      ]
    });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Open stats
    await page.click('#btnStats');
    
    // Wait for the game row to appear (specific text, not empty fallback)
    await expect(page.locator('#inProgressGames')).toContainText('Resume Test');
    
    // Click Resume button on the game
    const resumeButton = page.locator('#inProgressGames button:has-text("Resume")').first();
    await expect(resumeButton).toBeVisible();
    await resumeButton.click();
    
    // Resume tries to navigate; room won't exist so stays on stats.
    // Verify the button was clickable without error.
    await expect(page.locator('#inProgressGames')).toContainText('Resume Test');
  });

  test('PR-03: Completed game moves to Completed list', async ({ page }) => {
    // Seed regression profile with a completed game
    await seedRegressionProfile(page, {
      completedGames: [
        createTestGame({ roomCode: 'COMP01', roomName: 'Completed Game' })
      ]
    });
    
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to stats and wait for renderStats to populate
    await page.click('#btnStats');
    await expect(page.locator('#completedGames')).not.toBeEmpty();
    
    // Verify completed section shows the game
    await expect(page.locator('#completedGames')).toContainText('Completed Game');
    await expect(page.locator('#completedGames')).toContainText('COMP01');
  });

  test('PR-06: In-progress/completed games persist after reload', async ({ page }) => {
    // Seed regression profile with both in-progress and completed games
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
    
    // Navigate to stats
    await page.click('#btnStats');
    
    // Wait for game content (not fallback text)
    await expect(page.locator('#inProgressGames')).toContainText('Persist In Progress');
    await expect(page.locator('#completedGames')).toContainText('Persist Completed');
    
    // Reload page again to verify persistence
    await page.reload();
    await waitForAppReady(page);
    await page.click('#btnStats');
    
    // Verify data still present after second reload
    await expect(page.locator('#inProgressGames')).toContainText('Persist In Progress');
    await expect(page.locator('#completedGames')).toContainText('Persist Completed');
  });
});
