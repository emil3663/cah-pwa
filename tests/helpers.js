/**
 * Playwright test helpers for CAH PWA automation.
 * Provides utilities for seeding localStorage, waiting for app readiness, and multi-page contexts.
 */

/**
 * Seed localStorage with the regression test profile before page load.
 * This enables test-mode auto-login on localhost without Firebase auth.
 * @param {Page} page - Playwright page object
 * @param {Object} overrides - Optional profile overrides (e.g., inProgressGames, completedGames)
 */
async function seedRegressionProfile(page, overrides = {}) {
  const regressionProfile = {
    id: 'local-regression-user-v1',
    name: 'Regression QA',
    email: 'regression@test.local',
    stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 },
    economy: { coins: 5000, tokens: 500 },
    gameHistory: [],
    customDecks: [],
    deckProgress: {
      ownedDeckIds: ['general-classic'],
      activeDeckIds: ['general-classic'],
      activeDeckId: 'general-classic',
      freeStarterClaimed: true,
      featuredSpecialClaimed: false
    },
    inProgressGames: [],
    completedGames: []
  };

  const profile = { ...regressionProfile, ...overrides };

  await page.addInitScript((p) => {
    localStorage.setItem('cah_player', JSON.stringify(p));
    // Debug: verify seeding
    const testData = localStorage.getItem('cah_player');
    window.__SEED_VERIFIED__ = testData ? JSON.parse(testData) : null;
  }, profile);
}

/**
 * Seed localStorage with a player profile before page load.
 * Use with page.addInitScript() to inject before app.js runs.
 * @param {Page} page - Playwright page object
 * @param {Object} profileData - Player profile to seed (merged with defaults)
 */
async function seedPlayerProfile(page, profileData = {}) {
  const defaultProfile = {
    id: 'test-user-1',
    name: 'Test Player',
    email: 'test@example.local',
    stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 },
    economy: { coins: 500, tokens: 100 },
    gameHistory: [],
    customDecks: [],
    deckProgress: {
      ownedDeckIds: ['general-classic'],
      activeDeckIds: ['general-classic'],
      activeDeckId: 'general-classic',
      freeStarterClaimed: true,
      featuredSpecialClaimed: false
    },
    inProgressGames: [],
    completedGames: []
  };

  const profile = { ...defaultProfile, ...profileData };

  await page.addInitScript((p) => {
    localStorage.setItem('cah_player', JSON.stringify(p));
  }, profile);
}

/**
 * Wait for the app to signal readiness.
 * Should be called after page.goto() and seedPlayerProfile().
 * @param {Page} page - Playwright page object
 * @param {Number} timeoutMs - Max time to wait (default 10000)
 */
async function waitForAppReady(page, timeoutMs = 10000) {
  await page.waitForFunction(() => window.__APP_READY__ === true, { timeout: timeoutMs });
}

/**
 * Seed localStorage with in-progress games before page load.
 * Useful for testing resume flows without playing through full game.
 * @param {Page} page - Playwright page object
 * @param {Array} games - Array of game objects to add to inProgressGames
 */
async function seedInProgressGames(page, games = []) {
  await page.addInitScript((gameList) => {
    const profile = JSON.parse(localStorage.getItem('cah_player')) || {};
    profile.inProgressGames = gameList;
    localStorage.setItem('cah_player', JSON.stringify(profile));
  }, games);
}

/**
 * Seed localStorage with completed games before page load.
 * @param {Page} page - Playwright page object
 * @param {Array} games - Array of game objects to add to completedGames
 */
async function seedCompletedGames(page, games = []) {
  await page.addInitScript((gameList) => {
    const profile = JSON.parse(localStorage.getItem('cah_player')) || {};
    profile.completedGames = gameList;
    localStorage.setItem('cah_player', JSON.stringify(profile));
  }, games);
}

/**
 * Helper to create a test in-progress game object.
 * @param {Object} opts - Options for game
 * @returns {Object} Game object for seeding
 */
function createTestGame(opts = {}) {
  const timestamp = opts.timestamp || new Date().toISOString();
  return {
    roomCode: opts.roomCode || 'ABC123',
    roomName: opts.roomName || 'Test Room',
    roundsToWin: opts.roundsToWin || 3,
    players: opts.players || 2,
    timestamp: timestamp
  };
}

module.exports = {
  seedRegressionProfile,
  seedPlayerProfile,
  waitForAppReady,
  seedInProgressGames,
  seedCompletedGames,
  createTestGame,
};
