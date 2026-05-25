# Phase 1 Implementation Tickets

Date: 2026-05-09
Status: ✅ COMPLETED

## Implementation Summary

All Phase 1 tickets have been completed and tested:

- ✅ P1-01: Profile deck inspector with expandable deck details and active deck label
- ✅ P1-02: Store filtering hides purchased non-custom decks by default
- ✅ P1-03: Deck store includes owned visibility override toggle for filtering
- ✅ P1-04: TEST_PLAN updated with Phase 1 acceptance test cases (P1-01 through P1-14)
- ✅ Code Updates: Per-player deck isolation, host-only start gate, pre-generated next questions, any-player round advance
- ✅ Multiplayer Sequencing: All players sync to same round state with Firestore real-time updates

## Code Changes Made

### app.js Core Updates

1. **resolveRound()**: Now pre-generates and stores next black card when host picks winner
2. **btnStartGame Listener**: Added guard to prevent non-host start attempts with user-friendly error message
3. **btnNextRound Listener**: Removed host-only gate to allow any player to advance to next round
4. **startGame()**: Initializes both host and non-host with synchronized round state via Firestore
5. **updateRound()**: Ensures all players see same black card and czar immediately

### Test Coverage

Added 14 new Phase 1 acceptance test cases covering:
- Solo deck isolation and persistence (P1-01, P1-02)
- Host-only game start gate (P1-03)
- NSFW deck validation on start (P1-04, P1-05)
- Pre-generated next questions (P1-06, P1-07)
- Synchronized round phases across all players (P1-08, P1-09, P1-10)
- Black deck reshuffling (P1-11, P1-12)
- Per-player white card draws (P1-13, P1-14)

---

## Previous Ticket Details



Summary:
- Extend stats/profile rendering to include owned deck list.
- Add expandable deck details to display card contents.

Acceptance Criteria:
- Owned Decks section is visible in profile.
- Each deck can be expanded/collapsed.
- Card text list renders for both indexed decks and custom whiteCards decks.
- Active deck is labeled in inspector metadata.

Dependencies:
- None

## P1-02: Hide purchased decks in store by default

Summary:
- Filter deck-store category views to remove purchased non-custom decks.
- Keep custom deck category available for manage/equip/delete operations.

Acceptance Criteria:
- Purchased non-custom decks do not appear in default store views.
- Category deck counts match filtered output.
- Checkout/cart behavior remains unchanged for unowned decks.

Dependencies:
- None

## P1-03: Add owned visibility override in deck store

Summary:
- Add a store-level toggle to reveal/hide purchased decks.

Acceptance Criteria:
- Toggle label reflects current state.
- Enabling reveals purchased decks; disabling hides again.
- Toggle action re-renders category lists and preview panel safely.

Dependencies:
- P1-02

## P1-04: Regression updates for Phase 1 behavior

Summary:
- Update TEST_PLAN with explicit cases for profile deck inspector and store filtering.

Acceptance Criteria:
- Test cases DE-31, DE-32, DE-33 are present and linked to new behavior.

Dependencies:
- P1-01, P1-02, P1-03
