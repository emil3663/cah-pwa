# Phase Backlog (Post-Auth)

## Goal
Track the remaining long-term roadmap items as concrete phases so the team can execute in order.

## Phase A: Firestore Security Hardening
- [ ] Restrict `users/{uid}` reads/writes to authenticated owner only.
- [ ] Deny all other collections by default.
- [ ] Verify with manual read/write tests as two different users.

## Phase B: Realtime Multiplayer Foundation
- [ ] Choose backend transport (Socket.IO service or Firebase Realtime path).
- [ ] Move room state from localStorage to backend state.
- [ ] Sync lobby joins/leaves and room updates across devices.

## Phase C: Real Multiplayer Game Loop
- [ ] Sync round progression and submissions in real-time.
- [ ] Add reconciliation logic to avoid duplicate submissions.
- [ ] Keep bot simulation as fallback for solo/local testing.

## Phase D: In-Game Chat
- [ ] Add room-scoped chat channel.
- [ ] Persist latest messages per room.
- [ ] Basic moderation guardrails (length, spam throttling).

## Phase E: Custom Packs + History
- [ ] Add custom deck creation/import flow.
- [ ] Store deck metadata and ownership in profile.
- [ ] Add game history summary screen.

## Definition of Done per phase
- Feature merged to `main`
- Smoke-tested on localhost and GitHub Pages
- Regression cases added/updated in `TEST_PLAN.md`
