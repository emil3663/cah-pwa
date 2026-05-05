/* ===== Cards Against Humanity — app.js ===== */

/* ─── Storage helpers ─── */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ─── Economy rules ─── */
const STARTER_COINS = 200;
const STARTER_TOKENS = 20;
const TOKEN_TO_COIN = 10;
const ROUND_WIN_COINS = 5;
const REROLL_COST_COINS = 3;
const MAX_REROLLS_PER_ROUND = 2;
const MAX_REROLLS_PER_GAME = 5;
const ENDGAME_COIN_PODIUM = { 1: 20, 2: 10, 3: 5 };
const ENDGAME_TOKEN_PODIUM = { 1: 5, 2: 3, 3: 1 };
const FEATURED_SPECIAL_DECK_ID = 'special-featured';
const FEATURED_SPECIAL_DISCOUNT_TOKENS = 10;
const FREE_STARTER_DECK_ID = 'general-classic';

/* ─── State ─── */
let me = load('cah_player', null);
let rooms = load('cah_rooms', {});
let friends = load('cah_friends', []);

let currentRoom = null;
let gameState = null;
let deckCart = new Set();
let deckCategoryCollapsed = {};
let deckPreviewByCategory = {};

const BOT_PERSONAS = [
  { key: 'skeeter', name: 'Skeeter', mode: 'spicy', avatar: 'icons/bot-skeeter.svg' },
  { key: 'sally', name: 'Sally', mode: 'chaos', avatar: 'icons/bot-sally.svg' },
  { key: 'linus', name: 'Linus', mode: 'random', avatar: 'icons/bot-linus.svg' }
];

/* ─── Screen management ─── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

document.querySelectorAll('.btn-ghost.back').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.target || 'menu'));
});

/* ─── Profile / Economy ─── */
function initPlayerProfile() {
  if (!me) return;
  me.stats = me.stats || { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 };
  me.economy = me.economy || { coins: STARTER_COINS, tokens: STARTER_TOKENS };
  me.deckProgress = me.deckProgress || {
    ownedDeckIds: [],
    activeDeckId: null,
    freeStarterClaimed: false,
    featuredSpecialClaimed: false
  };

  me.deckProgress.ownedDeckIds = Array.isArray(me.deckProgress.ownedDeckIds) ? me.deckProgress.ownedDeckIds : [];

  if (me.deckProgress.activeDeckId && !me.deckProgress.ownedDeckIds.includes(me.deckProgress.activeDeckId)) {
    me.deckProgress.activeDeckId = null;
  }

  save('cah_player', me);
}

function getDeckById(deckId) {
  return (CAH_THEME_DECKS || []).find(d => d.id === deckId) || null;
}

function getDeckTokenCost(deck) {
  if (!deck) return Infinity;
  const isFeaturedSpecial = deck.id === FEATURED_SPECIAL_DECK_ID;
  const canUseDiscount = isFeaturedSpecial && !me.deckProgress.featuredSpecialClaimed;
  return canUseDiscount ? FEATURED_SPECIAL_DISCOUNT_TOKENS : deck.tokenCost;
}

function getDeckCoinCost(deck) {
  return getDeckTokenCost(deck) * TOKEN_TO_COIN;
}

function ownsDeck(deckId) {
  return me.deckProgress.ownedDeckIds.includes(deckId);
}

function getDeckCategoryMeta(categoryId) {
  return (CAH_DECK_CATEGORIES || []).find(c => c.id === categoryId) || null;
}

function isDeckNsfw(deckId) {
  const deck = getDeckById(deckId);
  if (!deck) return false;
  const category = getDeckCategoryMeta(deck.categoryId);
  return Boolean(category?.nsfw);
}

function canUseDeckInRoom(deckId, allowNsfw) {
  if (!deckId) return false;
  if (allowNsfw) return true;
  return !isDeckNsfw(deckId);
}

function hasActiveDeck() {
  return Boolean(me?.deckProgress?.activeDeckId && ownsDeck(me.deckProgress.activeDeckId));
}

function openDeckStore(message = '') {
  deckCart = new Set();
  initDeckCategoryCollapseState();
  showScreen('decks');
  renderDeckStore(message);
}

function initDeckCategoryCollapseState() {
  const categories = CAH_DECK_CATEGORIES || [];
  deckCategoryCollapsed = {};
  deckPreviewByCategory = {};
  categories.forEach(category => {
    deckCategoryCollapsed[category.id] = category.id !== 'core-expansions';
  });
}

function renderWallet() {
  document.getElementById('walletCoins').textContent = me?.economy?.coins ?? 0;
  document.getElementById('walletTokens').textContent = me?.economy?.tokens ?? 0;
}

function renderDeckStore(message = '') {
  renderWallet();
  const msgEl = document.getElementById('deckStoreMessage');
  const listEl = document.getElementById('deckStoreList');
  const categories = CAH_DECK_CATEGORIES || [];

  const mustClaim = !me.deckProgress.freeStarterClaimed || !hasActiveDeck();
  msgEl.textContent = message || (mustClaim
    ? 'Claim your free first deck and select an active deck before creating or joining games.'
    : 'Browse by category. Expand groups, select decks, then complete your purchase in checkout.');

  listEl.innerHTML = categories.map(category => {
    const decksInCategory = CAH_THEME_DECKS.filter(deck => deck.categoryId === category.id);
    const collapsed = deckCategoryCollapsed[category.id] !== false;
    const backdrop = getCategoryBackdrop(category.id);
    const selectedDeckId = deckPreviewByCategory[category.id] || '';
    const selectedDeck = decksInCategory.find(deck => deck.id === selectedDeckId) || null;

    return `
      <section class="deck-category-group ${collapsed ? 'collapsed' : ''}">
        <button class="deck-category-header" onclick="toggleCategorySection('${category.id}')" aria-expanded="${collapsed ? 'false' : 'true'}">
          <span>${escHtml(category.name)}</span>
          <span class="category-count">${decksInCategory.length} decks</span>
          <span class="category-toggle">${collapsed ? '▸' : '▾'}</span>
        </button>
        <div class="deck-category-body" style="background-image:url('${escHtml(backdrop)}');">
          <div class="deck-name-list">
            ${decksInCategory.map(deck => `
              <button class="deck-name-item ${deck.id === selectedDeckId ? 'active' : ''}" onclick="selectDeckPreview('${category.id}','${deck.id}')">
                ${escHtml(deck.name)}
              </button>
            `).join('')}
          </div>
          <div class="deck-preview-panel">
            ${selectedDeck ? renderDeckPreviewCard(selectedDeck, category) : '<p class="deck-empty">Select a deck name to preview details and cover art.</p>'}
          </div>
        </div>
      </section>
    `;
  }).join('');

  renderCartSummary();
}

function renderDeckPreviewCard(deck, category) {
  const owned = ownsDeck(deck.id);
  const selected = me.deckProgress.activeDeckId === deck.id;
  const tokenCost = getDeckTokenCost(deck);
  const coinCost = getDeckCoinCost(deck);
  const isFreeStarterClaim = !me.deckProgress.freeStarterClaimed && deck.id === FREE_STARTER_DECK_ID;
  const isInCart = deckCart.has(deck.id);
  const coverSrc = getDeckCoverSrc(deck);

  let actionHtml = '';
  if (isFreeStarterClaim) {
    actionHtml = `<button class="btn-white sm" onclick="claimStarterDeck()">Claim Free Starter Deck</button>`;
  } else if (owned) {
    actionHtml = selected
      ? '<span class="deck-tag-selected">Equipped</span>'
      : `<button class="btn-ghost sm" onclick="selectDeck('${deck.id}')">Equip Deck</button>`;
  } else {
    actionHtml = `<button class="${isInCart ? 'btn-ghost' : 'btn-white'} sm" onclick="toggleDeckInCart('${deck.id}')">${isInCart ? 'Remove' : 'Select'}</button>`;
  }

  return `
    <div class="deck-card">
      <div class="deck-left">
        <h4>${escHtml(deck.name)}</h4>
        <p class="deck-description">${escHtml(deck.description || 'No description available.')}</p>
        <div class="deck-meta">
          <span>${deck.family === 'special' ? 'Special' : 'General'} Tier ${deck.tier}</span>
          <span>${deck.whiteCardIndexes.length} white cards</span>
          ${category ? `<span>${escHtml(category.name)}</span>` : ''}
          ${deck.sourcePackName ? `<span>Source: ${escHtml(deck.sourcePackName)}</span>` : ''}
        </div>
      </div>
      <div class="deck-center">
        <div class="deck-cover-wrap">
          <img class="deck-cover" src="${escHtml(coverSrc)}" alt="${escHtml(deck.name)} deck art" />
        </div>
      </div>
      <div class="deck-right">
        ${owned
          ? '<div class="deck-price">Owned</div>'
          : `<div class="deck-price">${tokenCost} 🔷<br><span>${coinCost} 🪙</span></div>`}
        <div class="deck-actions">${actionHtml}</div>
      </div>
    </div>
  `;
}

window.toggleCategorySection = function(categoryId) {
  const current = deckCategoryCollapsed[categoryId] !== false;
  deckCategoryCollapsed[categoryId] = !current;
  renderDeckStore();
};

window.selectDeckPreview = function(categoryId, deckId) {
  deckPreviewByCategory[categoryId] = deckId;
  if (deckCategoryCollapsed[categoryId]) deckCategoryCollapsed[categoryId] = false;
  renderDeckStore();
};

function renderCartSummary() {
  const checkoutBtn = document.getElementById('btnOpenCheckout');
  const summaryEl = document.getElementById('deckCartSummary');
  const selectedDecks = CAH_THEME_DECKS.filter(d => deckCart.has(d.id) && !ownsDeck(d.id));

  if (!selectedDecks.length) {
    summaryEl.textContent = 'No decks selected.';
    checkoutBtn.disabled = true;
    return;
  }

  const tokenTotal = selectedDecks.reduce((sum, d) => sum + getDeckTokenCost(d), 0);
  summaryEl.textContent = `${selectedDecks.length} selected · ${tokenTotal} 🔷 total`;
  checkoutBtn.disabled = false;
}

window.toggleDeckInCart = function(deckId) {
  const deck = getDeckById(deckId);
  if (!deck || ownsDeck(deckId)) return;
  if (deckCart.has(deckId)) deckCart.delete(deckId);
  else deckCart.add(deckId);
  renderDeckStore();
};

function openCheckoutModal() {
  const selectedDecks = CAH_THEME_DECKS.filter(d => deckCart.has(d.id) && !ownsDeck(d.id));
  if (!selectedDecks.length) return;

  const listEl = document.getElementById('checkoutDeckList');
  const totalsEl = document.getElementById('checkoutTotals');
  const tokenTotal = selectedDecks.reduce((sum, d) => sum + getDeckTokenCost(d), 0);
  const coinTotal = tokenTotal * TOKEN_TO_COIN;

  listEl.innerHTML = selectedDecks.map(deck => {
    const tokenCost = getDeckTokenCost(deck);
    const coinCost = getDeckCoinCost(deck);
    return `
      <div class="checkout-item">
        <div>
          <strong>${escHtml(deck.name)}</strong>
          <div class="checkout-item-meta">${tokenCost} 🔷 or ${coinCost} 🪙</div>
        </div>
        <button class="btn-ghost sm" onclick="removeDeckFromCart('${deck.id}')">Remove</button>
      </div>
    `;
  }).join('');

  totalsEl.textContent = `Total: ${tokenTotal} 🔷 (${coinTotal} 🪙 equivalent)`;
  document.getElementById('deckCheckoutModal').classList.remove('hidden');
}

function closeCheckoutModal() {
  document.getElementById('deckCheckoutModal').classList.add('hidden');
}

window.removeDeckFromCart = function(deckId) {
  deckCart.delete(deckId);
  renderDeckStore();
  const selectedDecks = CAH_THEME_DECKS.filter(d => deckCart.has(d.id) && !ownsDeck(d.id));
  if (!selectedDecks.length) {
    closeCheckoutModal();
    return;
  }
  openCheckoutModal();
};

function confirmCheckoutPurchase() {
  const selectedDecks = CAH_THEME_DECKS.filter(d => deckCart.has(d.id) && !ownsDeck(d.id));
  if (!selectedDecks.length) {
    closeCheckoutModal();
    return;
  }

  const purchasedNames = [];
  for (const deck of selectedDecks) {
    const tokenCost = getDeckTokenCost(deck);
    const coinCost = getDeckCoinCost(deck);

    if (me.economy.tokens >= tokenCost) {
      me.economy.tokens -= tokenCost;
    } else if (me.economy.coins >= coinCost) {
      me.economy.coins -= coinCost;
    } else {
      alert(`Insufficient funds for ${deck.name}. Remove it from checkout or earn more currency.`);
      return;
    }

    me.deckProgress.ownedDeckIds.push(deck.id);
    purchasedNames.push(deck.name);
    deckCart.delete(deck.id);

    if (!me.deckProgress.activeDeckId) me.deckProgress.activeDeckId = deck.id;
    if (deck.id === FEATURED_SPECIAL_DECK_ID && !me.deckProgress.featuredSpecialClaimed) {
      me.deckProgress.featuredSpecialClaimed = true;
    }
  }

  save('cah_player', me);
  closeCheckoutModal();
  renderDeckStore(`${purchasedNames.join(', ')} purchased.`);
}

function getDeckCoverSrc(deck) {
  if (deck?.image) return deck.image;
  return buildDeckLineArtCover(deck?.name || 'Deck', deck?.family || 'general', deck?.categoryId || '');
}

function buildDeckLineArtCover(name, family, categoryId) {
  const initials = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('') || 'DK';

  const paletteByCategory = {
    'core-expansions': { bg: '#17181a', stroke: '#58a6ff', accent: '◆' },
    'holidays-seasonal': { bg: '#1a1d18', stroke: '#4cd17e', accent: '✦' },
    'pop-fandom': { bg: '#1c1723', stroke: '#ad7dff', accent: '★' },
    'politics-topical': { bg: '#1b1a22', stroke: '#6fa8ff', accent: '⚑' },
    'tech-professional': { bg: '#121c1d', stroke: '#5ad0c9', accent: '⬢' },
    'nostalgia-era': { bg: '#221912', stroke: '#f2b16f', accent: '◎' },
    'dark-nsfw': { bg: '#1b1212', stroke: '#ef6f6c', accent: '☠' },
    'regional-language': { bg: '#16201a', stroke: '#74caa1', accent: '◈' },
    'sports-competition': { bg: '#142026', stroke: '#58b6ff', accent: '✪' },
    'meme-chaos': { bg: '#211523', stroke: '#ff7dd8', accent: '✹' }
  };
  const palette = paletteByCategory[categoryId] || { bg: '#17181a', stroke: family === 'special' ? '#ef6f6c' : '#58a6ff', accent: '◆' };

  const stroke = palette.stroke;
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 520">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.bg}"/>
      <stop offset="100%" stop-color="#0f0f10"/>
    </linearGradient>
  </defs>
  <rect width="360" height="520" fill="#0f0f10"/>
  <rect x="20" y="20" width="320" height="480" rx="24" fill="url(#g)" stroke="${stroke}" stroke-width="8"/>
  <rect x="34" y="34" width="292" height="452" rx="18" fill="none" stroke="${stroke}" stroke-opacity="0.5" stroke-width="2"/>
  <text x="44" y="92" fill="${stroke}" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700">${palette.accent}</text>
  <text x="316" y="466" fill="${stroke}" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="end">${palette.accent}</text>
  <circle cx="180" cy="216" r="62" fill="none" stroke="${stroke}" stroke-opacity="0.7" stroke-width="4"/>
  <text x="180" y="238" fill="${stroke}" font-size="72" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" font-weight="700">${initials}</text>
  <text x="180" y="420" fill="${stroke}" font-size="18" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" letter-spacing="2">DECK</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getCategoryBackdrop(categoryId) {
  const backdrops = {
    'core-expansions': { c1: '#3a4f75', c2: '#151a24', icon: '◇' },
    'holidays-seasonal': { c1: '#2f6a46', c2: '#141d17', icon: '✶' },
    'pop-fandom': { c1: '#6b4ca1', c2: '#1b1626', icon: '★' },
    'politics-topical': { c1: '#2f5a96', c2: '#151926', icon: '⚖' },
    'tech-professional': { c1: '#238b8b', c2: '#101d1d', icon: '⬢' },
    'nostalgia-era': { c1: '#946237', c2: '#23170f', icon: '◎' },
    'dark-nsfw': { c1: '#8a2f37', c2: '#220f12', icon: '☠' },
    'regional-language': { c1: '#4f8a6c', c2: '#162019', icon: '◈' },
    'sports-competition': { c1: '#2f7994', c2: '#111f25', icon: '✪' },
    'meme-chaos': { c1: '#8f3d95', c2: '#1f1322', icon: '✹' }
  };

  const bg = backdrops[categoryId] || { c1: '#3f4d73', c2: '#151922', icon: '◇' };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg.c1}"/>
      <stop offset="100%" stop-color="${bg.c2}"/>
    </linearGradient>
    <pattern id="p" width="140" height="140" patternUnits="userSpaceOnUse">
      <text x="18" y="92" fill="rgba(255,255,255,0.10)" font-family="Arial" font-size="64">${bg.icon}</text>
    </pattern>
  </defs>
  <rect width="900" height="520" fill="url(#bg)"/>
  <rect width="900" height="520" fill="url(#p)"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

window.claimStarterDeck = function() {
  if (me.deckProgress.freeStarterClaimed) return;
  me.deckProgress.freeStarterClaimed = true;
  if (!ownsDeck(FREE_STARTER_DECK_ID)) me.deckProgress.ownedDeckIds.push(FREE_STARTER_DECK_ID);
  me.deckProgress.activeDeckId = FREE_STARTER_DECK_ID;
  save('cah_player', me);
  renderDeckStore('Starter deck claimed. You can now create or join games.');
};

window.selectDeck = function(deckId) {
  if (!ownsDeck(deckId)) return;
  me.deckProgress.activeDeckId = deckId;
  save('cah_player', me);
  renderDeckStore('Active deck updated.');
};

document.getElementById('btnOpenCheckout').addEventListener('click', openCheckoutModal);
document.getElementById('btnCloseCheckout').addEventListener('click', closeCheckoutModal);
document.getElementById('btnConfirmCheckout').addEventListener('click', confirmCheckoutPurchase);
document.getElementById('deckCheckoutModal').addEventListener('click', (e) => {
  if (e.target.id === 'deckCheckoutModal') closeCheckoutModal();
});

function requireDeckAccess(message) {
  if (hasActiveDeck()) return true;
  openDeckStore(message || 'Select a deck first.');
  return false;
}

/* ─── Landing / Login ─── */
document.getElementById('btnEnter').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  if (!name) return alert('Please enter your name!');
  me = load('cah_player', null);
  if (!me || me.name !== name) {
    me = { name, id: genId(), stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 } };
  }
  initPlayerProfile();
  save('cah_player', me);
  document.getElementById('greetName').textContent = me.name;
  showScreen('menu');
});

/* ─── Menu ─── */
document.getElementById('btnCreateRoom').addEventListener('click', () => {
  if (!requireDeckAccess('Claim or select a deck before creating rooms.')) return;
  showScreen('create');
});
document.getElementById('btnJoinRoom').addEventListener('click', () => {
  if (!requireDeckAccess('Claim or select a deck before joining rooms.')) return;
  showScreen('join');
  renderRoomList();
});
document.getElementById('btnFriends').addEventListener('click', () => { showScreen('friends'); renderFriends(); });
document.getElementById('btnStats').addEventListener('click', () => { showScreen('stats'); renderStats(); });
document.getElementById('btnProfile').addEventListener('click', () => { showScreen('stats'); renderStats(); });
document.getElementById('btnDecks').addEventListener('click', () => openDeckStore());

/* ─── Create Room ─── */
document.getElementById('btnStartRoom').addEventListener('click', () => {
  if (!requireDeckAccess('You must claim/select a deck before creating rooms.')) return;

  const roomName = document.getElementById('roomName').value.trim() || me.name + "'s Room";
  const gameMode = document.querySelector('input[name="gameMode"]:checked').value;
  const allowNsfw = document.getElementById('allowNsfwToggle')?.checked ?? false;
  const maxPlayers = parseInt(document.getElementById('maxPlayers').value, 10) || 8;
  const aiPlayers = parseInt(document.getElementById('aiPlayers').value, 10) || 0;
  const roundsToWin = parseInt(document.getElementById('roundsToWin').value, 10) || 7;
  const code = genCode();
  const clampedBots = Math.max(0, Math.min(BOT_PERSONAS.length, aiPlayers, maxPlayers - 1));

  const humanPlayer = { id: me.id, name: me.name, score: 0, isBot: false };
  const botPlayers = generateBotPlayers(clampedBots, [humanPlayer.name]);

  const room = {
    code,
    name: roomName,
    mode: gameMode,
    allowNsfw,
    maxPlayers,
    roundsToWin,
    host: me.id,
    players: [humanPlayer, ...botPlayers],
    status: 'lobby',
    createdAt: Date.now()
  };

  rooms[code] = room;
  save('cah_rooms', rooms);

  currentRoom = room;
  openLobby(room);
});

/* ─── Join Room ─── */
document.getElementById('btnJoin').addEventListener('click', () => {
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  joinRoom(code);
});
document.getElementById('joinCode').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnJoin').click();
});

function joinRoom(code) {
  if (!requireDeckAccess('Claim/select a deck before joining rooms.')) return;

  rooms = load('cah_rooms', {});
  const room = rooms[code];
  if (!room) return alert('Room not found. Check the code and try again.');
  if (room.status !== 'lobby') return alert('That game has already started.');
  if (room.players.length >= room.maxPlayers) return alert('Room is full!');

  const myDeckId = me?.deckProgress?.activeDeckId;
  if (!canUseDeckInRoom(myDeckId, room.allowNsfw !== false)) {
    return alert('This room has NSFW decks disabled. Please equip a non-NSFW deck first.');
  }

  if (!room.players.find(p => p.id === me.id)) {
    room.players.push({ id: me.id, name: me.name, score: 0, isBot: false });
    rooms[code] = room;
    save('cah_rooms', rooms);
  }

  currentRoom = room;
  openLobby(room);
}

function renderRoomList() {
  rooms = load('cah_rooms', {});
  const list = document.getElementById('roomList');
  const open = Object.values(rooms).filter(r => r.status === 'lobby');
  if (!open.length) {
    list.innerHTML = '<p style="color:#555;text-align:center;margin-top:20px;">No open rooms found.</p>';
    return;
  }

  list.innerHTML = '<p style="color:#888;font-size:0.85rem;margin-bottom:8px;">Open rooms:</p>' +
    open.map(r => `<div style="background:#222;border:1px solid #333;border-radius:10px;padding:12px 16px;cursor:pointer;"
      onclick="joinRoom('${r.code}')">
      <strong>${escHtml(r.name)}</strong> <span style="color:#f6c90e;letter-spacing:2px;">${r.code}</span>
      <span style="color:#555;font-size:0.8rem;margin-left:10px;">${r.players.length}/${r.maxPlayers} players · ${r.mode}</span>
    </div>`).join('');
}

window.joinRoom = joinRoom;

/* ─── Lobby ─── */
function openLobby(room) {
  document.getElementById('lobbyTitle').textContent = room.name;
  document.getElementById('lobbyCode').textContent = room.code;
  const nsfwLabel = room.allowNsfw === false ? ' · NSFW Off' : ' · NSFW On';
  document.getElementById('lobbyMode').textContent = '🎮 Mode: ' + room.mode.charAt(0).toUpperCase() + room.mode.slice(1) + nsfwLabel;
  showScreen('lobby');
  refreshLobbyPlayers(room);
}

function refreshLobbyPlayers(room) {
  document.getElementById('lobbyPlayerCount').textContent = room.players.length;
  document.getElementById('lobbyPlayers').innerHTML = room.players.map(p =>
    `<div class="player-chip ${p.id === room.host ? 'host' : ''}">
      ${p.isBot ? `<img class="bot-avatar" src="${escHtml(p.avatar || '')}" alt="${escHtml(p.name)} avatar" />` : ''}
      <span>${escHtml(p.name)}${p.id === room.host ? ' 👑' : ''}</span>
    </div>`).join('');
}

document.getElementById('btnStartGame').addEventListener('click', () => {
  if (!requireDeckAccess('Select an active deck before starting the game.')) return;
  if (!currentRoom) return;

  const myDeckId = me?.deckProgress?.activeDeckId;
  if (!canUseDeckInRoom(myDeckId, currentRoom.allowNsfw !== false)) {
    alert('NSFW is disabled for this room. Equip a non-NSFW deck before starting.');
    openDeckStore('Choose a non-NSFW deck to continue.');
    return;
  }

  currentRoom.status = 'playing';
  rooms[currentRoom.code] = currentRoom;
  save('cah_rooms', rooms);
  startGame(currentRoom);
});

document.getElementById('btnForceAiCzar').addEventListener('click', () => {
  if (!gameState) return;
  forceRandomAiCzar();
});

/* ─── Game Engine ─── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startGame(room) {
  gameState = {
    room,
    blackDeck: shuffle(CAH_BLACK_CARDS.map((c, i) => ({ ...c, id: i }))),
    hands: {},
    czarIndex: 0,
    round: 1,
    scores: {},
    submissions: {},
    phase: 'playing',
    currentBlack: null,
    mode: room.mode,
    cardCounter: 1,
    cardTextById: {},
    playerDecks: {},
    drawPiles: {},
    rerollsRoundUsed: {},
    rerollsGameUsed: {}
  };

  room.players.forEach(p => {
    gameState.scores[p.id] = 0;
    gameState.rerollsRoundUsed[p.id] = 0;
    gameState.rerollsGameUsed[p.id] = 0;

    const deckId = p.isBot
      ? chooseDeckForBot(p, room.allowNsfw !== false)
      : (me.deckProgress.activeDeckId || FREE_STARTER_DECK_ID);
    gameState.playerDecks[p.id] = deckId;
    gameState.drawPiles[p.id] = createDeckPile(deckId);

    gameState.hands[p.id] = [];
    while (gameState.hands[p.id].length < 10) {
      gameState.hands[p.id].push(drawCardForPlayer(p.id));
    }
  });

  startRound();
}

function createDeckPile(deckId) {
  const deck = getDeckById(deckId) || getDeckById(FREE_STARTER_DECK_ID) || CAH_THEME_DECKS[0];
  const base = deck.whiteCardIndexes.map(idx => ({ baseId: idx, text: CAH_WHITE_CARDS[idx] || '' }));
  const expanded = [];
  for (let i = 0; i < 4; i++) expanded.push(...base);
  return shuffle(expanded);
}

function drawCardForPlayer(playerId) {
  if (!gameState.drawPiles[playerId] || !gameState.drawPiles[playerId].length) {
    gameState.drawPiles[playerId] = createDeckPile(gameState.playerDecks[playerId]);
  }

  const next = gameState.drawPiles[playerId].pop() || { baseId: 0, text: '' };
  const cardId = gameState.cardCounter++;
  gameState.cardTextById[cardId] = next.text;
  return { id: cardId, baseId: next.baseId, text: next.text };
}

function chooseDeckForBot(bot, allowNsfw = true) {
  const fallbackSafe = 'general-classic';

  if (bot.mode === 'spicy') {
    const spicy = getDeckById('special-featured') ? 'special-featured' : 'special-apex';
    return canUseDeckInRoom(spicy, allowNsfw) ? spicy : fallbackSafe;
  }
  if (bot.mode === 'chaos') {
    const chaos = getDeckById('special-chaos') ? 'special-chaos' : 'general-absurd';
    return canUseDeckInRoom(chaos, allowNsfw) ? chaos : fallbackSafe;
  }
  const randomDeck = getDeckById('general-classic') ? 'general-classic' : CAH_THEME_DECKS[0].id;
  return canUseDeckInRoom(randomDeck, allowNsfw) ? randomDeck : fallbackSafe;
}

function startRound() {
  gameState.submissions = {};
  gameState.phase = 'playing';
  gameState.rerollsRoundUsed[me.id] = 0;

  gameState.currentBlack = gameState.blackDeck.shift();
  if (!gameState.currentBlack) {
    gameState.blackDeck = shuffle(CAH_BLACK_CARDS.map((c, i) => ({ ...c, id: i })));
    gameState.currentBlack = gameState.blackDeck.shift();
  }

  if (gameState.mode === 'question') {
    gameState.currentBlack = { ...gameState.currentBlack, questionFirst: true };
  }

  simulateBotSubmissions();
  renderGameScreen();
}

function getCzar() {
  return gameState.room.players[gameState.czarIndex % gameState.room.players.length];
}

function renderGameScreen() {
  const bc = gameState.currentBlack;
  const czar = getCzar();
  const isCzar = czar.id === me.id;

  document.getElementById('gameRoundInfo').textContent = 'Round ' + gameState.round;
  document.getElementById('gameScoreInfo').textContent = 'Score: ' + (gameState.scores[me.id] || 0);

  document.getElementById('blackCardText').textContent = bc.text;
  document.getElementById('pickBadge').textContent = 'PICK ' + bc.pick;

  document.getElementById('czarBanner').style.display = isCzar ? 'block' : 'none';
  document.getElementById('handSection').style.display = isCzar ? 'none' : 'block';
  document.getElementById('czarSection').style.display = isCzar ? 'block' : 'none';
  document.getElementById('btnPlayCards').style.display = isCzar ? 'none' : 'block';
  document.getElementById('btnRerollCard').style.display = isCzar ? 'none' : 'block';

  if (!isCzar) renderHand();
  if (isCzar) renderSubmissions();

  showScreen('game');
}

function renderHand() {
  const hand = gameState.hands[me.id] || [];
  const bc = gameState.currentBlack;

  document.getElementById('handCards').innerHTML = hand.map(card =>
    `<div class="white-card" data-id="${card.id}" onclick="toggleCard(${card.id})">${escHtml(card.text)}</div>`
  ).join('');

  const rerollsLeftRound = Math.max(0, MAX_REROLLS_PER_ROUND - (gameState.rerollsRoundUsed[me.id] || 0));
  const rerollsLeftGame = Math.max(0, MAX_REROLLS_PER_GAME - (gameState.rerollsGameUsed[me.id] || 0));
  const rerollBtn = document.getElementById('btnRerollCard');
  rerollBtn.textContent = `Reroll Selected (3 🪙) · Round ${rerollsLeftRound}/${MAX_REROLLS_PER_ROUND} · Game ${rerollsLeftGame}/${MAX_REROLLS_PER_GAME}`;

  document.getElementById('btnPlayCards').onclick = () => {
    const selected = [...document.querySelectorAll('.white-card.selected')].map(el => parseInt(el.dataset.id, 10));
    if (selected.length !== bc.pick) return alert(`Pick exactly ${bc.pick} card(s)!`);
    submitCards(selected);
  };

  rerollBtn.onclick = () => {
    const selected = [...document.querySelectorAll('.white-card.selected')].map(el => parseInt(el.dataset.id, 10));
    if (selected.length !== 1) return alert('Select exactly 1 card to reroll.');
    rerollCard(selected[0]);
  };
}

window.toggleCard = function(cardId) {
  const el = document.querySelector(`.white-card[data-id="${cardId}"]`);
  if (!el) return;
  const bc = gameState.currentBlack;
  const selected = document.querySelectorAll('.white-card.selected');

  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
  } else {
    if (selected.length >= bc.pick) selected[0].classList.remove('selected');
    el.classList.add('selected');
  }
};

function rerollCard(cardId) {
  const roundUsed = gameState.rerollsRoundUsed[me.id] || 0;
  const gameUsed = gameState.rerollsGameUsed[me.id] || 0;

  if (roundUsed >= MAX_REROLLS_PER_ROUND) return alert('Reroll limit reached for this round.');
  if (gameUsed >= MAX_REROLLS_PER_GAME) return alert('Reroll limit reached for this game.');
  if ((me.economy.coins || 0) < REROLL_COST_COINS) return alert('Not enough coins for reroll.');

  const hand = gameState.hands[me.id] || [];
  const idx = hand.findIndex(c => c.id === cardId);
  if (idx < 0) return;

  me.economy.coins -= REROLL_COST_COINS;
  save('cah_player', me);

  gameState.rerollsRoundUsed[me.id] = roundUsed + 1;
  gameState.rerollsGameUsed[me.id] = gameUsed + 1;
  hand[idx] = drawCardForPlayer(me.id);
  gameState.hands[me.id] = hand;

  renderHand();
}

function submitCards(cardIds) {
  gameState.submissions[me.id] = cardIds;
  gameState.hands[me.id] = (gameState.hands[me.id] || []).filter(c => !cardIds.includes(c.id));
  simulateBotSubmissions();

  const czar = getCzar();
  if (czar.id !== me.id) {
    showCzarJudging();
  } else {
    renderSubmissions();
    document.getElementById('czarSection').style.display = 'block';
    document.getElementById('handSection').style.display = 'none';
  }
}

function showCzarJudging() {
  setTimeout(() => {
    if (!isBotPlayer(getCzar().id) && getCzar().id === me.id) return;
    const submitters = getEligibleSubmitters();
    if (!submitters.length) {
      nextRound();
      return;
    }
    const winnerId = pickWinningSubmission(submitters);
    resolveRound(winnerId);
  }, 1200);
}

function renderSubmissions() {
  const cont = document.getElementById('submittedCards');
  const submitters = Object.keys(gameState.submissions).filter(id => id !== getCzar().id);

  if (!submitters.length) {
    cont.innerHTML = '<p style="color:#555;">Waiting for players to submit…</p>';
    return;
  }

  cont.innerHTML = shuffle(submitters).map(pid => {
    const cardIds = gameState.submissions[pid] || [];
    const texts = cardIds.map(id => gameState.cardTextById[id] || '').filter(Boolean);
    return `<div class="white-card" onclick="czarPick('${pid}')">${escHtml(texts.join(' / '))}</div>`;
  }).join('');
}

window.czarPick = function(winnerId) {
  resolveRound(winnerId);
};

function resolveRound(winnerId) {
  const winner = gameState.room.players.find(p => p.id === winnerId);
  if (!winner) {
    nextRound();
    return;
  }

  gameState.scores[winnerId] = (gameState.scores[winnerId] || 0) + 1;
  gameState.room.players.forEach(p => { p.score = gameState.scores[p.id] || 0; });

  if (winnerId === me.id && hasAtLeastTwoHumans(gameState.room)) {
    me.economy.coins += ROUND_WIN_COINS;
    save('cah_player', me);
  }

  const bc = gameState.currentBlack;
  const cardIds = gameState.submissions[winnerId] || [];
  const texts = cardIds.map(id => gameState.cardTextById[id] || '').filter(Boolean);
  const praise = WINNER_PRAISES[Math.floor(Math.random() * WINNER_PRAISES.length)];

  document.getElementById('resultBlack').textContent = bc.text;
  document.getElementById('resultWhite').textContent = texts.join(' / ');
  document.getElementById('roundWinnerBox').innerHTML = `🏅 <strong>${escHtml(winner.name)}</strong> wins the round!`;
  document.getElementById('roundPraise').textContent = praise;

  const sorted = [...gameState.room.players].sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0));
  document.getElementById('scoreBoard').innerHTML = sorted.map(p =>
    `<div class="score-row"><span class="score-name">${escHtml(p.name)}</span><span class="score-pts">${gameState.scores[p.id] || 0} ✦</span></div>`
  ).join('');

  showScreen('result');

  if ((gameState.scores[winnerId] || 0) >= gameState.room.roundsToWin) {
    document.getElementById('btnNextRound').style.display = 'none';
    setTimeout(() => showGameOver(winner, praise), 2000);
  } else {
    document.getElementById('btnNextRound').style.display = '';
  }
}

document.getElementById('btnNextRound').addEventListener('click', nextRound);

function nextRound() {
  gameState.round++;
  gameState.czarIndex++;

  gameState.room.players.forEach(p => {
    const hand = gameState.hands[p.id] || [];
    while (hand.length < 10) hand.push(drawCardForPlayer(p.id));
    gameState.hands[p.id] = hand;
  });

  startRound();
}

function forceRandomAiCzar() {
  const aiPlayers = gameState.room.players.filter(p => p.isBot);
  if (!aiPlayers.length) {
    alert('No AI players in this room. Add AI players when creating the room first.');
    return;
  }

  const chosen = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
  const forcedIndex = gameState.room.players.findIndex(p => p.id === chosen.id);
  if (forcedIndex < 0) return;

  gameState.czarIndex = forcedIndex;
  startRound();
}

/* ─── Bot Engine ─── */
function generateBotPlayers(count, usedNames = []) {
  const used = new Set((usedNames || []).map(n => n.toLowerCase()));
  const bots = [];

  for (let i = 0; i < count; i++) {
    const persona = BOT_PERSONAS[i % BOT_PERSONAS.length];
    const base = persona.name;
    let candidate = base;
    let suffix = 2;

    while (used.has(candidate.toLowerCase())) {
      candidate = `${base} ${suffix}`;
      suffix++;
    }

    used.add(candidate.toLowerCase());
    bots.push({
      id: genId(),
      name: candidate,
      score: 0,
      isBot: true,
      personaKey: persona.key,
      mode: persona.mode,
      avatar: persona.avatar
    });
  }

  return bots;
}

function isBotPlayer(playerId) {
  const player = gameState?.room?.players?.find(p => p.id === playerId);
  return Boolean(player?.isBot);
}

function getEligibleSubmitters() {
  const czar = getCzar();
  return Object.keys(gameState.submissions).filter(id => id !== czar.id);
}

function pickWinningSubmission(submitters) {
  const czar = getCzar();
  const mode = czar?.mode || 'random';

  if (mode === 'spicy') {
    const scored = submitters.map(id => {
      const cards = (gameState.submissions[id] || []).map(cardId => gameState.cardTextById[cardId] || '');
      const score = cards.reduce((sum, text) => sum + scoreCardText(text), 0);
      return { id, weight: Math.max(1, score + 1) };
    });
    return weightedRandomId(scored);
  }

  if (mode === 'chaos') {
    const scored = submitters.map(id => {
      const cards = (gameState.submissions[id] || []).map(cardId => gameState.cardTextById[cardId] || '');
      const score = cards.reduce((sum, text) => sum + scoreCardText(text), 0);
      return { id, score };
    }).sort((a, b) => a.score - b.score);

    if (scored.length === 1) return scored[0].id;
    return Math.random() > 0.5 ? scored[0].id : scored[scored.length - 1].id;
  }

  return submitters[Math.floor(Math.random() * submitters.length)];
}

function chooseBotCards(playerId, pickCount) {
  const hand = gameState.hands[playerId] || [];
  const bot = gameState.room.players.find(p => p.id === playerId);
  if (!bot || !hand.length) return [];

  const mode = bot.mode || 'random';
  if (mode === 'spicy') {
    const scored = hand
      .map(card => ({ card, score: scoreCardText(card.text || '') }))
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, pickCount).map(entry => entry.card.id);
  }

  if (mode === 'chaos') {
    const scored = hand
      .map(card => ({ card, score: scoreCardText(card.text || '') }))
      .sort((a, b) => a.score - b.score);
    const pickHigh = Math.random() > 0.5;
    const pool = pickHigh ? [...scored].reverse() : scored;
    return pool.slice(0, pickCount).map(entry => entry.card.id);
  }

  return shuffle(hand).slice(0, pickCount).map(c => c.id);
}

function scoreCardText(text) {
  const lower = text.toLowerCase();
  const spicyWords = [
    'sex', 'naked', 'poop', 'shit', 'penis', 'clitoris', 'blood', 'death',
    'drunk', 'blackout', 'fart', 'holocaust', 'corpse', 'diarrhea'
  ];

  let score = 0;
  spicyWords.forEach(word => { if (lower.includes(word)) score += 3; });
  score += (text.match(/[!?]/g) || []).length;
  score += Math.min(2, Math.floor(text.length / 30));
  return score;
}

function weightedRandomId(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (!total) return entries[0]?.id;

  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return entries[entries.length - 1]?.id;
}

function simulateBotSubmissions() {
  if (!gameState) return;
  const czar = getCzar();
  const pickCount = gameState.currentBlack.pick;

  gameState.room.players.forEach(player => {
    if (!player.isBot) return;
    if (player.id === czar.id) return;
    if (gameState.submissions[player.id]) return;

    const chosen = chooseBotCards(player.id, pickCount);
    gameState.submissions[player.id] = chosen;
    gameState.hands[player.id] = (gameState.hands[player.id] || []).filter(card => !chosen.includes(card.id));
  });
}

/* ─── Endgame rewards ─── */
function hasAtLeastTwoHumans(room) {
  return room.players.filter(p => !p.isBot).length >= 2;
}

function getHumanRankForMe() {
  const humans = gameState.room.players.filter(p => !p.isBot)
    .sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0));
  const idx = humans.findIndex(h => h.id === me.id);
  return idx >= 0 ? idx + 1 : null;
}

function awardEndgameRewardsIfEligible() {
  if (!hasAtLeastTwoHumans(gameState.room)) return;

  const myRank = getHumanRankForMe();
  if (!myRank || myRank > 3) return;

  const aiCount = gameState.room.players.filter(p => p.isBot).length;
  const coins = ENDGAME_COIN_PODIUM[myRank] || 0;
  const tokens = ENDGAME_TOKEN_PODIUM[myRank] || 0;

  me.economy.coins += coins;
  if (aiCount <= 1) me.economy.tokens += tokens;
}

function showGameOver(winner, praise) {
  document.getElementById('gameOverWinner').textContent = '🎉 ' + winner.name + ' wins the game!';
  document.getElementById('gameOverPraise').textContent = praise;

  const sorted = [...gameState.room.players].sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0));
  document.getElementById('gameOverScores').innerHTML = sorted.map((p, i) =>
    `<div class="score-row"><span class="score-name">${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${escHtml(p.name)}</span><span class="score-pts">${gameState.scores[p.id] || 0} ✦</span></div>`
  ).join('');

  if (me) {
    me.stats = me.stats || { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 };
    me.stats.gamesPlayed++;
    if (winner.id === me.id) me.stats.gamesWon++;
    me.stats.roundsWon = (me.stats.roundsWon || 0) + (gameState.scores[me.id] || 0);

    awardEndgameRewardsIfEligible();
    save('cah_player', me);
  }

  showScreen('gameover');
}

function leaveGameToMenu() {
  gameState = null;
  showScreen('menu');
}

document.getElementById('btnPlayAgain').addEventListener('click', () => {
  if (currentRoom) startGame(currentRoom);
});
document.getElementById('btnBackMenu').addEventListener('click', () => showScreen('menu'));
document.getElementById('btnLeaveGame').addEventListener('click', leaveGameToMenu);

/* ─── Friends ─── */
document.getElementById('btnAddFriend').addEventListener('click', () => {
  const name = document.getElementById('friendName').value.trim();
  if (!name) return;
  if (friends.find(f => f.name.toLowerCase() === name.toLowerCase())) return alert('Already in your friends list!');

  friends.push({ id: genId(), name, addedAt: Date.now() });
  save('cah_friends', friends);
  document.getElementById('friendName').value = '';
  renderFriends();
});

function renderFriends() {
  const list = document.getElementById('friendList');
  if (!friends.length) {
    list.innerHTML = '<p style="color:#555;text-align:center;margin-top:20px;">No friends yet. Add some!</p>';
    return;
  }

  list.innerHTML = friends.map(f => `
    <div class="friend-item">
      <div><div class="friend-name">👤 ${escHtml(f.name)}</div><div class="friend-status">Added ${new Date(f.addedAt).toLocaleDateString()}</div></div>
      <button class="btn-ghost sm" onclick="removeFriend('${f.id}')">Remove</button>
    </div>`).join('');
}

window.removeFriend = id => {
  friends = friends.filter(f => f.id !== id);
  save('cah_friends', friends);
  renderFriends();
};

/* ─── Stats ─── */
function renderStats() {
  const stats = me?.stats || { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 };
  const economy = me?.economy || { coins: 0, tokens: 0 };
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  document.getElementById('statsBody').innerHTML = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:4rem;">👤</div>
      <div style="font-size:1.4rem;font-weight:900;margin-top:8px;">${escHtml(me?.name || 'Guest')}</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-num">${stats.gamesPlayed}</div><div class="stat-label">Games Played</div></div>
      <div class="stat-card"><div class="stat-num">${stats.gamesWon}</div><div class="stat-label">Games Won</div></div>
      <div class="stat-card"><div class="stat-num">${stats.roundsWon || 0}</div><div class="stat-label">Rounds Won</div></div>
      <div class="stat-card"><div class="stat-num">${winRate}%</div><div class="stat-label">Win Rate</div></div>
      <div class="stat-card"><div class="stat-num">${economy.coins}</div><div class="stat-label">Coins</div></div>
      <div class="stat-card"><div class="stat-num">${economy.tokens}</div><div class="stat-label">Tokens</div></div>
    </div>`;
}

/* ─── Utilities ─── */
function genId() { return Math.random().toString(36).slice(2, 10); }

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
