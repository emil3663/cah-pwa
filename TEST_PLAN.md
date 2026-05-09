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
| LG-09 | Top bar auth state after sign-in | Menu shows "Signed in as <email>" | ⬜ |
| LG-10 | Sign Out button behavior | User returns to landing and auth state resets | ⬜ |
| LG-11 | Invalid email format on sign-in/up | Inline validation error shown before Firebase request | ⬜ |
| LG-12 | Reset password flow | Reset email is sent for valid registered email | ⬜ |
| LG-13 | Unverified account sign-in note | Success message indicates email is not yet verified | ⬜ |
| LG-14 | Legacy local profile migration | On first account sign-in, local stats/economy/decks merge into users/{uid} profile | ⬜ |
| LG-15 | Firestore ownership rules | Authenticated user can read/write only users/{uid}; all other docs denied | ⬜ |
| LG-16 | Auth on GitHub Pages origin | Sign up/sign in works on deployed `https://emil3663.github.io/cah-pwa/` origin | ⬜ |
| LG-17 | Auth on LAN origin | Sign up/sign in works on LAN host/port once host and referrer are whitelisted | ⬜ |
| LG-18 | Local regression account sign-in | `regression@test.local` / `Regression123!` signs in on localhost/LAN without Firebase registration | ⬜ |
| LG-19 | Login build/update tag visibility | Landing page shows visible build tag before authentication | ⬜ |

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
| RM-12 | Firestore-backed room create | Creating room writes rooms/{code} and opens lobby | ⬜ |
| RM-13 | Firestore-backed room join | Joining adds player in rooms/{code}.players in real time | ⬜ |
| RM-14 | Lobby realtime sync | Two clients in same room see live player list updates | ⬜ |
| GC-01 | Game starts for non-host | Non-host client auto-starts game when host clicks Start | ⬜ |
| GC-02 | Round state sync | All clients see same black card and czar on round start | ⬜ |
| GC-03 | Submission sync | Czar sees submissions from remote players in real time | ⬜ |
| GC-04 | Duplicate submission dedup | Submitting twice does not overwrite Firestore entry | ⬜ |
| GC-05 | Result broadcast | Czar picks winner and all clients advance to result screen | ⬜ |
| GC-06 | Next-round host gate | Non-host pressing Next Round is a no-op; host advances all | ⬜ |
| GC-07 | Bot fallback solo play | Solo game with bots works unchanged without Firestore sync | ⬜ |
| GC-08 | Shared judging screen gate | Once all submissions are in, all players see judging view with submitted cards | ⬜ |
| GC-09 | Judge winner drop zone | Czar can drag a submission to Winner Zone and confirm winner | ⬜ |

### 3.3 In-Game Chat (Phase D)

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| CH-01 | Chat send lobby | Authenticated player types and sends a message in lobby chat; message appears for all room members | ⬜ |
| CH-02 | Chat send in-game | Player sends chat during game screen; message visible in collapsible chat panel | ⬜ |
| CH-03 | Chat send result screen | Player sends chat on result screen; message synced | ⬜ |
| CH-04 | Real-time delivery | Message sent by Player A appears on Player B's screen without refresh | ⬜ |
| CH-05 | Max message length | Message longer than 200 chars is truncated to 200 before sending | ⬜ |
| CH-06 | Spam throttle | Sending two messages within 1500 ms — second is silently dropped | ⬜ |
| CH-07 | Message history limit | After 50+ messages, oldest are evicted; last 50 retained | ⬜ |
| CH-08 | XSS sanitisation | Message containing `<script>alert(1)</script>` is escaped and displays as plain text | ⬜ |
| CH-09 | Chat cleared on room leave | Leaving the room stops listener; stale messages not shown on re-enter | ⬜ |
| CH-10 | Unauthenticated blocked | Firestore rejects write from unauthenticated client (rules test) | ⬜ |

### 3.4 Game Modes

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
| GP-05a | Player play area drag/drop | Dragging a hand card into Play Area adds it as selected | ⬜ |
| GP-05b | Player play area double-tap/click | Double-tapping/clicking a hand card adds it to Play Area | ⬜ |
| GP-05c | Play area pick limit | Play Area blocks selecting more cards than black-card PICK value | ⬜ |
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
| GP-22 | Mixed deck pool draw | With 2+ decks in user pool, opening hand includes cards from multiple selected decks over repeated rounds | ⬜ |

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
| GO-13 | Rounds-to-win from room setup | Setting rounds-to-win to 3 ends match immediately when a player reaches 3 points | ⬜ |

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
| DE-07 | Deck pool persistence | Selected deck pool remains intact after reload | ⬜ |
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
| DE-21 | Preview action flow | Claim/pool-add/remove/add-remove-cart actions work from selected preview panel | ⬜ |
| DE-22 | Category coverage | Store contains 10 categories with 10 decks each | ⬜ |
| DE-23 | NSFW category visibility | Dark and NSFW grouping is present and collapsible in store | ⬜ |
| DE-24 | Custom pack import (line mode) | One-card-per-line input saves custom deck when >=20 cards | ✅ |
| DE-25 | Custom pack import (JSON array) | JSON string array input saves deck and adds it to deck pool automatically | ⬜ |
| DE-26 | Custom pack import (JSON object) | Object with name/description/whiteCards is parsed and saved | ⬜ |
| DE-27 | Custom pack validation floor | Import with <20 cards is rejected with clear message | ⬜ |
| DE-28 | Custom pack ownership persistence | Imported deck remains owned and selectable after reload | ✅ |
| DE-29 | Custom pack gameplay draw | Starting a game with custom deck yields cards from imported card list | ✅ |
| DE-30 | Custom pack delete | Deleting custom deck removes ownership and falls back pool to starter if needed | ⬜ |
| DE-31 | Store hides owned purchased decks by default | Purchased non-custom decks are not shown in deck category lists until "Show Owned Decks" is enabled | ⬜ |
| DE-32 | Store owned toggle override | Toggling "Show Owned Decks" reveals purchased decks and toggling off hides them again | ⬜ |
| DE-33 | Profile deck inspector card visibility | Stats/Profile screen shows owned decks and allows expanding each deck to view included card texts | ⬜ |
| DE-34 | Multi-deck pool toggle | Owned decks can be independently added/removed from deck pool and pool count updates | ⬜ |

### 3.10 Room NSFW Toggle

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| NS-01 | Create room with NSFW toggle OFF | Room mode label shows NSFW Off | ⬜ |
| NS-02 | Create room with NSFW toggle ON | Room mode label shows NSFW On | ⬜ |
| NS-03 | Start game with NSFW OFF + NSFW-only pool | Start is blocked and user is prompted to add a non-NSFW deck to pool | ⬜ |
| NS-04 | Join room with NSFW OFF + NSFW-only pool | Join is blocked with explanatory alert | ⬜ |
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
| ST-04 | Recent games entry created | Completing a game adds one entry to Recent Games in stats view | ⬜ |
| ST-05 | Recent games newest-first | Most recently completed game appears at the top of the list | ⬜ |
| ST-06 | Recent games cap | After 12+ games, only the latest 12 entries are retained | ⬜ |
| ST-07 | Recent games details | Entry shows winner name, top score, mode, room/local tag, and timestamp | ⬜ |

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

---

## 7. Next-Session Smoke Pack

Use this mini-suite at the start of each new work session before implementing new changes.

### 7.0 Regression Test Account (Saved)

Use this fixed account for repeatable local/LAN regression runs:

| Field | Value |
|-------|-------|
| Account purpose | Local/LAN regression only (non-Firebase test path) |
| Email | `regression@test.local` |
| Password | `Regression123!` |
| Display name | `Regression QA` |
| Local profile key | `cah_regression_profile` |

Usage notes:

- This account is intentionally limited to localhost/private-LAN usage.
- On public origins (for example GitHub Pages), use normal Firebase auth accounts.

### 7.1 Session Header

| Field | Value |
|-------|-------|
| Date | |
| Tester | |
| Build / Commit | |
| URL under test | |
| Browser | |
| Service worker version | |

### 7.2 Quick Run Checklist (15-20 min)

| ID | Step | Expected Result | Pass/Fail | Notes |
|----|------|-----------------|-----------|-------|
| QS-01 | Open app with cache-bust query param | Latest JS/CSS loads (no stale UI) | | |
| QS-02 | Verify build/update tag | Landing screen displays current build tag and regression login hint | | |
| QS-03 | Sign in with regression account | `regression@test.local` / `Regression123!` lands in menu on localhost/LAN | | |
| QS-04 | Open Deck Store | Deck categories render without runtime errors | | |
| QS-05 | Confirm owned deck filtering default | Purchased non-custom decks hidden until Show Owned Decks is enabled | | |
| QS-06 | Toggle Show Owned Decks in store | Owned decks become visible and can be hidden again | | |
| QS-07 | Open profile/stats Owned Decks section | Owned decks render and each deck can expand to show card texts | | |
| QS-08 | Create room (1 AI, rounds=3) and start game | Lobby and game open successfully | | |
| QS-09 | Drag or double-tap card into Play Area | Card moves into Play Area with pick-count limits enforced | | |
| QS-10 | Submit cards and wait for all submissions | All players transition to shared judging view | | |
| QS-11 | As judge, drag submission to Winner Zone and confirm | Winner resolves and result screen appears | | |
| QS-12 | Finish game quickly | Game over appears and stats update | | |
| QS-13 | Open stats screen | Recent Games includes latest completed match | | |

### 7.3 Exit Criteria

| Outcome | Rule |
|---------|------|
| Green | QS-01..QS-13 all pass |
| Yellow | 1 failure with workaround documented |
| Red | 2+ failures or blocking regression |

### 7.4 If Any Smoke Step Fails

| Action | Requirement |
|--------|-------------|
| Capture context | Record URL, commit, browser, exact step ID |
| Capture evidence | Console error or screenshot + short repro |
| Triage | Mark as `bug` and assign severity (P0/P1/P2) |
| Gate | Do not start new feature work until P0/P1 smoke failures are fixed |

### 7.5 Latest Run Log

| Field | Value |
|-------|-------|
| Date | 2026-05-09 |
| Tester | GitHub Copilot |
| Build / Commit | working tree after f896f6d (pending commit) |
| URL under test | http://127.0.0.1:8081/?smoke=phase2-local-regression-v23 |
| Browser | VS Code integrated browser |
| Service worker version | cah-v23 |

| ID | Result | Notes |
|----|--------|-------|
| QS-01 | ✅ Pass | Cache-bust load confirmed with `style.css?v=22`, `cards.js?v=23`, `app.js?v=23`. |
| QS-02 | ✅ Pass | Landing screen displays build/update tag and local regression sign-in hint. |
| QS-03 | ✅ Pass | `regression@test.local` / `Regression123!` signs in without Firebase registration on localhost. |
| QS-04 | ✅ Pass | Deck Store loads with category sections and wallet without runtime errors. |
| QS-05 | ✅ Pass | Purchased starter deck hides by default after claim (`Core and Expansions` count drops from 10 to 9). |
| QS-06 | ✅ Pass | Show/Hide Owned Decks toggle correctly restores/removes owned starter deck in list. |
| QS-07 | ✅ Pass | Stats screen Owned Decks section expands and reveals card text list. |
| QS-08 | ✅ Pass | Room created and game starts successfully with 1 AI and rounds-to-win=3. |
| QS-09 | ✅ Pass | Double-click on hand card adds it to Play Area and selection state updates. |
| QS-10 | ✅ Pass | After submission, shared judging state appears with submission lock messaging and visible judging cards. |
| QS-11 | ✅ Pass | Judge nomination + Confirm Winner resolves result screen. |
| QS-12 | ✅ Pass | Round progression and score updates continue correctly after result screen. |
| QS-13 | ⚠️ Partial | Stats screen reached earlier in run and renders correctly; recent-games assertion not rechecked after final round in this run. |

Follow-up:

- Re-run QS-13 after a complete game-over cycle to confirm recent-games list update in the same run context.
