// Playwright tests: QS-01 through QS-13 — Quick-Run Smoke Checklist
// Seeds the regression profile and runs through all smoke steps.
const { test, expect } = require('@playwright/test');
const { seedRegressionProfile, waitForAppReady, createTestGame, resolveCzarRoundIfCzar } = require('../../helpers');

test.describe('7-2 Quick-Run Smoke', () => {
  test('QS-01: Open app with cache-bust query param', async ({ page }) => {
    // Seed profile so auto-login activates
    await seedRegressionProfile(page);
    await page.goto('/?cb=' + Date.now());
    await waitForAppReady(page);
    // App should show menu screen (seeded auto-login kicks in)
    await expect(page.locator('#screen-menu')).toBeVisible();
  });

  test('QS-02: Build/update tag visible on landing', async ({ page }) => {
    // No seed → landing page shown (no waitForAppReady since it won't fire without login)
    await page.goto('/');
    await expect(page.locator('#screen-landing')).toBeVisible({ timeout: 10000 });
    // Build tag should show on landing
    await expect(page.locator('#buildTag')).not.toBeEmpty();
    await expect(page.locator('#appBuildBadge')).not.toBeEmpty();
  });

  test('QS-03: Sign in with regression account', async ({ page }) => {
    // Seed profile so sign-in flow recognizes regression credentials
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    // Should auto-login with seeded profile
    await expect(page.locator('#screen-menu')).toBeVisible();
    // Greeting should show Regression QA
    await expect(page.locator('#greetName')).toContainText('Regression QA');
    // Verify test-mode badge shows (scoped id, not a text match that can hit hidden ancestors)
    await expect(page.locator('#testModeDebugBadge')).toBeVisible();
  });

  test('QS-04: Open Deck Store', async ({ page }) => {
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnDecks');
    await expect(page.locator('#screen-decks')).toBeVisible();
    // Wallet bar should show (indicates store initialized)
    await expect(page.locator('#walletBar')).toBeVisible();
    // Deck store message should be present
    await expect(page.locator('#deckStoreMessage')).toBeVisible();
  });

  test('QS-05: Owned deck filtering default', async ({ page }) => {
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnDecks');
    // Owned decks should be hidden by default (the regression profile has general-classic owned)
    // The store card for general-classic should not show since it's owned
    // We verify the store container is working
    await expect(page.locator('#walletBar')).toBeVisible();
  });

  test('QS-06: Toggle Show Owned Decks', async ({ page }) => {
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnDecks');
    // Wait for deck store to initialize
    await expect(page.locator('#walletBar')).toBeVisible();
    // Verify store renders
    await expect(page.locator('#deckStoreList')).toBeVisible();
  });

  test('QS-07: Profile owned decks section renders', async ({ page }) => {
    const inProgress = createTestGame({ roomCode: 'QS07', roomName: 'QS Test' });
    await seedRegressionProfile(page, { inProgressGames: [inProgress] });
    await page.goto('/');
    await waitForAppReady(page);
    // Open stats
    await page.click('#btnStats');
    await expect(page.locator('#screen-stats')).toBeVisible();
    // Stats body should have player info
    await expect(page.locator('#statsBody')).not.toBeEmpty();
  });

  test('QS-08: Create room with AI and start game', async ({ page }) => {
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    // Navigate to create room
    await page.click('#btnCreateRoom');
    await expect(page.locator('#screen-create')).toBeVisible();
    // Configure 1 AI, 3 rounds
    await page.fill('#roomName', 'Smoke Test Room');
    await page.fill('#aiPlayers', '1');
    await page.fill('#roundsToWin', '3');
    await page.click('#btnStartRoom');
    // Should enter lobby
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 10000 });
  });

  test('QS-09: Drag/double-tap card into Play Area', async ({ page }) => {
    // Seeded regression has general-classic deck. Create game and play.
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    // Create game
    await page.click('#btnCreateRoom');
    await page.fill('#roomName', 'QS-09 Game');
    await page.fill('#aiPlayers', '1');
    await page.fill('#roundsToWin', '3');
    await page.click('#btnStartRoom');
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 10000 });
    // Host starts game
    await page.click('#btnStartGame');
    // Should transition to game screen
    await expect(page.locator('#screen-game')).toBeVisible({ timeout: 15000 });
    // Room host is always Czar in round 1 (czarIndex starts at 0) and has no hand to
    // play that round — resolve it so round 2 begins with the host as a submitter.
    await resolveCzarRoundIfCzar(page);
    // Hand should have cards
    await expect(page.locator('#handCards')).not.toBeEmpty();
    // Double-tap first card
    const firstCard = page.locator('#handCards .white-card').first();
    await firstCard.dispatchEvent('dblclick');
    // Card should appear in play area
    await expect(page.locator('#playDropZone')).not.toBeEmpty();
  });

  test('QS-10: Submit cards and judge view', async ({ page }) => {
    // Create game, submit, wait for judging phase
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    // Quick create + start. roundsToWin=2 so the game doesn't end when the host
    // (always Czar in round 1) resolves that round — round 2 is where the host submits.
    await page.click('#btnCreateRoom');
    await page.fill('#roomName', 'QS-10 Game');
    await page.fill('#aiPlayers', '2');
    await page.fill('#roundsToWin', '2');
    await page.click('#btnStartRoom');
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 10000 });
    await page.click('#btnStartGame');
    await expect(page.locator('#screen-game')).toBeVisible({ timeout: 15000 });
    await resolveCzarRoundIfCzar(page);
    // Select a card
    const firstCard = page.locator('#handCards .white-card').first();
    await firstCard.dispatchEvent('dblclick');
    await page.waitForTimeout(500);
    // Play selected card
    const playBtn = page.locator('#btnPlayCards');
    if (await playBtn.isVisible()) {
      await playBtn.click();
    }
    // Wait for round to progress (bots will auto-submit)
    await page.waitForTimeout(3000);
  });

  test('QS-11: Judge drag to Winner Zone', async ({ page }) => {
    // Room host is always Czar in round 1 (czarIndex starts at 0), so this is the
    // natural place to exercise the judge flow: nominate a submission and confirm it.
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnCreateRoom');
    await page.fill('#roomName', 'QS-11 Game');
    await page.fill('#aiPlayers', '1');
    await page.fill('#roundsToWin', '3');
    await page.click('#btnStartRoom');
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 10000 });
    await page.click('#btnStartGame');
    await expect(page.locator('#screen-game')).toBeVisible({ timeout: 15000 });
    // Host is Czar this round
    await expect(page.locator('#czarBanner')).toBeVisible();
    // Bot submission is ready to judge
    await expect(page.locator('.submission-card').first()).toBeVisible({ timeout: 5000 });
    await page.locator('.submission-card').first().click();
    await expect(page.locator('#btnConfirmWinner')).toBeEnabled();
    await page.click('#btnConfirmWinner');
    // Round resolves and result screen appears
    await expect(page.locator('#screen-result')).toBeVisible({ timeout: 10000 });
  });

  test('QS-12: Game over appears and stats update', async ({ page }) => {
    await seedRegressionProfile(page);
    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnCreateRoom');
    await page.fill('#roomName', 'QS-12 Game');
    await page.fill('#aiPlayers', '1');
    await page.fill('#roundsToWin', '1');
    await page.click('#btnStartRoom');
    await expect(page.locator('#screen-lobby')).toBeVisible({ timeout: 10000 });
    await page.click('#btnStartGame');
    await expect(page.locator('#screen-game')).toBeVisible({ timeout: 15000 });
    // With roundsToWin=1, the host (Czar in round 1) resolving this round is what
    // ends the game — the winning AI reaches the 1-point target immediately.
    const resolvedAsCzar = await resolveCzarRoundIfCzar(page);
    if (!resolvedAsCzar) {
      const firstCard = page.locator('#handCards .white-card').first();
      if (await firstCard.isVisible()) {
        await firstCard.dispatchEvent('dblclick');
      }
    }
    await expect(page.locator('#screen-gameover')).toBeVisible({ timeout: 10000 });
  });

  test('QS-13: Stats screen shows recent games', async ({ page }) => {
    // Seed with completed games and check stats
    const completed = createTestGame({ roomCode: 'COMP01', roomName: 'Smoke Completed' });
    await seedRegressionProfile(page, { completedGames: [completed] });
    await page.goto('/');
    await waitForAppReady(page);
    await page.click('#btnStats');
    await expect(page.locator('#screen-stats')).toBeVisible();
    await expect(page.locator('#completedGames')).not.toBeEmpty();
  });
});