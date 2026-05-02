/* ===== Cards Against Humanity — app.js ===== */

/* ─── Storage helpers ─── */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* ─── State ─── */
let me = load('cah_player', null); // { name, id, stats }
let rooms = load('cah_rooms', {});
let friends = load('cah_friends', []);

let currentRoom = null;
let gameState   = null;

/* ─── Screen management ─── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

document.querySelectorAll('.btn-ghost.back').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.target || 'menu'));
});

/* ─── Landing / Login ─── */
document.getElementById('btnEnter').addEventListener('click', () => {
  const name = document.getElementById('playerName').value.trim();
  if (!name) return alert('Please enter your name!');
  me = load('cah_player', null);
  if (!me || me.name !== name) {
    me = { name, id: genId(), stats: { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 } };
  }
  save('cah_player', me);
  document.getElementById('greetName').textContent = me.name;
  showScreen('menu');
});

/* ─── Menu ─── */
document.getElementById('btnCreateRoom').addEventListener('click', () => showScreen('create'));
document.getElementById('btnJoinRoom').addEventListener('click', () => { showScreen('join'); renderRoomList(); });
document.getElementById('btnFriends').addEventListener('click', () => { showScreen('friends'); renderFriends(); });
document.getElementById('btnStats').addEventListener('click', () => { showScreen('stats'); renderStats(); });
document.getElementById('btnProfile').addEventListener('click', () => { showScreen('stats'); renderStats(); });

/* ─── Create Room ─── */
document.getElementById('btnStartRoom').addEventListener('click', () => {
  const roomName   = document.getElementById('roomName').value.trim() || me.name + "'s Room";
  const gameMode   = document.querySelector('input[name="gameMode"]:checked').value;
  const maxPlayers = parseInt(document.getElementById('maxPlayers').value) || 8;
  const roundsToWin= parseInt(document.getElementById('roundsToWin').value) || 7;
  const code       = genCode();

  const room = {
    code, name: roomName, mode: gameMode,
    maxPlayers, roundsToWin,
    host: me.id,
    players: [{ id: me.id, name: me.name, score: 0 }],
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
document.getElementById('joinCode').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btnJoin').click(); });

function joinRoom(code) {
  rooms = load('cah_rooms', {});
  const room = rooms[code];
  if (!room) return alert('Room not found. Check the code and try again.');
  if (room.status !== 'lobby') return alert('That game has already started.');
  if (room.players.length >= room.maxPlayers) return alert('Room is full!');
  if (!room.players.find(p => p.id === me.id)) {
    room.players.push({ id: me.id, name: me.name, score: 0 });
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
  if (!open.length) { list.innerHTML = '<p style="color:#555;text-align:center;margin-top:20px;">No open rooms found.</p>'; return; }
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
  document.getElementById('lobbyCode').textContent  = room.code;
  document.getElementById('lobbyMode').textContent  = '🎮 Mode: ' + room.mode.charAt(0).toUpperCase() + room.mode.slice(1);
  showScreen('lobby');
  refreshLobbyPlayers(room);
}

function refreshLobbyPlayers(room) {
  document.getElementById('lobbyPlayerCount').textContent = room.players.length;
  document.getElementById('lobbyPlayers').innerHTML = room.players.map(p =>
    `<div class="player-chip ${p.id === room.host ? 'host' : ''}">
      ${escHtml(p.name)}${p.id === room.host ? ' 👑' : ''}
    </div>`).join('');
}

document.getElementById('btnStartGame').addEventListener('click', () => {
  if (!currentRoom) return;
  currentRoom.status = 'playing';
  rooms[currentRoom.code] = currentRoom;
  save('cah_rooms', rooms);
  startGame(currentRoom);
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
  const playerIds = room.players.map(p => p.id);

  gameState = {
    room,
    blackDeck:  shuffle(CAH_BLACK_CARDS.map((c,i) => ({...c, id:i}))),
    whiteDeck:  shuffle(CAH_WHITE_CARDS.map((c,i) => ({text:c, id:i}))),
    hands:      {},        // playerId -> [card, …]
    czarIndex:  0,
    round:      1,
    scores:     {},        // playerId -> int
    submissions:{},        // playerId -> [cardIds]
    phase:      'playing', // playing | judging | result
    currentBlack: null,
    mode: room.mode
  };

  // Initialise scores
  room.players.forEach(p => { gameState.scores[p.id] = 0; });

  // Deal 10 cards to each player
  room.players.forEach(p => {
    gameState.hands[p.id] = gameState.whiteDeck.splice(0, 10);
  });

  startRound();
}

function startRound() {
  gameState.submissions = {};
  gameState.phase = 'playing';
  gameState.currentBlack = gameState.blackDeck.shift();
  if (!gameState.currentBlack) {
    // Reshuffle
    gameState.blackDeck = shuffle(CAH_BLACK_CARDS.map((c,i)=>({...c, id:i})));
    gameState.currentBlack = gameState.blackDeck.shift();
  }
  // Refill white deck if low
  if (gameState.whiteDeck.length < 20) {
    gameState.whiteDeck = shuffle(CAH_WHITE_CARDS.map((c,i)=>({text:c,id:i})));
  }

  // In "question first" mode, flip ordering perspective
  if (gameState.mode === 'question') {
    // Show the black card as a question only (same mechanic, different labelling)
    gameState.currentBlack = { ...gameState.currentBlack, questionFirst: true };
  }

  renderGameScreen();
}

function getCzar() {
  return gameState.room.players[gameState.czarIndex % gameState.room.players.length];
}

function renderGameScreen() {
  const bc    = gameState.currentBlack;
  const czar  = getCzar();
  const isCzar= czar.id === me.id;

  document.getElementById('gameRoundInfo').textContent = 'Round ' + gameState.round;
  document.getElementById('gameScoreInfo').textContent = 'Score: ' + (gameState.scores[me.id] || 0);

  document.getElementById('blackCardText').textContent = bc.text;
  document.getElementById('pickBadge').textContent     = 'PICK ' + bc.pick;

  document.getElementById('czarBanner').style.display  = isCzar ? 'block' : 'none';
  document.getElementById('handSection').style.display  = isCzar ? 'none'  : 'block';
  document.getElementById('czarSection').style.display  = isCzar ? 'block' : 'none';
  document.getElementById('btnPlayCards').style.display = isCzar ? 'none'  : 'block';

  if (!isCzar) renderHand();
  if (isCzar)  renderSubmissions();

  showScreen('game');
}

function renderHand() {
  const hand = gameState.hands[me.id] || [];
  const bc   = gameState.currentBlack;
  let selected = [];

  document.getElementById('handCards').innerHTML = hand.map(card =>
    `<div class="white-card" data-id="${card.id}" onclick="toggleCard(${card.id})">${escHtml(card.text)}</div>`
  ).join('');

  document.getElementById('btnPlayCards').onclick = () => {
    selected = [...document.querySelectorAll('.white-card.selected')].map(el => parseInt(el.dataset.id));
    if (selected.length !== bc.pick) return alert(`Pick exactly ${bc.pick} card(s)!`);
    submitCards(selected);
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
    if (selected.length >= bc.pick) {
      selected[0].classList.remove('selected');
    }
    el.classList.add('selected');
  }
};

function submitCards(cardIds) {
  gameState.submissions[me.id] = cardIds;
  // Remove from hand
  gameState.hands[me.id] = gameState.hands[me.id].filter(c => !cardIds.includes(c.id));

  // Simulate other players submitting (AI opponents)
  const czar = getCzar();
  gameState.room.players.forEach(p => {
    if (p.id === czar.id || p.id === me.id) return;
    if (!gameState.submissions[p.id]) {
      const hand = gameState.hands[p.id] || [];
      const pick = gameState.currentBlack.pick;
      const chosen = shuffle(hand).slice(0, pick).map(c => c.id);
      gameState.submissions[p.id] = chosen;
    }
  });

  // If czar is AI (not me), czar also picks
  if (czar.id !== me.id) {
    showCzarJudging();
  } else {
    renderSubmissions();
    document.getElementById('czarSection').style.display = 'block';
    document.getElementById('handSection').style.display = 'none';
  }
}

function showCzarJudging() {
  // If I'm not the czar, auto-pick a winner after a short delay
  setTimeout(() => {
    const submitters = Object.keys(gameState.submissions);
    if (!submitters.length) { nextRound(); return; }
    const winnerId = submitters[Math.floor(Math.random() * submitters.length)];
    resolveRound(winnerId);
  }, 1200);
}

function renderSubmissions() {
  const cont = document.getElementById('submittedCards');
  const allCards = [].concat(...Object.values(gameState.hands),
                              ...CAH_WHITE_CARDS.map((t,i)=>({text:t,id:i})));
  const cardMap = Object.fromEntries(allCards.map(c=>[c.id, c.text]));

  const submitters = Object.keys(gameState.submissions).filter(id => id !== getCzar().id);
  if (!submitters.length) {
    cont.innerHTML = '<p style="color:#555;">Waiting for players to submit…</p>';
    return;
  }
  cont.innerHTML = shuffle(submitters).map(pid => {
    const cardIds = gameState.submissions[pid];
    const texts   = cardIds.map(id => CAH_WHITE_CARDS[id] || '').filter(Boolean);
    return `<div class="white-card" onclick="czarPick('${pid}')">${escHtml(texts.join(' / '))}</div>`;
  }).join('');
}

window.czarPick = function(winnerId) {
  resolveRound(winnerId);
};

function resolveRound(winnerId) {
  const winner = gameState.room.players.find(p => p.id === winnerId);
  if (!winner) { nextRound(); return; }

  gameState.scores[winnerId] = (gameState.scores[winnerId] || 0) + 1;

  // Update room player scores
  gameState.room.players.forEach(p => { p.score = gameState.scores[p.id] || 0; });

  const bc       = gameState.currentBlack;
  const cardIds  = gameState.submissions[winnerId] || [];
  const texts    = cardIds.map(id => CAH_WHITE_CARDS[id] || '').filter(Boolean);
  const praise   = WINNER_PRAISES[Math.floor(Math.random() * WINNER_PRAISES.length)];

  document.getElementById('resultBlack').textContent  = bc.text;
  document.getElementById('resultWhite').textContent  = texts.join(' / ');
  document.getElementById('roundWinnerBox').innerHTML = `🏅 <strong>${escHtml(winner.name)}</strong> wins the round!`;
  document.getElementById('gameOverPraise').textContent = praise;

  // Scoreboard
  const sorted = [...gameState.room.players].sort((a,b) => (gameState.scores[b.id]||0)-(gameState.scores[a.id]||0));
  document.getElementById('scoreBoard').innerHTML = sorted.map(p =>
    `<div class="score-row"><span class="score-name">${escHtml(p.name)}</span><span class="score-pts">${gameState.scores[p.id]||0} ✦</span></div>`
  ).join('');

  showScreen('result');

  // Check for game over
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
  // Replenish hands
  gameState.room.players.forEach(p => {
    const hand = gameState.hands[p.id] || [];
    while (hand.length < 10 && gameState.whiteDeck.length > 0) {
      hand.push(gameState.whiteDeck.shift());
    }
    gameState.hands[p.id] = hand;
  });
  startRound();
}

function showGameOver(winner, praise) {
  document.getElementById('gameOverWinner').textContent = '🎉 ' + winner.name + ' wins the game!';
  document.getElementById('gameOverPraise').textContent = praise;

  const sorted = [...gameState.room.players].sort((a,b)=>(gameState.scores[b.id]||0)-(gameState.scores[a.id]||0));
  document.getElementById('gameOverScores').innerHTML = sorted.map((p,i) =>
    `<div class="score-row"><span class="score-name">${i===0?'🥇':i===1?'🥈':'🥉'} ${escHtml(p.name)}</span><span class="score-pts">${gameState.scores[p.id]||0} ✦</span></div>`
  ).join('');

  // Update my stats
  if (me) {
    me.stats = me.stats || { gamesPlayed: 0, gamesWon: 0, roundsWon: 0 };
    me.stats.gamesPlayed++;
    if (winner.id === me.id) me.stats.gamesWon++;
    me.stats.roundsWon = (me.stats.roundsWon || 0) + (gameState.scores[me.id] || 0);
    save('cah_player', me);
  }

  showScreen('gameover');
}

document.getElementById('btnPlayAgain').addEventListener('click', () => {
  if (currentRoom) startGame(currentRoom);
});
document.getElementById('btnBackMenu').addEventListener('click', () => showScreen('menu'));
document.getElementById('btnLeaveGame').addEventListener('click', () => showScreen('menu'));

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
  if (!friends.length) { list.innerHTML = '<p style="color:#555;text-align:center;margin-top:20px;">No friends yet. Add some!</p>'; return; }
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
    </div>`;
}

/* ─── Utilities ─── */
function genId() { return Math.random().toString(36).slice(2,10); }
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
