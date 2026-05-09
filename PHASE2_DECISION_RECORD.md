# Phase 2 Decision Record (Locked)

Date: 2026-05-09
Scope: Play/Judge drag-drop UX and shared judging flow (items 2 and 3)
Status: Approved and in implementation

## Decisions

1. Player submission uses a dedicated Play Area.
- Cards can be moved to Play Area by drag/drop.
- Cards can also be added via double-tap/double-click.
- Submission count is constrained by black-card PICK value.

2. Judge selection uses a Winner Zone.
- Judge can nominate winner by dragging a submitted answer into Winner Zone.
- Judge can also nominate by tapping a submission card.
- Winner is committed with explicit Confirm Winner action.

3. Shared judging visibility.
- After all required submissions are present, all players transition to judging view.
- Non-judge players can view submitted cards but cannot choose winner.
- Judge is the only actor allowed to confirm winner.

4. Bot judge handling.
- If the czar is a bot, winner resolution occurs automatically after judging phase starts.
- In Firestore multiplayer, only game host performs bot resolution to avoid duplicate writes.

## Acceptance Criteria

1. Play Area interactions
- Drag/drop and double-tap/double-click both add cards to Play Area.
- Removing cards from Play Area updates pending submission state.
- Play Area never accepts more cards than current PICK count.

2. Shared judging transition
- Judging screen appears for all players only after all submissions are in.
- Submitted players no longer see active hand controls while waiting.

3. Winner confirmation
- Judge can nominate then confirm winner via Winner Zone.
- Confirm action resolves round and broadcasts result across clients.

4. Regression updates
- TEST_PLAN includes explicit GC and GP coverage for the new flow.
