# 🃏 Cards Against Humanity — Test Plan

**Version:** 1.1  
**Last updated:** 2026-05-06  
**Status:** In active development

---

## 1. App Overview

A browser-based, PWA-ready implementation of Cards Against Humanity.  
Players create or join rooms, select game modes, play cards, and the Card Czar
judges each round. Supports friend lists, user stats, and tongue-in-cheek
round-winner praise.

Deck content is sourced from the open-source
[json-against-humanity](https://github.com/crhallberg/json-against-humanity)
project (CC BY-NC-SA 4.0).

---

## 2. Current Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Firebase email auth | ✅ Done | Email/password enabled |
| Cloud user profile sync | ✅ Done | Firestore users/{uid} |
| Create room with code | ✅ Done | 6-char alphanumeric code |
| Join room by code | ✅ Done | |
| Open room browser list | ✅ Done | Shows all open rooms |
| Game mode: Classic | ✅ Done | Standard rules |
| Game mode: Wild 🔥 | ✅ Done | Mode label; same mechanics |
| Game mode: Question First ❓ | ✅ Done | Black card labelled as question |
| Configurable AI players (0-3) | ✅ Done | Added in Create Room |
| Named AI personas | ✅ Done | Skeeter (Spicy), Sally (Chaos), Linus (Random) |
| Themed deck catalog | ✅ Done | General + special tiers |
| Deck ownership and selection | ✅ Done | Claim, buy, equip flow |
| Coins and tokens wallet | ✅ Done | Persisted in player profile |
| Reroll system | ✅ Done | White card reroll with limits |
| Card Czar rotation | ✅ Done | Rotates each round |
| Deal white cards (hand of 10) | ✅ Done | |
| Play white cards | ✅ Done | Supports Pick 1 and Pick 2 |
| Czar judges submissions | ✅ Done | Clicks to pick winner |
| AI opponent auto-play | ✅ Done | Simulated for solo testing |
| Round result screen | ✅ Done | Shows winning combo + praise |
| Tongue-in-cheek round praise | ✅ Done | 12 unique messages |
| Scoreboard (per round) | ✅ Done | Sorted by score |
| Game over screen | ✅ Done | Winner declared with scores |
| Rounds-to-win setting | ✅ Done | Configurable in room setup |
| Friend add / remove | ✅ Done | localStorage |
| User stats | ✅ Done | Games played, won, rounds won, win rate |
| PWA manifest | ✅ Done | |
| Service worker (offline) | ✅ Done | Caches app shell |
| Real-time multiplayer | ❌ Not started | Needs WebSocket / WebRTC backend |
| In-game chat | ❌ Not started | |
| Custom card packs | ❌ Not started | |
| Spectator mode | ❌ Not started | |
| Kick / ban player | ❌ Not started | |
| Game history | ❌ Not started | |

---

## 3. Test Cases

### 3.1 Authentication / Landing

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| LG-01 | Create account with username/email/password | User account created and main menu shown | ⬜ |
| LG-02 | Sign in with existing email/password | Existing profile loads and main menu shown | ⬜ |
| LG-03 | Sign-up with weak password (<6) | Inline auth error is shown | ⬜ |
| LG-04 | Missing email or password on sign in | Inline auth error is shown | ⬜ |
| LG-05 | Session restore on refresh | User remains signed in and lands in menu | ⬜ |
| LG-06 | Username max length | Username input caps at 24 characters | ⬜ |
| LG-07 | Firestore profile write on first signup | users/{uid} doc created with username/stats/economy/deckProgress | ⬜ |
| LG-08 | Firestore profile sync after stats/economy changes | Cloud profile reflects latest local changes | ⬜ |

### 3.2 Room Management

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| RM-01 | Create room | 6-char code displayed in lobby | ⬜ |
| RM-02 | Join valid room code | Lobby shown with existing players | ⬜ |
| RM-03 | Join invalid code | Alert: "Room not found" | ⬜ |
| RM-04 | Join already-started room | Alert: "That game has already started" | ⬜ |
| RM-05 | Join full room | Alert: "Room is full!" | ⬜ |
| RM-06 | Room list shows open rooms | All lobby-status rooms listed | ⬜ |
| RM-07 | Room code case-insensitive | Lowercase code works same as uppercase | ⬜ |
| RM-08 | Create room with AI players | Lobby shows host + selected bot count | ⬜ |
| RM-09 | AI cap respects max players | Bots are limited to maxPlayers - 1 | ⬜ |
| RM-10 | Persona order in lobby | Skeeter, Sally, then Linus when count increases | ⬜ |
| RM-11 | Deck gate on create/join | User without active deck is redirected to deck store | ⬜ |

### 3.3 Game Modes

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| GM-01 | Classic mode selected | Mode badge shows "Classic" in lobby | ⬜ |
| GM-02 | Wild mode selected | Mode badge shows "Wild 🔥" | ⬜ |
| GM-03 | Question First mode selected | Mode badge shows "Question First ❓" | ⬜ |

### 3.4 Gameplay

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| GP-01 | Start game | Black card displayed; hand dealt | ⬜ |
| GP-02 | Black card PICK 1 | Can select exactly 1 white card | ⬜ |
| GP-03 | Black card PICK 2 | Must select exactly 2 white cards | ⬜ |
| GP-04 | Submit wrong number | Alert: "Pick exactly N card(s)!" | ⬜ |
| GP-05 | Play cards removes from hand | Played cards no longer in hand | ⬜ |
| GP-06 | Hand replenished each round | Always 10 cards in hand at start | ⬜ |
| GP-07 | Card Czar banner shows | Czar sees "You are the Card Czar" | ⬜ |
| GP-08 | Czar picks winner | Result screen shown with winning combo | ⬜ |
| GP-09 | Score increments | Winner's score +1 after each round | ⬜ |
| GP-10 | AI opponents submit cards | AI plays when not Czar | ⬜ |
| GP-11 | Round praise shown | Random praise displayed on result screen | ⬜ |
| GP-12 | Next Round button | Advances to next round | ⬜ |
| GP-13 | Czar rotates | Different player is Czar each round | ⬜ |
| GP-14 | Multi-card (Pick 2) with bots | Bot submissions include exactly 2 cards | ⬜ |
| GP-15 | Bot Card Czar round | When bot is Czar, winner resolves automatically | ⬜ |
| GP-16 | Spicy persona preference | Skeeter tends to play high-intensity cards | ⬜ |
| GP-17 | Chaos persona behavior | Sally alternates between tame/extreme choices | ⬜ |
| GP-18 | Random persona behavior | Linus selection remains uniformly random | ⬜ |
| GP-19 | Reroll consumes coins | Each reroll deducts 3 coins | ⬜ |
| GP-20 | Reroll round limit | Max 2 rerolls per round enforced | ⬜ |
| GP-21 | Reroll game limit | Max 5 rerolls per game enforced | ⬜ |

### 3.5 Game Over

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| GO-01 | Reach rounds-to-win | Game over screen shown | ⬜ |
| GO-02 | Winner name displayed | Correct player shown as winner | ⬜ |
| GO-03 | Final scores shown | All players, sorted by score | ⬜ |
| GO-04 | Stats updated | gamesPlayed +1; gamesWon +1 for winner | ⬜ |
| GO-05 | Play Again | New game starts with same room | ⬜ |
| GO-06 | Back to Menu | Returns to main menu | ⬜ |
| GO-07 | Mixed human/bot game over | Winner logic works with bots included | ⬜ |
| GO-08 | End-game coin podium | 1st/2nd/3rd get 20/10/5 coins when eligible | ⬜ |
| GO-09 | End-game token podium | 1st/2nd/3rd get 5/3/1 tokens with 2+ humans and <=1 AI | ⬜ |
| GO-10 | High-AI token block | With 2+ AI, no end-game tokens are awarded | ⬜ |
| GO-11 | Single-human endgame | No end-game rewards if <2 humans at game end | ⬜ |
| GO-12 | Mid-game quit payout | Only previously earned round coins are retained | ⬜ |

### 3.8 AI Player Regression Coverage

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| AI-01 | Lobby player count with bots | Count matches host + bots + joined humans | ⬜ |
| AI-02 | Multi-card pick rounds | Pick 2 rounds complete with valid bot submissions | ⬜ |
| AI-03 | Czar rotation including bots | Bot and human players both become Czar | ⬜ |
| AI-04 | End-game winner in mixed room | Winner and scoreboard resolve correctly | ⬜ |
| AI-05 | Persona avatar render | Each bot displays its configured avatar in lobby | ⬜ |

### 3.9 Deck Economy & Store

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| DE-01 | Starter wallet grant | New player starts with 200 coins and 20 tokens | ⬜ |
| DE-02 | Free first deck claim | One-time free starter claim available and required | ⬜ |
| DE-03 | Featured special discount | First featured special costs 10 tokens once per account | ⬜ |
| DE-04 | General deck pricing | General tiers cost 30/40/50 tokens | ⬜ |
| DE-05 | Special deck pricing | Special tiers cost 20/40/60 tokens | ⬜ |
| DE-06 | Coin equivalent purchases | Deck purchase works with token equivalent (1 token = 10 coins) | ⬜ |
| DE-07 | Active deck persistence | Selected deck remains active after reload | ⬜ |
| DE-08 | Deck artwork render | Each deck card displays its themed image | ⬜ |
| DE-09 | Source pack label render | Deck cards display json-against-humanity source pack names | ⬜ |
| DE-10 | Cover fallback render | Decks without image path render generated line-art covers | ⬜ |
| DE-11 | Deck row layout | Deck rows render with name left, image center, price/actions right | ⬜ |
| DE-12 | Header wallet | Coins/tokens render in deck store header bar and update after purchase | ⬜ |
| DE-13 | Cart selection | Unowned decks can be selected/deselected before checkout | ⬜ |
| DE-14 | Checkout modal remove | Selected decks can be removed from checkout modal | ⬜ |
| DE-15 | Checkout final purchase | No purchase occurs until Confirm Purchase is clicked in modal | ⬜ |
| DE-16 | Category grouping headers | Decks are grouped under category headers with assignment label/count | ⬜ |
| DE-17 | Category collapse behavior | Category sections collapse/expand independently via header toggle | ⬜ |
| DE-18 | Default expansion state | Core and Expansions is expanded by default; all other categories start collapsed | ⬜ |
| DE-19 | Names-only list mode | Expanded category shows deck names list, not full detail cards | ⬜ |
| DE-20 | Selection-driven preview | Deck image/details render only after selecting a deck name | ⬜ |
| DE-21 | Preview action flow | Claim/equip/add-remove-cart actions work from selected preview panel | ⬜ |
| DE-22 | Category coverage | Store contains 10 categories with 10 decks each | ⬜ |
| DE-23 | NSFW category visibility | Dark and NSFW grouping is present and collapsible in store | ⬜ |

### 3.10 Room NSFW Toggle

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| NS-01 | Create room with NSFW toggle OFF | Room mode label shows NSFW Off | ⬜ |
| NS-02 | Create room with NSFW toggle ON | Room mode label shows NSFW On | ⬜ |
| NS-03 | Start game with NSFW OFF + NSFW active deck | Start is blocked and user is prompted to switch decks | ⬜ |
| NS-04 | Join room with NSFW OFF + NSFW active deck | Join is blocked with explanatory alert | ⬜ |
| NS-05 | Bot deck assignment in NSFW OFF rooms | Bots fall back to non-NSFW decks | ⬜ |

### 3.6 Friends & Stats

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| FR-01 | Add friend | Appears in friends list | ⬜ |
| FR-02 | Add duplicate friend | Alert: "Already in friends list" | ⬜ |
| FR-03 | Remove friend | Removed from list | ⬜ |
| ST-01 | Stats after first game | gamesPlayed = 1 | ⬜ |
| ST-02 | Win rate calculation | Correct % shown | ⬜ |
| ST-03 | Stats persist on reload | localStorage survives reload | ⬜ |

### 3.7 PWA

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| PW-01 | manifest.json valid | No console errors; installable | ⬜ |
| PW-02 | Service worker registers | "Activated" in DevTools > Application | ⬜ |
| PW-03 | Offline play | App loads from cache when offline | ⬜ |
| PW-04 | Install prompt (Chrome) | "Add to Home Screen" prompt available | ⬜ |

---

## 4. Known Limitations & Gaps

1. **Single-device only** — Room codes are stored in localStorage; real multiplayer
   across devices requires a backend (WebSocket / Firebase Realtime DB / Supabase).
2. **Wild / Question-First modes** — Currently differ in label only;
   unique rule variations not yet implemented.
3. **Card dataset scope** — Current build imports 6 official json-against-humanity packs (502 black, 2032 white) instead of all available packs.
4. **No in-game chat** — Players cannot communicate during a game.
5. **Czar auto-picks** — When you are not the Czar, an AI picks for the Czar;
   real multi-player would have the Czar pick manually on their own device.

---

## 5. Roadmap / Next Steps

### Sprint 1 (MVP hardening)
- [ ] Expand from 6 imported official packs to broader official/fan pack selection options
- [ ] Implement Wild mode rules (wild cards that players write themselves)
- [ ] Implement Question First mode (players read question before seeing options)
- [ ] Add more tongue-in-cheek praise messages (target 30+)

### Sprint 2 (Real multiplayer — same network)
- [ ] Add a lightweight Node.js + Socket.io server
- [ ] Sync game state across all players in real-time
- [ ] Show "waiting for players to submit" spinner

### Sprint 3 (Online multiplayer)
- [ ] Deploy backend to Railway / Fly.io / Render
- [ ] Persistent user accounts (magic link auth)
- [ ] Room persistence across browser sessions
- [ ] In-game chat

### Sprint 4 (Polish)
- [ ] Custom card pack creator
- [ ] Spectator mode
- [ ] Game history / replays
- [ ] Animated card deal / flip transitions

---

## 6. GitHub Project Board Structure

| Column | Description |
|--------|-------------|
| 🧊 Backlog | Ideas and future features |
| 🔍 Needs Investigation | Gameplay bugs / edge cases |
| 🚧 In Progress | Actively being worked on |
| 👀 In Review | PR open, awaiting review |
| ✅ Done | Merged and released |

### Suggested Labels

| Label | Colour | Use |
|-------|--------|-----|
| `bug` | red | Something isn't working |
| `enhancement` | blue | New feature or request |
| `multiplayer` | orange | Real-time / backend work |
| `cards` | yellow | Card deck / content |
| `pwa` | purple | PWA / offline / install |
| `game-mode` | teal | Game mode variations |
| `good first issue` | light-green | Easy entry point |
| `blocked` | grey | Waiting on backend |
