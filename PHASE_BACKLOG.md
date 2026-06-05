## Phase 3: In-Progress/Completed Game Recovery
- [x] Track in-progress games per player profile
- [x] Track last 5 completed games per player profile
- [x] Add resume flow from stats/profile screen
- [x] Remove in-progress entry on leave or game over
- [x] Add regression and smoke test cases to TEST_PLAN.md
- [x] Feature merged to `main`
- [x] Smoke-tested on localhost and GitHub Pages
# Phase Backlog (Post-Auth)

## Goal
Track the remaining long-term roadmap items as concrete phases so the team can execute in order.

## Phase A: Firestore Security Hardening
- [x] Restrict `users/{uid}` reads/writes to authenticated owner only.
- [x] Deny all other collections by default.
- [x] Verify with manual read/write tests as two different users.

## Phase B: Realtime Multiplayer Foundation
- [x] Choose backend transport (Firestore room documents with real-time listeners).
- [x] Move room state from localStorage to backend state.
- [x] Sync lobby joins/leaves and room updates across devices.

## Phase C: Real Multiplayer Game Loop
- [x] Sync round progression and submissions in real-time.
- [x] Add reconciliation logic to avoid duplicate submissions.
- [x] Keep bot simulation as fallback for solo/local testing.

## Phase D: In-Game Chat
- [x] Add room-scoped chat channel.
- [x] Persist latest messages per room.
- [x] Basic moderation guardrails (length, spam throttling).

## Phase E: Custom Packs + History
- [x] Add custom deck creation/import flow.
- [x] Store deck metadata and ownership in profile.
- [x] Add game history summary screen.

## Definition of Done per phase
- Feature merged to `main`
- Smoke-tested on localhost and GitHub Pages
- Regression cases added/updated in `TEST_PLAN.md`
