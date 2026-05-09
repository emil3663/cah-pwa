# Phase 1 Implementation Tickets

Date: 2026-05-09
Status: Ready for execution tracking

## P1-01: Add owned deck inspector on profile screen

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
