/* ===== Cards Against Humanity — app.js ===== */

/* ─── Storage helpers ─── */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
function save(k, v) {
  localStorage.setItem(k, JSON.stringify(v));
  if (k === 'cah_player') queueProfileSync(v);
}

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
const CUSTOM_DECK_PREFIX = 'custom-';
const CUSTOM_DECK_CATEGORY_ID = 'custom-player';
const MIN_CUSTOM_DECK_CARDS = 20;

/* ─── State ─── */
let me = load('cah_player', null);
let rooms = load('cah_rooms', {});
let friends = load('cah_friends', []);

let currentRoom = null;
let gameState = null;
let deckCart = new Set();
let deckCategoryCollapsed = {};
let deckPreviewByCategory = {};
let showOwnedDecksInStore = false;
let profileSyncTimer = null;
let authBusy = false;
let unsubscribeRoomListener = null;
let unsubscribeRoomListListener = null;
let isGameHost = false;

const BOT_PERSONAS = [
  { key: 'skeeter', name: 'Skeeter', mode: 'spicy', avatar: 'icons/bot-skeeter.svg' },
  { key: 'sally', name: 'Sally', mode: 'chaos', avatar: 'icons/bot-sally.svg' },
  { key: 'linus', name: 'Linus', mode: 'random', avatar: 'icons/bot-linus.svg' }
];

/* ─── Screen management ─── */
function showScreen(id) {
  const keepChatScreens = ['lobby', 'game', 'result'];
  if (!keepChatScreens.includes(id)) stopChatSubscription();

  const keepListenerScreens = ['lobby', 'game', 'result', 'gameover'];
  if (!keepListenerScreens.includes(id) && unsubscribeRoomListener) {
    unsubscribeRoomListener();
    unsubscribeRoomListener = null;
  }
  if (id !== 'join' && unsubscribeRoomListListener) {
    unsubscribeRoomListListener();
    unsubscribeRoomListListener = null;
  }

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

document.querySelectorAll('.btn-ghost.back').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.target || 'menu'));
});

function setAuthMessage(text, isError = false) {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isError ? '#ff8d8d' : '#9aa0a6';
}

function setAuthLoading(isBusy) {
  authBusy = isBusy;
  const ids = ['btnSignUp', 'btnSignIn', 'btnResetPassword'];
  ids.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = isBusy;
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function mapAuthError(err) {
  const code = String(err?.code || '');
  const origin = window.location?.origin || 'this origin';
  if (code.includes('api-key-not-valid')) return 'Firebase API key is blocked for this domain. Add this origin in Firebase app settings or use the deployed site URL.';
  if (code.includes('unauthorized-domain') || code.includes('operation-not-allowed')) {
    return `Firebase auth is not authorized for ${origin}. Add the host to Firebase Auth Authorized domains and allow this referrer in the Firebase API key restrictions.`;
  }
  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('email-already-in-use')) return 'That email is already registered. Try signing in.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('user-not-found')) return 'No account found for that email.';
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Incorrect email or password.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.';
  return err?.message || 'Authentication request failed.';
}

function updateAuthTopbar(user) {
  const authState = document.getElementById('authStateText');
  const signOutBtn = document.getElementById('btnSignOut');
  if (!authState || !signOutBtn) return;

  if (user) {
    authState.textContent = `Signed in as ${user.email || me?.name || 'Player'}`;
    signOutBtn.disabled = false;
  } else {
    authState.textContent = 'Not signed in';
    signOutBtn.disabled = true;
  }
}

function makeDefaultProfile(name, id, email = '') {
  return {
    id,
    name,
    email,
    stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 },
    economy: { coins: STARTER_COINS, tokens: STARTER_TOKENS },
    customDecks: [],
    gameHistory: [],
    deckProgress: {
      ownedDeckIds: [],
      activeDeckId: null,
      freeStarterClaimed: false,
      featuredSpecialClaimed: false
    }
  };
}

function normalizeDeckProgress(dp) {
  const src = dp || {};
  const owned = Array.isArray(src.ownedDeckIds) ? src.ownedDeckIds : [];
  return {
    ownedDeckIds: [...new Set(owned.filter(Boolean))],
    activeDeckId: src.activeDeckId || null,
    freeStarterClaimed: Boolean(src.freeStarterClaimed),
    featuredSpecialClaimed: Boolean(src.featuredSpecialClaimed)
  };
}

function normalizeCustomDecks(decks) {
  if (!Array.isArray(decks)) return [];
  const seen = new Set();
  const out = [];

  decks.forEach(deck => {
    const id = String(deck?.id || '').trim();
    const name = String(deck?.name || '').trim();
    const cards = Array.isArray(deck?.whiteCards)
      ? deck.whiteCards.map(c => String(c || '').trim()).filter(Boolean)
      : [];

    if (!id || seen.has(id) || !name || cards.length < MIN_CUSTOM_DECK_CARDS) return;
    seen.add(id);
    out.push({
      id,
      name,
      description: String(deck?.description || 'Player-created custom deck.').trim(),
      categoryId: CUSTOM_DECK_CATEGORY_ID,
      family: 'general',
      tier: 1,
      tokenCost: 0,
      sourcePackKey: 'custom',
      sourcePackName: 'Custom Pack',
      sourceOfficial: false,
      whiteCards: cards,
      createdAt: Number(deck?.createdAt) || Date.now(),
      updatedAt: Number(deck?.updatedAt) || Date.now()
    });
  });

  return out;
}

function mergeProfiles(baseProfile, legacyProfile) {
  if (!legacyProfile) return baseProfile;

  const baseStats = baseProfile.stats || {};
  const legacyStats = legacyProfile.stats || {};
  const baseEconomy = baseProfile.economy || {};
  const legacyEconomy = legacyProfile.economy || {};

  const mergedDeck = (() => {
    const a = normalizeDeckProgress(baseProfile.deckProgress);
    const b = normalizeDeckProgress(legacyProfile.deckProgress);
    const owned = [...new Set([...(a.ownedDeckIds || []), ...(b.ownedDeckIds || [])])];
    const candidate = a.activeDeckId || b.activeDeckId || null;
    return {
      ownedDeckIds: owned,
      activeDeckId: candidate && owned.includes(candidate) ? candidate : (candidate || null),
      freeStarterClaimed: a.freeStarterClaimed || b.freeStarterClaimed,
      featuredSpecialClaimed: a.featuredSpecialClaimed || b.featuredSpecialClaimed
    };
  })();

  return {
    ...baseProfile,
    name: String(baseProfile.name || legacyProfile.name || 'Player'),
    stats: {
      gamesPlayed: Math.max(baseStats.gamesPlayed || 0, legacyStats.gamesPlayed || 0),
      gamesWon: Math.max(baseStats.gamesWon || 0, legacyStats.gamesWon || 0),
      roundsWon: Math.max(baseStats.roundsWon || 0, legacyStats.roundsWon || 0)
    },
    economy: {
      coins: Math.max(baseEconomy.coins || 0, legacyEconomy.coins || 0),
      tokens: Math.max(baseEconomy.tokens || 0, legacyEconomy.tokens || 0)
    },
    customDecks: (() => {
      const merged = normalizeCustomDecks([...(baseProfile.customDecks || []), ...(legacyProfile.customDecks || [])]);
      const byId = new Map();
      merged.forEach(deck => {
        const prev = byId.get(deck.id);
        if (!prev || (deck.updatedAt || 0) >= (prev.updatedAt || 0)) byId.set(deck.id, deck);
      });
      return [...byId.values()];
    })(),
    gameHistory: Array.isArray(baseProfile.gameHistory) ? baseProfile.gameHistory : (Array.isArray(legacyProfile.gameHistory) ? legacyProfile.gameHistory : []),
    deckProgress: mergedDeck
  };
}

async function migrateLegacyLocalProfile(user, cloudProfile, fallbackName) {
  const legacy = load('cah_player', null);
  if (!legacy) return cloudProfile;

  const isLegacyProfile = String(legacy.id || '') !== String(user.uid || '');
  const merged = mergeProfiles(cloudProfile, isLegacyProfile ? legacy : null);

  if (isLegacyProfile) {
    await syncProfileToCloud(merged);
    setAuthMessage('Local profile migrated to cloud for this account.');
  }

  const finalName = String(merged.name || fallbackName || 'Player');
  return { ...merged, id: user.uid, email: user.email || merged.email || '', name: finalName };
}

async function loadProfileFromCloud(user, fallbackName) {
  const base = makeDefaultProfile(fallbackName || 'Player', user.uid, user.email || '');
  if (!window.firebaseDb) return base;

  const docRef = window.firebaseDb.collection('users').doc(user.uid);
  const snap = await docRef.get();
  if (!snap.exists) return base;

  const data = snap.data() || {};
  return {
    ...base,
    ...data,
    id: user.uid,
    name: String(data.username || data.name || fallbackName || 'Player'),
    email: user.email || data.email || ''
  };
}

async function syncProfileToCloud(profile) {
  const user = window.firebaseAuth?.currentUser;
  if (!user || !window.firebaseDb || !profile) return;

  await window.firebaseDb.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email || profile.email || '',
    username: profile.name || 'Player',
    stats: profile.stats || { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 },
    economy: profile.economy || { coins: STARTER_COINS, tokens: STARTER_TOKENS },
    deckProgress: profile.deckProgress || {
      ownedDeckIds: [],
      activeDeckId: null,
      freeStarterClaimed: false,
      featuredSpecialClaimed: false
    },
    updatedAt: Date.now()
  }, { merge: true });
}

function queueProfileSync(profile) {
  if (!window.firebaseAuth?.currentUser || !window.firebaseDb || !profile) return;
  clearTimeout(profileSyncTimer);
  profileSyncTimer = setTimeout(() => {
    syncProfileToCloud(profile).catch(() => {});
  }, 350);
}

function useFirestoreRoomSync() {
  return Boolean(window.firebaseDb && window.firebaseAuth?.currentUser);
}

function stopRoomSubscriptions() {
  if (unsubscribeRoomListener) {
    unsubscribeRoomListener();
    unsubscribeRoomListener = null;
  }
  if (unsubscribeRoomListListener) {
    unsubscribeRoomListListener();
    unsubscribeRoomListListener = null;
  }
}

function roomDocRef(code) {
  return window.firebaseDb.collection('rooms').doc(String(code || '').toUpperCase());
}

async function createRoomBackend(room) {
  const payload = { ...room, updatedAt: Date.now() };
  await roomDocRef(room.code).set(payload);
  return payload;
}

async function fetchRoomBackend(code) {
  const snap = await roomDocRef(code).get();
  if (!snap.exists) return null;
  return snap.data();
}

async function setRoomBackend(room) {
  const payload = { ...room, updatedAt: Date.now() };
  await roomDocRef(room.code).set(payload, { merge: true });
  return payload;
}

async function joinRoomBackend(code, player) {
  const ref = roomDocRef(code);
  return window.firebaseDb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('ROOM_NOT_FOUND');

    const room = snap.data();
    if (room.status !== 'lobby') throw new Error('ROOM_NOT_LOBBY');
    if ((room.players || []).length >= room.maxPlayers) throw new Error('ROOM_FULL');

    if ((room.players || []).some(p => p.id === player.id)) return room;

    const updated = {
      ...room,
      players: [...(room.players || []), player],
      updatedAt: Date.now()
    };
    tx.set(ref, updated, { merge: true });
    return updated;
  });
}

function renderOpenRoomList(openRooms) {
  const list = document.getElementById('roomList');
  if (!openRooms.length) {
    list.innerHTML = '<p style="color:#555;text-align:center;margin-top:20px;">No open rooms found.</p>';
    return;
  }

  list.innerHTML = '<p style="color:#888;font-size:0.85rem;margin-bottom:8px;">Open rooms:</p>' +
    openRooms.map(r => `<div style="background:#222;border:1px solid #333;border-radius:10px;padding:12px 16px;cursor:pointer;"
      onclick="joinRoom('${r.code}')">
      <strong>${escHtml(r.name)}</strong> <span style="color:#f6c90e;letter-spacing:2px;">${r.code}</span>
      <span style="color:#555;font-size:0.8rem;margin-left:10px;">${(r.players || []).length}/${r.maxPlayers} players · ${r.mode}</span>
    </div>`).join('');
}

function subscribeOpenRooms() {
  if (!useFirestoreRoomSync()) return;
  if (unsubscribeRoomListListener) unsubscribeRoomListListener();

  unsubscribeRoomListListener = window.firebaseDb.collection('rooms')
    .where('status', '==', 'lobby')
    .limit(30)
    .onSnapshot(snapshot => {
      const openRooms = snapshot.docs.map(d => d.data());
      renderOpenRoomList(openRooms);
    }, () => {
      renderRoomList();
    });
}

function subscribeActiveRoom(code) {
  if (!useFirestoreRoomSync()) return;
  if (unsubscribeRoomListener) unsubscribeRoomListener();

  unsubscribeRoomListener = roomDocRef(code).onSnapshot(snap => {
    if (!snap.exists) return;
    const data = snap.data();
    currentRoom = data;

    if (data.status === 'lobby') {
      renderLobbyMeta(data);
      refreshLobbyPlayers(data);
      return;
    }

    // Non-host clients receive the game-started signal and bootstrap locally.
    if (data.status === 'playing' && !gameState && !isGameHost) {
      startGameFromServer(data);
      return;
    }

    if (!gameState) return;

    if (data.gamePhase === 'picking') {
      if ((data.roundNum || 1) > gameState.round) {
        applyRoundFromServer(data);
      } else {
        applySubmissionsFromServer(data.submissions);
      }
    } else if (data.gamePhase === 'result' && gameState.phase !== 'result') {
      applyResultFromServer(data);
    }
  });
}

/* ─── Phase C: Game state sync helpers ─── */

function useFirestoreGameSync() {
  return useFirestoreRoomSync() && Boolean(currentRoom) &&
    (currentRoom.players || []).filter(p => !p.isBot).length >= 2;
}

async function pushRoundToBackend(code) {
  if (!useFirestoreGameSync() || !gameState) return;
  await roomDocRef(code).set({
    gamePhase: 'picking',
    roundNum: gameState.round,
    czarIndex: gameState.czarIndex,
    currentBlack: {
      text: gameState.currentBlack.text,
      pick: gameState.currentBlack.pick,
      id: gameState.currentBlack.id
    },
    submissions: {},
    scores: { ...gameState.scores },
    updatedAt: Date.now()
  }, { merge: true });
}

async function pushSubmissionToBackend(code, playerId, texts) {
  if (!useFirestoreGameSync()) return;
  const ref = roomDocRef(code);
  return window.firebaseDb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    if ((snap.data().submissions || {})[playerId]) return; // dedup
    tx.update(ref, {
      [`submissions.${playerId}`]: { texts, at: Date.now() },
      updatedAt: Date.now()
    });
  });
}

async function pushResultToBackend(code, winnerId, scores) {
  if (!useFirestoreGameSync()) return;
  await roomDocRef(code).set({
    gamePhase: 'result',
    lastWinnerId: winnerId,
    scores: { ...scores },
    updatedAt: Date.now()
  }, { merge: true });
}

function getSubmissionTexts(playerId) {
  if (gameState.submissionTexts?.[playerId]) return gameState.submissionTexts[playerId];
  return (gameState.submissions[playerId] || []).map(id => gameState.cardTextById[id] || '');
}

function applyRoundFromServer(data) {
  if (!gameState || !data.currentBlack) return;
  gameState.round = data.roundNum;
  gameState.czarIndex = data.czarIndex;
  gameState.scores = { ...(data.scores || {}) };
  gameState.submissions = {};
  gameState.submissionTexts = {};
  gameState.currentBlack = data.currentBlack;
  gameState.phase = 'playing';
  // Replenish hand for this client.
  const hand = gameState.hands[me.id] || [];
  while (hand.length < 10) hand.push(drawCardForPlayer(me.id));
  gameState.hands[me.id] = hand;
  renderGameScreen();
}

function applySubmissionsFromServer(serverSubs) {
  if (!gameState || !serverSubs) return;
  gameState.submissionTexts = gameState.submissionTexts || {};
  let changed = false;
  Object.entries(serverSubs).forEach(([pid, sub]) => {
    if (!gameState.submissionTexts[pid]) {
      gameState.submissionTexts[pid] = sub.texts || [];
      changed = true;
    }
  });
  if (!changed) return;
  if (getCzar().id === me.id) renderSubmissions();
}

function applyResultFromServer(data) {
  if (!gameState || gameState.phase === 'result') return;
  gameState.phase = 'result';
  if (data.lastWinnerId) resolveRound(data.lastWinnerId, true);
}

function startGameFromServer(data) {
  gameState = {
    room: data,
    blackDeck: [],
    hands: {},
    czarIndex: data.czarIndex || 0,
    round: data.roundNum || 1,
    scores: { ...(data.scores || {}) },
    submissions: {},
    submissionTexts: {},
    phase: 'playing',
    currentBlack: data.currentBlack || null,
    mode: data.mode,
    cardCounter: 1,
    cardTextById: {},
    playerDecks: {},
    drawPiles: {},
    rerollsRoundUsed: {},
    rerollsGameUsed: {}
  };

  (data.players || []).forEach(p => {
    gameState.scores[p.id] = gameState.scores[p.id] || 0;
    gameState.rerollsRoundUsed[p.id] = 0;
    gameState.rerollsGameUsed[p.id] = 0;
    const deckId = p.isBot
      ? chooseDeckForBot(p, data.allowNsfw !== false)
      : (me.deckProgress.activeDeckId || FREE_STARTER_DECK_ID);
    gameState.playerDecks[p.id] = deckId;
    gameState.drawPiles[p.id] = createDeckPile(deckId);
    gameState.hands[p.id] = [];
    while (gameState.hands[p.id].length < 10) gameState.hands[p.id].push(drawCardForPlayer(p.id));
  });

  if (data.submissions) {
    gameState.submissionTexts = {};
    Object.entries(data.submissions).forEach(([pid, sub]) => {
      gameState.submissionTexts[pid] = sub.texts || [];
    });
  }

  renderGameScreen();
}

/* ─── Phase D: In-Game Chat ─── */

const CHAT_MAX_LENGTH = 200;
const CHAT_MAX_MSGS = 50;        // messages retained per room
const CHAT_THROTTLE_MS = 1500;   // minimum ms between sends per client
let chatLastSent = 0;
let unsubscribeChatListener = null;
const CHAT_SCREENS = ['lobby', 'game', 'result'];

// Message mirror rendered in every visible chat panel simultaneously.
const CHAT_PANEL_IDS = {
  lobby:  { messages: 'chatMessagesLobby',  input: 'chatInputLobby',  btn: 'btnChatSendLobby'  },
  game:   { messages: 'chatMessagesGame',   input: 'chatInputGame',   btn: 'btnChatSendGame'   },
  result: { messages: 'chatMessagesResult', input: 'chatInputResult', btn: 'btnChatSendResult' }
};

function chatDocRef(roomCode) {
  return window.firebaseDb.collection('chats').doc(String(roomCode || '').toUpperCase());
}

function sanitizeChatText(raw) {
  return String(raw || '').trim().slice(0, CHAT_MAX_LENGTH);
}

async function sendChatMessage(roomCode, text) {
  const clean = sanitizeChatText(text);
  if (!clean) return;

  const now = Date.now();
  if (now - chatLastSent < CHAT_THROTTLE_MS) return;
  chatLastSent = now;

  const msg = {
    id: genId(),
    uid: me?.id || 'anon',
    name: me?.name || 'Player',
    text: clean,
    at: now
  };

  const ref = chatDocRef(roomCode);
  return window.firebaseDb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const msgs = snap.exists ? (snap.data().messages || []) : [];
    const trimmed = [...msgs, msg].slice(-CHAT_MAX_MSGS);
    tx.set(ref, { messages: trimmed, updatedAt: now }, { merge: false });
  });
}

function subscribeChatRoom(roomCode) {
  if (!useFirestoreRoomSync()) return;
  if (unsubscribeChatListener) {
    unsubscribeChatListener();
    unsubscribeChatListener = null;
  }

  unsubscribeChatListener = chatDocRef(roomCode).onSnapshot(snap => {
    if (!snap.exists) return;
    renderChatMessages(snap.data().messages || []);
  });
}

function stopChatSubscription() {
  if (unsubscribeChatListener) {
    unsubscribeChatListener();
    unsubscribeChatListener = null;
  }
}

function renderChatMessages(msgs) {
  const myId = me?.id;
  const html = msgs.map(m => {
    const isMine = m.uid === myId;
    return `<div class="chat-msg${isMine ? ' chat-msg-mine' : ''}">
      <span class="chat-name">${escHtml(m.name)}</span>
      <span class="chat-text">${escHtml(m.text)}</span>
    </div>`;
  }).join('');

  Object.values(CHAT_PANEL_IDS).forEach(({ messages }) => {
    const el = document.getElementById(messages);
    if (!el) return;
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
  });
}

function initChatHandlers() {
  Object.entries(CHAT_PANEL_IDS).forEach(([, ids]) => {
    const input = document.getElementById(ids.input);
    const btn   = document.getElementById(ids.btn);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text || !currentRoom?.code) return;
      input.value = '';
      sendChatMessage(currentRoom.code, text).catch(() => {});
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') btn.click();
    });
  });
}

/* ─── Profile / Economy ─── */
const GAME_HISTORY_LIMIT = 12;

function initPlayerProfile() {
  if (!me) return;
  me.stats = me.stats || { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 };
  me.economy = me.economy || { coins: STARTER_COINS, tokens: STARTER_TOKENS };
  me.gameHistory = Array.isArray(me.gameHistory) ? me.gameHistory : [];
  me.customDecks = normalizeCustomDecks(me.customDecks || []);
  me.deckProgress = me.deckProgress || {
    ownedDeckIds: [],
    activeDeckId: null,
    freeStarterClaimed: false,
    featuredSpecialClaimed: false
  };

  me.deckProgress.ownedDeckIds = Array.isArray(me.deckProgress.ownedDeckIds) ? me.deckProgress.ownedDeckIds : [];
  me.customDecks.forEach(deck => {
    if (!me.deckProgress.ownedDeckIds.includes(deck.id)) me.deckProgress.ownedDeckIds.push(deck.id);
  });

  if (me.deckProgress.activeDeckId && !ownsDeck(me.deckProgress.activeDeckId)) {
    me.deckProgress.activeDeckId = null;
  }

  save('cah_player', me);
}

function getAllDecks() {
  return [...(CAH_THEME_DECKS || []), ...(me?.customDecks || [])];
}

function getDeckById(deckId) {
  return getAllDecks().find(d => d.id === deckId) || null;
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

function isAdminUser() {
  return String(me?.name || '').trim().toLowerCase() === 'admin';
}

function ownsDeck(deckId) {
  if (isAdminUser()) return true;
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
  if (isAdminUser()) return true;
  return Boolean(me?.deckProgress?.activeDeckId && ownsDeck(me.deckProgress.activeDeckId));
}

function getDeckCardTexts(deck) {
  if (!deck) return [];
  if (Array.isArray(deck.whiteCards)) {
    return deck.whiteCards.map(text => String(text || '').trim()).filter(Boolean);
  }
  return (deck.whiteCardIndexes || [])
    .map(idx => String(CAH_WHITE_CARDS[idx] || '').trim())
    .filter(Boolean);
}

function shouldShowDeckInStore(deck) {
  if (showOwnedDecksInStore) return true;
  if (deck.categoryId === CUSTOM_DECK_CATEGORY_ID) return true;
  return !ownsDeck(deck.id);
}

function openDeckStore(message = '') {
  deckCart = new Set();
  initDeckCategoryCollapseState();
  showScreen('decks');
  renderDeckStore(message);
}

function getDeckCategoriesForStore() {
  const base = [...(CAH_DECK_CATEGORIES || [])];
  if ((me?.customDecks || []).length) {
    base.unshift({ id: CUSTOM_DECK_CATEGORY_ID, name: 'My Custom Packs', nsfw: false });
  }
  return base;
}

function initDeckCategoryCollapseState() {
  const categories = getDeckCategoriesForStore();
  deckCategoryCollapsed = {};
  deckPreviewByCategory = {};
  categories.forEach(category => {
    deckCategoryCollapsed[category.id] = !['core-expansions', CUSTOM_DECK_CATEGORY_ID].includes(category.id);
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
  const categories = getDeckCategoriesForStore();
  const allDecks = getAllDecks();

  const mustClaim = !isAdminUser() && (!me.deckProgress.freeStarterClaimed || !hasActiveDeck());
  const baseMessage = message || (mustClaim
    ? 'Claim your free first deck and select an active deck before creating or joining games.'
    : 'Browse by category. Expand groups, select decks, then complete your purchase in checkout. You can also import custom packs.');

  msgEl.innerHTML = `
    <div class="deck-store-message-row">
      <span>${escHtml(baseMessage)}</span>
      <button class="btn-ghost sm" onclick="toggleOwnedDeckVisibility()">${showOwnedDecksInStore ? 'Hide Owned Decks' : 'Show Owned Decks'}</button>
    </div>
  `;

  listEl.innerHTML = categories.map(category => {
    const decksInCategory = allDecks.filter(deck => deck.categoryId === category.id && shouldShowDeckInStore(deck));
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
            ${decksInCategory.length
              ? decksInCategory.map(deck => `
              <button class="deck-name-item ${deck.id === selectedDeckId ? 'active' : ''}" onclick="selectDeckPreview('${category.id}','${deck.id}')">
                ${escHtml(deck.name)}
              </button>
            `).join('')
              : '<p class="deck-empty">No available decks in this category.</p>'}
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

window.toggleOwnedDeckVisibility = function() {
  showOwnedDecksInStore = !showOwnedDecksInStore;
  renderDeckStore();
};

function renderDeckPreviewCard(deck, category) {
  const owned = ownsDeck(deck.id);
  const selected = me.deckProgress.activeDeckId === deck.id;
  const isCustom = deck.categoryId === CUSTOM_DECK_CATEGORY_ID;
  const cardCount = Array.isArray(deck.whiteCards)
    ? deck.whiteCards.length
    : ((deck.whiteCardIndexes || []).length);
  const tokenCost = getDeckTokenCost(deck);
  const coinCost = getDeckCoinCost(deck);
  const isFreeStarterClaim = !isAdminUser() && !me.deckProgress.freeStarterClaimed && deck.id === FREE_STARTER_DECK_ID;
  const isInCart = deckCart.has(deck.id);
  const coverSrc = getDeckCoverSrc(deck);

  let actionHtml = '';
  if (isFreeStarterClaim) {
    actionHtml = `<button class="btn-white sm" onclick="claimStarterDeck()">Claim Free Starter Deck</button>`;
  } else if (isCustom) {
    actionHtml = selected
      ? `<span class="deck-tag-selected">Equipped</span><button class="btn-ghost sm" onclick="deleteCustomDeck('${deck.id}')">Delete</button>`
      : `<button class="btn-ghost sm" onclick="selectDeck('${deck.id}')">Equip Deck</button><button class="btn-ghost sm" onclick="deleteCustomDeck('${deck.id}')">Delete</button>`;
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
          <span>${cardCount} white cards</span>
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
        ${isCustom
          ? '<div class="deck-price">Custom</div>'
          : owned
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
  const selectedDecks = getAllDecks().filter(d => deckCart.has(d.id) && !ownsDeck(d.id));

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
  const selectedDecks = getAllDecks().filter(d => deckCart.has(d.id) && !ownsDeck(d.id));
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
  const selectedDecks = getAllDecks().filter(d => deckCart.has(d.id) && !ownsDeck(d.id));
  if (!selectedDecks.length) {
    closeCheckoutModal();
    return;
  }
  openCheckoutModal();
};

function confirmCheckoutPurchase() {
  const selectedDecks = getAllDecks().filter(d => deckCart.has(d.id) && !ownsDeck(d.id));
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
    'meme-chaos': { c1: '#8f3d95', c2: '#1f1322', icon: '✹' },
    'custom-player': { c1: '#6a5a2d', c2: '#1e1a0f', icon: '✎' }
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

function parseCustomCardsInput(raw) {
  const text = String(raw || '').trim();
  if (!text) return { ok: false, error: 'Please provide cards as JSON or one card per line.' };

  const fromLines = t => t.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const cards = parsed.map(v => String(v || '').trim()).filter(Boolean);
      return { ok: true, cards };
    }
    if (parsed && Array.isArray(parsed.whiteCards)) {
      const cards = parsed.whiteCards.map(v => String(v || '').trim()).filter(Boolean);
      return {
        ok: true,
        cards,
        name: String(parsed.name || '').trim(),
        description: String(parsed.description || '').trim()
      };
    }
    return { ok: false, error: 'JSON must be an array of cards or an object with whiteCards array.' };
  } catch {
    return { ok: true, cards: fromLines(text) };
  }
}

function closeDeckImportModal() {
  document.getElementById('deckImportModal').classList.add('hidden');
}

function openDeckImportModal() {
  document.getElementById('customDeckName').value = '';
  document.getElementById('customDeckDescription').value = '';
  document.getElementById('customDeckCards').value = '';
  document.getElementById('customDeckImportMessage').textContent = '';
  document.getElementById('deckImportModal').classList.remove('hidden');
}

function createOrImportCustomDeck() {
  const nameInput = document.getElementById('customDeckName').value.trim();
  const descInput = document.getElementById('customDeckDescription').value.trim();
  const cardsInput = document.getElementById('customDeckCards').value;
  const msgEl = document.getElementById('customDeckImportMessage');

  const parsed = parseCustomCardsInput(cardsInput);
  if (!parsed.ok) {
    msgEl.textContent = parsed.error;
    return;
  }

  const cards = parsed.cards;
  if (cards.length < MIN_CUSTOM_DECK_CARDS) {
    msgEl.textContent = `Need at least ${MIN_CUSTOM_DECK_CARDS} non-empty cards. Found ${cards.length}.`;
    return;
  }

  const now = Date.now();
  const deckName = nameInput || parsed.name || `Custom Pack ${new Date(now).toLocaleDateString()}`;
  const deckDescription = descInput || parsed.description || 'Player-created custom deck.';
  const deckId = `${CUSTOM_DECK_PREFIX}${genId()}`;
  const deck = {
    id: deckId,
    name: deckName,
    description: deckDescription,
    categoryId: CUSTOM_DECK_CATEGORY_ID,
    family: 'general',
    tier: 1,
    tokenCost: 0,
    sourcePackKey: 'custom',
    sourcePackName: 'Custom Pack',
    sourceOfficial: false,
    whiteCards: cards,
    createdAt: now,
    updatedAt: now
  };

  me.customDecks = normalizeCustomDecks([...(me.customDecks || []), deck]);
  me.deckProgress.ownedDeckIds = [...new Set([...(me.deckProgress.ownedDeckIds || []), deckId])];
  me.deckProgress.activeDeckId = deckId;
  save('cah_player', me);

  closeDeckImportModal();
  initDeckCategoryCollapseState();
  deckPreviewByCategory[CUSTOM_DECK_CATEGORY_ID] = deckId;
  renderDeckStore(`Imported custom deck: ${deckName} (${cards.length} cards).`);
}

window.deleteCustomDeck = function(deckId) {
  const deck = getDeckById(deckId);
  if (!deck || deck.categoryId !== CUSTOM_DECK_CATEGORY_ID) return;
  if (!confirm(`Delete custom deck "${deck.name}"? This cannot be undone.`)) return;

  me.customDecks = (me.customDecks || []).filter(d => d.id !== deckId);
  me.deckProgress.ownedDeckIds = (me.deckProgress.ownedDeckIds || []).filter(id => id !== deckId);
  if (me.deckProgress.activeDeckId === deckId) {
    me.deckProgress.activeDeckId = FREE_STARTER_DECK_ID;
  }
  save('cah_player', me);

  initDeckCategoryCollapseState();
  renderDeckStore(`Deleted custom deck: ${deck.name}.`);
};

document.getElementById('btnOpenCheckout').addEventListener('click', openCheckoutModal);
document.getElementById('btnCloseCheckout').addEventListener('click', closeCheckoutModal);
document.getElementById('btnConfirmCheckout').addEventListener('click', confirmCheckoutPurchase);
document.getElementById('btnOpenImportDeck').addEventListener('click', openDeckImportModal);
document.getElementById('btnCloseImportDeck').addEventListener('click', closeDeckImportModal);
document.getElementById('btnConfirmImportDeck').addEventListener('click', createOrImportCustomDeck);
document.getElementById('deckCheckoutModal').addEventListener('click', (e) => {
  if (e.target.id === 'deckCheckoutModal') closeCheckoutModal();
});
document.getElementById('deckImportModal').addEventListener('click', (e) => {
  if (e.target.id === 'deckImportModal') closeDeckImportModal();
});

function requireDeckAccess(message) {
  if (hasActiveDeck()) return true;
  openDeckStore(message || 'Select a deck first.');
  return false;
}

/* ─── Landing / Login ─── */
async function handleAuthSuccess(user, fallbackName, successText) {
  const cloudProfile = await loadProfileFromCloud(user, fallbackName);
  me = await migrateLegacyLocalProfile(user, cloudProfile, fallbackName);
  initPlayerProfile();
  save('cah_player', me);
  document.getElementById('greetName').textContent = me.name;
  updateAuthTopbar(user);
  showScreen('menu');
  setAuthMessage(successText || 'Signed in successfully.');
}

async function handleSignOut() {
  if (!window.firebaseAuth?.currentUser) {
    updateAuthTopbar(null);
    showScreen('landing');
    return;
  }

  setAuthMessage('Signing out...');
  try {
    await window.firebaseAuth.signOut();
    me = null;
    localStorage.removeItem('cah_player');
    document.getElementById('greetName').textContent = '';
    updateAuthTopbar(null);
    showScreen('landing');
    setAuthMessage('Signed out.');
  } catch (err) {
    setAuthMessage(err?.message || 'Sign-out failed.', true);
  }
}

async function handleSignUp() {
  if (!window.firebaseAuth) return alert('Firebase auth is not available right now.');
  if (authBusy) return;

  const name = document.getElementById('playerName').value.trim();
  const email = document.getElementById('playerEmail').value.trim();
  const password = document.getElementById('playerPassword').value;
  if (!name || !isValidEmail(email) || password.length < 6) {
    return setAuthMessage('Enter a username, valid email, and a password with 6+ characters.', true);
  }

  setAuthLoading(true);
  setAuthMessage('Creating your account...');
  try {
    const cred = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
    await cred.user.sendEmailVerification().catch(() => {});
    await syncProfileToCloud(makeDefaultProfile(name, cred.user.uid, email));
    await handleAuthSuccess(cred.user, name, 'Account created. Verification email sent.');
  } catch (err) {
    setAuthMessage(mapAuthError(err), true);
  } finally {
    setAuthLoading(false);
  }
}

async function handleSignIn() {
  if (!window.firebaseAuth) return alert('Firebase auth is not available right now.');
  if (authBusy) return;

  const email = document.getElementById('playerEmail').value.trim();
  const password = document.getElementById('playerPassword').value;
  const fallbackName = document.getElementById('playerName').value.trim() || 'Player';
  if (!isValidEmail(email) || !password) return setAuthMessage('Enter a valid email and password to sign in.', true);

  setAuthLoading(true);
  setAuthMessage('Signing in...');
  try {
    const cred = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
    const verifiedNote = cred.user.emailVerified ? '' : ' Email not verified yet.';
    await handleAuthSuccess(cred.user, fallbackName, `Signed in successfully.${verifiedNote}`);
  } catch (err) {
    setAuthMessage(mapAuthError(err), true);
  } finally {
    setAuthLoading(false);
  }
}

async function handleResetPassword() {
  if (!window.firebaseAuth) return alert('Firebase auth is not available right now.');
  if (authBusy) return;

  const email = document.getElementById('playerEmail').value.trim();
  if (!isValidEmail(email)) return setAuthMessage('Enter a valid email first, then click Reset Password.', true);

  setAuthLoading(true);
  setAuthMessage('Sending password reset email...');
  try {
    await window.firebaseAuth.sendPasswordResetEmail(email);
    setAuthMessage('Password reset email sent. Check your inbox.');
  } catch (err) {
    setAuthMessage(mapAuthError(err), true);
  } finally {
    setAuthLoading(false);
  }
}

document.getElementById('btnSignUp').addEventListener('click', handleSignUp);
document.getElementById('btnSignIn').addEventListener('click', handleSignIn);
document.getElementById('btnResetPassword').addEventListener('click', handleResetPassword);
document.getElementById('btnSignOut').addEventListener('click', handleSignOut);
document.getElementById('playerPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') handleSignIn();
});

updateAuthTopbar(window.firebaseAuth?.currentUser || null);

if (window.firebaseAuth) {
  window.firebaseAuth.onAuthStateChanged(async user => {
    if (!user) {
      updateAuthTopbar(null);
      return;
    }
    try {
      const fallbackName = document.getElementById('playerName').value.trim() || load('cah_player', null)?.name || 'Player';
      await handleAuthSuccess(user, fallbackName, 'Session restored.');
    } catch {
      setAuthMessage('Signed in, but failed to load cloud profile.', true);
    }
  });
}

/* ─── Menu ─── */
document.getElementById('btnCreateRoom').addEventListener('click', () => {
  if (!requireDeckAccess('Claim or select a deck before creating rooms.')) return;
  showScreen('create');
});
document.getElementById('btnJoinRoom').addEventListener('click', () => {
  if (!requireDeckAccess('Claim or select a deck before joining rooms.')) return;
  showScreen('join');
  renderRoomList();
  if (useFirestoreRoomSync()) subscribeOpenRooms();
});
document.getElementById('btnFriends').addEventListener('click', () => { showScreen('friends'); renderFriends(); });
document.getElementById('btnStats').addEventListener('click', () => { showScreen('stats'); renderStats(); });
document.getElementById('btnProfile').addEventListener('click', () => { showScreen('stats'); renderStats(); });
document.getElementById('btnDecks').addEventListener('click', () => openDeckStore());

/* ─── Create Room ─── */
let pendingCreateRoomData = null;

document.getElementById('btnStartRoom').addEventListener('click', async () => {
  if (!requireDeckAccess('You must claim/select a deck before creating rooms.')) return;

  const roomName = document.getElementById('roomName').value.trim() || me.name + "'s Room";
  const gameMode = document.querySelector('input[name="gameMode"]:checked').value;
  const allowNsfw = document.getElementById('allowNsfwToggle')?.checked ?? false;
  const maxPlayers = parseInt(document.getElementById('maxPlayers').value, 10) || 8;
  const aiPlayers = parseInt(document.getElementById('aiPlayers').value, 10) || 0;
  const roundsToWin = parseInt(document.getElementById('roundsToWin').value, 10) || 7;
  const code = genCode();
  const clampedBots = Math.max(0, Math.min(BOT_PERSONAS.length, aiPlayers, maxPlayers - 1));

  const botPlayers = generateBotPlayers(clampedBots, [me.name]);
  const botNames = botPlayers.map(b => b.name);
  
  const suggestedName = suggestAvailableName(me.name, botNames);
  const isNameConflict = suggestedName !== me.name;

  if (isNameConflict) {
    pendingCreateRoomData = { roomName, gameMode, allowNsfw, maxPlayers, roundsToWin, code, botPlayers, botNames };
    showNameConfirmModal('Create Room', `Your name "${me.name}" conflicts with an AI player. Suggest: "${suggestedName}"`, suggestedName);
  } else {
    await finishCreateRoom(roomName, gameMode, allowNsfw, maxPlayers, roundsToWin, code, me.name, botPlayers);
  }
});

async function finishCreateRoom(roomName, gameMode, allowNsfw, maxPlayers, roundsToWin, code, displayName, botPlayers) {
  const humanPlayer = { id: me.id, name: me.name, displayName, score: 0, isBot: false };
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
  if (useFirestoreRoomSync()) {
    await createRoomBackend(room);
  } else {
    rooms[code] = room;
    save('cah_rooms', rooms);
  }

  currentRoom = room;
  openLobby(room);
  pendingCreateRoomData = null;
}

/* ─── Join Room ─── */
let pendingJoinRoomCode = null;

document.getElementById('btnJoin').addEventListener('click', async () => {
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  await requestJoinRoom(code);
});
document.getElementById('joinCode').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnJoin').click();
});

async function requestJoinRoom(code) {
  if (!requireDeckAccess('Claim/select a deck before joining rooms.')) return;

  let room = null;
  if (useFirestoreRoomSync()) {
    room = await fetchRoomBackend(code);
  } else {
    rooms = load('cah_rooms', {});
    room = rooms[code];
  }
  if (!room) return alert('Room not found. Check the code and try again.');
  if (room.status !== 'lobby') return alert('That game has already started.');
  if (room.players.length >= room.maxPlayers) return alert('Room is full!');

  const myDeckId = me?.deckProgress?.activeDeckId;
  if (!canUseDeckInRoom(myDeckId, room.allowNsfw !== false)) {
    return alert('This room has NSFW decks disabled. Please equip a non-NSFW deck first.');
  }

  if (room.players.find(p => p.id === me.id)) {
    currentRoom = room;
    openLobby(room);
    return;
  }

  const usedNames = room.players.map(p => p.name || p.displayName).filter(Boolean);
  const suggestedName = suggestAvailableName(me.name, usedNames);
  const isNameConflict = suggestedName !== me.name;

  if (isNameConflict) {
    pendingJoinRoomCode = code;
    showNameConfirmModal('Join Room', `Your name "${me.name}" is taken. Suggest: "${suggestedName}"`, suggestedName);
  } else {
    await finishJoinRoom(code, me.name);
  }
}

async function finishJoinRoom(code, displayName) {
  if (useFirestoreRoomSync()) {
    try {
      const room = await joinRoomBackend(code, { id: me.id, name: me.name, displayName, score: 0, isBot: false });
      currentRoom = room;
      openLobby(room);
      pendingJoinRoomCode = null;
      return;
    } catch (err) {
      if (String(err.message) === 'ROOM_NOT_FOUND') return alert('Room not found.');
      if (String(err.message) === 'ROOM_NOT_LOBBY') return alert('That game has already started.');
      if (String(err.message) === 'ROOM_FULL') return alert('Room is full!');
      return alert('Could not join room right now. Please try again.');
    }
  }

  const room = rooms[code];
  if (!room) return alert('Room not found.');
  room.players.push({ id: me.id, name: me.name, displayName, score: 0, isBot: false });
  rooms[code] = room;
  save('cah_rooms', rooms);
  currentRoom = room;
  openLobby(room);
  pendingJoinRoomCode = null;
}

async function joinRoom(code) {
  await requestJoinRoom(code);
}

function showNameConfirmModal(title, message, suggestion) {
  document.getElementById('nameConfirmTitle').textContent = title;
  document.getElementById('nameConfirmMessage').textContent = message;
  const input = document.getElementById('nameConfirmInput');
  input.value = suggestion;
  
  const suggestionsDiv = document.getElementById('nameSuggestions');
  suggestionsDiv.innerHTML = '';
  
  document.getElementById('nameConfirmModal').classList.remove('hidden');
  input.focus();
  input.select();
}

function closeNameConfirmModal() {
  document.getElementById('nameConfirmModal').classList.add('hidden');
  document.getElementById('nameConfirmInput').value = '';
  pendingCreateRoomData = null;
  pendingJoinRoomCode = null;
}

document.getElementById('btnConfirmName').addEventListener('click', async () => {
  const displayName = document.getElementById('nameConfirmInput').value.trim();
  if (!displayName) return alert('Please enter a name.');

  if (pendingCreateRoomData) {
    const { roomName, gameMode, allowNsfw, maxPlayers, roundsToWin, code, botPlayers } = pendingCreateRoomData;
    await finishCreateRoom(roomName, gameMode, allowNsfw, maxPlayers, roundsToWin, code, displayName, botPlayers);
  } else if (pendingJoinRoomCode) {
    await finishJoinRoom(pendingJoinRoomCode, displayName);
  }
  closeNameConfirmModal();
});

function renderRoomList() {
  if (useFirestoreRoomSync()) {
    subscribeOpenRooms();
    return;
  }

  rooms = load('cah_rooms', {});
  const open = Object.values(rooms).filter(r => r.status === 'lobby');
  renderOpenRoomList(open);
}

window.joinRoom = joinRoom;

/* ─── Lobby ─── */
function renderLobbyMeta(room) {
  document.getElementById('lobbyTitle').textContent = room.name;
  document.getElementById('lobbyCode').textContent = room.code;
  const nsfwLabel = room.allowNsfw === false ? ' · NSFW Off' : ' · NSFW On';
  document.getElementById('lobbyMode').textContent = '🎮 Mode: ' + room.mode.charAt(0).toUpperCase() + room.mode.slice(1) + nsfwLabel;
}

function openLobby(room) {
  currentRoom = room;
  renderLobbyMeta(room);
  showScreen('lobby');
  refreshLobbyPlayers(room);
  if (useFirestoreRoomSync()) {
    subscribeActiveRoom(room.code);
    subscribeChatRoom(room.code);
  }
}

function refreshLobbyPlayers(room) {
  document.getElementById('lobbyPlayerCount').textContent = room.players.length;
  document.getElementById('lobbyPlayers').innerHTML = room.players.map(p =>
    `<div class="player-chip ${p.id === room.host ? 'host' : ''}">
      ${p.isBot ? `<img class="bot-avatar" src="${escHtml(p.avatar || '')}" alt="${escHtml(p.name)} avatar" />` : ''}
      <span>${escHtml(p.name)}${p.id === room.host ? ' 👑' : ''}</span>
    </div>`).join('');
}

document.getElementById('btnStartGame').addEventListener('click', async () => {
  if (!requireDeckAccess('Select an active deck before starting the game.')) return;
  if (!currentRoom) return;

  const myDeckId = me?.deckProgress?.activeDeckId;
  if (!canUseDeckInRoom(myDeckId, currentRoom.allowNsfw !== false)) {
    alert('NSFW is disabled for this room. Equip a non-NSFW deck before starting.');
    openDeckStore('Choose a non-NSFW deck to continue.');
    return;
  }

  currentRoom.status = 'playing';
  isGameHost = true;
  if (useFirestoreRoomSync()) {
    await setRoomBackend(currentRoom);
  } else {
    rooms[currentRoom.code] = currentRoom;
    save('cah_rooms', rooms);
  }
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
    submissionTexts: {},
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
  const fallbackDeck = getDeckById(FREE_STARTER_DECK_ID) || getAllDecks()[0];
  const deck = getDeckById(deckId) || fallbackDeck;
  if (!deck) return [];

  const base = Array.isArray(deck.whiteCards)
    ? deck.whiteCards.map((text, idx) => ({ baseId: idx, text: String(text || '').trim() }))
    : (deck.whiteCardIndexes || []).map(idx => ({ baseId: idx, text: CAH_WHITE_CARDS[idx] || '' }));

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
  const randomDeck = getDeckById('general-classic') ? 'general-classic' : (getAllDecks()[0]?.id || fallbackSafe);
  return canUseDeckInRoom(randomDeck, allowNsfw) ? randomDeck : fallbackSafe;
}

function startRound() {
  gameState.submissions = {};
  gameState.submissionTexts = {};
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
  if (isGameHost) pushRoundToBackend(currentRoom?.code).catch(() => {});
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
  if (gameState.submissions[me.id]) return; // dedup
  gameState.submissions[me.id] = cardIds;
  const myTexts = cardIds.map(id => gameState.cardTextById[id] || '');
  gameState.submissionTexts = gameState.submissionTexts || {};
  gameState.submissionTexts[me.id] = myTexts;
  gameState.hands[me.id] = (gameState.hands[me.id] || []).filter(c => !cardIds.includes(c.id));
  if (useFirestoreGameSync()) pushSubmissionToBackend(currentRoom.code, me.id, myTexts).catch(() => {});
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
  const czar = getCzar();
  const allSubmitterIds = new Set([
    ...Object.keys(gameState.submissions || {}),
    ...Object.keys(gameState.submissionTexts || {})
  ]);
  const submitters = [...allSubmitterIds].filter(id => id !== czar.id);

  if (!submitters.length) {
    cont.innerHTML = '<p style="color:#555;">Waiting for players to submit…</p>';
    return;
  }

  cont.innerHTML = shuffle(submitters).map(pid => {
    const texts = getSubmissionTexts(pid).filter(Boolean);
    return `<div class="white-card" onclick="czarPick('${pid}')">${escHtml(texts.join(' / '))}</div>`;
  }).join('');
}

window.czarPick = function(winnerId) {
  resolveRound(winnerId);
};

function resolveRound(winnerId, fromServer = false) {
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

  if (!fromServer) {
    pushResultToBackend(currentRoom?.code, winnerId, gameState.scores).catch(() => {});
  }

  const bc = gameState.currentBlack;
  const texts = getSubmissionTexts(winnerId).filter(Boolean);
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

  const targetRounds = Number(gameState.room.roundsToWin) || 7;
  if ((gameState.scores[winnerId] || 0) >= targetRounds) {
    document.getElementById('btnNextRound').style.display = 'none';
    setTimeout(() => showGameOver(winner, praise), 2000);
  } else {
    document.getElementById('btnNextRound').style.display = '';
  }
}

document.getElementById('btnNextRound').addEventListener('click', () => {
  // In Firestore multiplayer, only the game host advances rounds.
  // Non-hosts wait for the server-pushed round state.
  if (useFirestoreGameSync() && !isGameHost) return;
  nextRound();
});

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
function suggestAvailableName(desiredName, usedNames = []) {
  const used = new Set((usedNames || []).map(n => n.toLowerCase()));
  const normalized = (desiredName || '').trim();
  if (!normalized) return null;
  const base = normalized;
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base} ${suffix}`;
    suffix++;
  }
  return candidate;
}

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
  const allIds = new Set([
    ...Object.keys(gameState.submissions || {}),
    ...Object.keys(gameState.submissionTexts || {})
  ]);
  return [...allIds].filter(id => id !== czar.id);
}

function pickWinningSubmission(submitters) {
  const czar = getCzar();
  const mode = czar?.mode || 'random';

  if (mode === 'spicy') {
    const scored = submitters.map(id => {
      const score = getSubmissionTexts(id).reduce((sum, text) => sum + scoreCardText(text), 0);
      return { id, weight: Math.max(1, score + 1) };
    });
    return weightedRandomId(scored);
  }

  if (mode === 'chaos') {
    const scored = submitters.map(id => {
      const score = getSubmissionTexts(id).reduce((sum, text) => sum + scoreCardText(text), 0);
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
    const botTexts = chosen.map(id => gameState.cardTextById[id] || '');
    gameState.submissionTexts = gameState.submissionTexts || {};
    gameState.submissionTexts[player.id] = botTexts;
    gameState.hands[player.id] = (gameState.hands[player.id] || []).filter(card => !chosen.includes(card.id));
    if (useFirestoreGameSync() && isGameHost) {
      pushSubmissionToBackend(currentRoom.code, player.id, botTexts).catch(() => {});
    }
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

function recordGameHistory(winner, praise) {
  if (!me || !gameState || !winner) return;

  const sorted = [...gameState.room.players]
    .sort((a, b) => (gameState.scores[b.id] || 0) - (gameState.scores[a.id] || 0)
    )
    .map(p => ({ name: p.name, score: gameState.scores[p.id] || 0, isBot: Boolean(p.isBot) }));

  const entry = {
    id: genId(),
    at: Date.now(),
    roomCode: currentRoom?.code || null,
    mode: gameState.room.mode || 'classic',
    roundsToWin: gameState.room.roundsToWin || 7,
    winnerName: winner.name,
    winnerId: winner.id,
    myScore: gameState.scores[me.id] || 0,
    myWon: winner.id === me.id,
    players: sorted,
    praise: praise || ''
  };

  me.gameHistory = [...(me.gameHistory || []), entry].slice(-GAME_HISTORY_LIMIT);
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
    recordGameHistory(winner, praise);
    save('cah_player', me);
  }

  showScreen('gameover');
}

function leaveGameToMenu() {
  stopChatSubscription();
  stopRoomSubscriptions();
  gameState = null;
  isGameHost = false;
  currentRoom = null;
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
  const history = Array.isArray(me?.gameHistory) ? [...me.gameHistory].reverse() : [];
  const ownedDecks = getAllDecks()
    .filter(deck => ownsDeck(deck.id))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  const historyHtml = history.length
    ? history.map(entry => {
      const when = new Date(entry.at).toLocaleString();
      const room = entry.roomCode ? `Room ${escHtml(entry.roomCode)}` : 'Local room';
      const winner = escHtml(entry.winnerName || 'Unknown');
      const mode = escHtml(String(entry.mode || 'classic'));
      const topScore = Number(entry.players?.[0]?.score || 0);
      return `<div class="score-row" style="flex-direction:column;align-items:flex-start;gap:4px;">
        <div style="font-weight:800;">${entry.myWon ? '✅' : '•'} ${winner} won (${topScore} ✦)</div>
        <div style="color:var(--grey);font-size:.82rem;">${escHtml(room)} · ${escHtml(mode)} · ${when}</div>
      </div>`;
    }).join('')
    : '<p style="color:#777;text-align:center;margin-top:8px;">No completed games yet.</p>';

  const purchasedDecksHtml = ownedDecks.length
    ? ownedDecks.map(deck => {
      const category = getDeckCategoryMeta(deck.categoryId);
      const cards = getDeckCardTexts(deck);
      const isActive = me?.deckProgress?.activeDeckId === deck.id;

      return `<details class="owned-deck-item">
        <summary>
          <span class="owned-deck-name">${escHtml(deck.name)}</span>
          <span class="owned-deck-meta">${cards.length} cards${category ? ` · ${escHtml(category.name)}` : ''}${isActive ? ' · Equipped' : ''}</span>
        </summary>
        <div class="owned-deck-cards-wrap">
          ${cards.length
            ? `<ol class="owned-deck-cards">${cards.map(card => `<li>${escHtml(card)}</li>`).join('')}</ol>`
            : '<p class="deck-empty">No white cards found for this deck.</p>'}
        </div>
      </details>`;
    }).join('')
    : '<p style="color:#777;text-align:center;margin-top:8px;">No owned decks yet. Visit Deck Store to claim or buy one.</p>';

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
    </div>
    <div style="margin-top:18px;">
      <h3 style="margin:0 0 10px;">Owned Decks</h3>
      <div class="scoreboard">${purchasedDecksHtml}</div>
    </div>
    <div style="margin-top:18px;">
      <h3 style="margin:0 0 10px;">Recent Games</h3>
      <div class="scoreboard">${historyHtml}</div>
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

// ── Init ──
initChatHandlers();
