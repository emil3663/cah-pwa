# Phase 1 Decision Record (Locked)

Date: 2026-05-09
Scope: Deck visibility and profile inspector (items 1 and 4)
Status: Approved and in implementation

## Decisions

1. Profile deck inspector is included.
- The profile/stats screen shows all owned decks.
- Each deck is expandable and reveals card texts inside the deck.
- Active deck is indicated in the deck metadata.

2. Purchased decks are hidden in deck store by default.
- Purchased non-custom decks are removed from category list views.
- A user-facing override toggle is provided: Show Owned Decks / Hide Owned Decks.

3. Custom packs remain visible by default.
- Custom packs are not treated as purchased store catalog items.
- Users must keep direct access for equip/delete workflows.

4. Regression policy for this phase.
- Add explicit regression cases in TEST_PLAN for profile deck inspector and store owned-hide behavior.

## Acceptance Criteria

1. Profile inspector
- Opening Stats shows an Owned Decks section.
- Expanding a deck reveals its white card texts.
- Empty owned state shows a clear call to action.

2. Deck store filtering
- Purchased non-custom decks are hidden by default after purchase.
- The owned toggle reveals hidden purchased decks and can hide them again.
- Category counts reflect the filtered list currently shown.

3. Data safety
- Existing player data and deck ownership remain backward compatible.
- No changes break deck selection, checkout, or custom deck import flows.

4. Testing
- New DE test cases for owned filtering and profile inspector are added to TEST_PLAN.
