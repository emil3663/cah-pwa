const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const profile = {
      id: 'local-regression-user-v1',
      name: 'Regression QA',
      email: 'regression@test.local',
      stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 },
      economy: { coins: 5000, tokens: 500 },
      gameHistory: [],
      customDecks: [],
      deckProgress: { ownedDeckIds: ['general-classic'], activeDeckIds: ['general-classic'], activeDeckId: 'general-classic', freeStarterClaimed: true, featuredSpecialClaimed: false },
      inProgressGames: [{ roomCode:'XYZ789', roomName:'Resume Test', roundsToWin: 3, players: 2, timestamp: new Date().toISOString() }],
      completedGames: []
    };
    localStorage.setItem('cah_player', JSON.stringify(profile));
  });
  await page.goto('http://localhost:8081/');
  await page.waitForFunction(() => window.__APP_READY__ === true, { timeout: 10000 });
  await page.click('#btnStats');
  const inner = await page.evaluate(() => ({
    active: document.getElementById('screen-stats').classList.contains('active'),
    html: document.getElementById('inProgressGames')?.innerHTML,
    text: document.getElementById('inProgressGames')?.textContent,
    buttonCount: document.querySelectorAll('#inProgressGames button').length,
    resumeVisible: document.querySelector('#inProgressGames button') ? document.querySelector('#inProgressGames button').offsetParent !== null : false
  }));
  console.log(JSON.stringify(inner, null, 2));
  await browser.close();
})();
