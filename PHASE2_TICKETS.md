# Phase 2 Implementation Tickets

Date: 2026-05-09
Status: In progress

## P2-01: Implement player Play Area drop zone

Summary:
- Add a dedicated submission target area for players.
- Support drag/drop and double-tap/double-click card movement.

Acceptance Criteria:
- Cards can be moved from hand into Play Area.
- Play Area reflects pending submission state.
- Pick-count limits are enforced.

Dependencies:
- None

## P2-02: Implement shared judging transition logic

Summary:
- Move all players to judging UI once all required submissions exist.
- Ensure submitted non-judge players see waiting/judging state rather than active hand controls.

Acceptance Criteria:
- Transition happens only when all non-judge players submitted.
- Non-judge clients can view submissions but cannot choose winner.

Dependencies:
- P2-01

## P2-03: Implement judge Winner Zone and confirmation

Summary:
- Add judge-only Winner Zone with drag/tap nomination.
- Add explicit confirm action to finalize round winner.

Acceptance Criteria:
- Judge can nominate and clear winner candidate.
- Confirm Winner resolves round and triggers existing result flow.

Dependencies:
- P2-02

## P2-04: Multiplayer guardrails for bot judge flow

Summary:
- Preserve bot-judge auto-resolution while preventing duplicate result writes in synced multiplayer.

Acceptance Criteria:
- Bot judge auto-resolves after judging starts.
- In Firestore sync, only host executes bot resolution.

Dependencies:
- P2-02

## P2-05: Regression plan updates

Summary:
- Add/maintain tests for Play Area interactions and judging flow.

Acceptance Criteria:
- TEST_PLAN contains GC-08, GC-09, GP-05a, GP-05b, GP-05c.

Dependencies:
- P2-01, P2-02, P2-03
