# 🃏 Cards Against Humanity — Test Plan

**Version:** 1.0  
**Last updated:** 2026-05-02  
**Status:** In active development

---

## 1. App Overview

A browser-based, PWA-ready implementation of Cards Against Humanity.  
Players create or join rooms, select game modes, play cards, and the Card Czar
judges each round. Supports friend lists, user stats, and tongue-in-cheek
round-winner praise.

All cards are sourced from the open-source
[json-against-humanity](https://github.com/crhallberg/json-against-humanity)
project (CC BY-NC-SA 2.0).

---

## 2. Current Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Player name / login | ✅ Done | localStorage |
| Create room with code | ✅ Done | 6-char alphanumeric code |
| Join room by code | ✅ Done | |
| Open room browser list | ✅ Done | Shows all open rooms |
| Game mode: Classic | ✅ Done | Standard rules |
| Game mode: Wild 🔥 | ✅ Done | Mode label; same mechanics |
| Game mode: Question First ❓ | ✅ Done | Black card labelled as question |
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

### 3.1 Landing / Login

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| LG-01 | Enter name and click Enter | Main menu shown with greeting | ⬜ |
| LG-02 | Empty name submit | Alert: "Please enter your name!" | ⬜ |
| LG-03 | Name persists on reload | Name pre-filled on return visit | ⬜ |
| LG-04 | Long name (24 chars max) | Input capped at 24 characters | ⬜ |

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

### 3.5 Game Over

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| GO-01 | Reach rounds-to-win | Game over screen shown | ⬜ |
| GO-02 | Winner name displayed | Correct player shown as winner | ⬜ |
| GO-03 | Final scores shown | All players, sorted by score | ⬜ |
| GO-04 | Stats updated | gamesPlayed +1; gamesWon +1 for winner | ⬜ |
| GO-05 | Play Again | New game starts with same room | ⬜ |
| GO-06 | Back to Menu | Returns to main menu | ⬜ |

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
3. **Card deck size** — 50 black + 100 white cards. The full CAH deck has 500+.
4. **No in-game chat** — Players cannot communicate during a game.
5. **Czar auto-picks** — When you are not the Czar, an AI picks for the Czar;
   real multi-player would have the Czar pick manually on their own device.

---

## 5. Roadmap / Next Steps

### Sprint 1 (MVP hardening)
- [ ] Expand card deck to full open-source set (500+ cards)
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
