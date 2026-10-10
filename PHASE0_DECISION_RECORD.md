# Phase 0 Decision Record (Locked)

Date: 2026-10-11
Scope: Establish the verified project baseline, approve the v1 boundary, and sequence delivery phases
Status: Approved; Phase 0 complete

## Decisions

1. The v1 outcome is a constrained playable release and portfolio demonstration.
- The deployed release boundary is a GitHub Pages app with real-account, two-client Firebase multiplayer.
- Runtime LLM calls and prompt-driven behaviour are outside v1.
- Classic is the only v1 game mode; Wild and Question First are deferred.

2. Local Classic gameplay is the minimum automated gameplay acceptance.
- One human and two bots play Classic with rounds-to-win set to two.
- The Card Czar cannot submit, each other participant submits the current PICK count, and the Card Czar selects a winner.
- The match ends at two points, with one point awarded per round and the human hand replenished to ten cards.
- The game loop requires no runtime model request or API key.

3. Two-client Firebase play is a separate pre-release gate.
- Two distinct real accounts in separate clients complete a synchronized game before public release.
- This gate depends on the room-data isolation and authorization phase.
- If automated verification is infeasible, a dated manual report remains required.

4. Room and chat authorization is member- and role-based.
- Only room members read shared room/game state; no nonmember open-room browser is available, and joining by code exposes no protected data before membership is established.
- The host manages the lobby, starts games, and advances rounds; only the current Card Czar selects the winner.
- Members submit only for themselves and use room chat; each player reads only their own hand.
- The current Card Czar reads submissions for adjudication. Other members read them only after judging opens, at which point submissions are visible to the room.
- Hands and unrevealed submissions are isolated from shared room state. These decisions do not authorize Phase 0 changes to Firestore rules, authentication, or application behavior.

5. Custom-deck import and play remain available but are excluded from v1 acceptance.
- Existing custom-deck functionality is not removed by this scope decision.
- Custom decks are outside v1 release gates.

6. The app is an installable PWA with offline app-shell loading.
- Live multiplayer still requires connectivity.
- PWA, accessibility, and release-readiness verification follows local gameplay and the deployed multiplayer gate.

7. Project records use an approved source-of-truth hierarchy.
- Phase decision records define approved product scope; phase plans and records define sequencing and active work; `TEST_PLAN.md` defines test cases; dated evidence records verification; README summarizes verified behavior.
- Historical task lists and candidate backlogs do not prove implementation or completion.
- `PHASE0_BASELINE.md` is the durable test summary; do not create a duplicate durable test report.

8. Delivery follows the approved dependency-aware roadmap.
- Phase 1 resets the non-LLM runtime path and test foundation.
- Phase 2 verifies local Classic gameplay.
- Phase 3 isolates room data and implements authorization.
- Phase 4 verifies deployed two-client multiplayer.
- Phase 5 verifies PWA, accessibility, and release readiness.
- This roadmap approves sequencing only; each implementation phase requires its own reviewed plan and decision record.

9. Casual players and friends are the primary product audience.
- Portfolio reviewers are a secondary audience for the project's analysis and QA evidence.
- Product UX and release trade-offs prioritize casual play among friends.

## Acceptance Criteria

1. Evidence baseline
- `PHASE0_BASELINE.md` records the dated local test command, environment, per-test outcomes, executed case IDs, totals, and coverage limitations.
- The baseline distinguishes generated skips from verified failures and does not imply that skipped tests passed.

2. Project status and risk register
- Product and technical claims are either supported by current evidence or explicitly marked unverified or historical.
- Known issues and security/PWA risks have a priority and a concrete owner or next verification action.

3. Product and authorization boundaries
- The selected v1 outcome and release gates above are stated consistently in the current project records.
- Casual players and friends are identified as the primary product audience; portfolio reviewers are secondary.
- The room/chat policy is mapped to planned authorization cases in `TEST_PLAN.md`, without claiming that rules or deployed behavior have passed.

4. Delivery roadmap
- `PHASE0_PLAN.md` lists each approved phase's goal, dependencies, work, and measurable exit criteria.
- No later-phase implementation begins without its own reviewed plan and decision record.

## Regression Policy

- Keep `TEST_PLAN.md` aligned with the approved boundaries and future phase work.
- Preserve the local Classic acceptance scenario and the planned FA-01 through FA-08 authorization cases in `TEST_PLAN.md`; mark them implemented or passed only after corresponding verification.
- Maintain the verified test totals and limitations in `PHASE0_BASELINE.md`; do not add a duplicate test report.
