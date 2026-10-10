# Phase 0 Plan — Current-State Baseline and Roadmap Reset

**Version:** 1.4
**Date:** 2026-10-11
**Status:** Complete — implementation phases remain gated by their own reviewed plans and decision records

## 1. Purpose

Establish a trustworthy picture of the current product, its verified quality,
known risks, and intended v1 outcome before committing to additional feature
phases. The result will be one dependency-aware roadmap based on the repository
as it exists, not on stale or conflicting status documents.

## 2. Goal

Agree what the next releasable milestone is, define observable completion
criteria for it, reconcile the project records, and sequence the remaining work
into phases with explicit dependencies, risks, and exit criteria.

## 3. Scope

- Reconcile product vision, project brief, current feature claims, backlog,
  limitations, known issues, and test documentation.
- Capture a repeatable local automated-test baseline and distinguish implemented
  tests from skipped scaffolds.
- Identify release-critical product, test, security, PWA, and portfolio risks.
- Agree the v1 product outcome, non-LLM scope, release boundary, and portfolio
  evidence.
- Produce a dependency-aware roadmap and record approved decisions.

## 4. Out of scope

- Implementing gameplay features or fixing known issues.
- Changing Firestore rules, authentication, deployment configuration, or
  runtime model/key architecture.
- Treating reported features as complete without current verification.
- Locking later phase details before project records, release risks, and
  measurable acceptance criteria are reconciled.

## 5. Work plan

| ID | Activity | Output | Status |
|---|---|---|---|
| P0-01 | Review project goals, backlog, status documents, risks, and test assets | Evidence-based current-state inventory | Complete |
| P0-02 | Run the full local Playwright suite and record pass/fail/skip totals | Dated test baseline with limitations | Complete |
| P0-03 | Reconcile conflicting and stale documents; identify a source of truth | Evidence-based status register and source-of-truth hierarchy | Complete; current feature claims distinguish code presence from verification, conflicting snapshots are marked historical, and the approved hierarchy identifies canonical records |
| P0-04 | Triage known defects and unverified release/security claims | Prioritized risk register with next verification action | Complete; each release-critical risk has a priority and phase-gated verification action; deployed behavior and rules remain unverified |
| P0-05 | Agree the v1 outcome, target users, and release boundary | Approved product outcome and measurable success criteria | Outcome, primary audience, boundaries, Classic acceptance, and custom-deck exclusion approved; two-client Firebase remains a separate release gate |
| P0-06 | Build and review dependency-aware delivery phases | Approved roadmap, phase goals, dependencies, and exit criteria | Phase order and exit criteria approved as the Phase 0 roadmap proposal; implementation remains gated on separate phase plans and decision records |

## 6. Initial baseline

The current evidence and its limitations are recorded in
[`PHASE0_BASELINE.md`](./PHASE0_BASELINE.md).

At kickoff, local automated testing produced **262 tests: 37 passed, 225
skipped, and 0 failed**. This is not a deployed-app, real-account, multi-device,
accessibility, or security verification.

## 7. Selected product outcome and release boundary

The primary outcome and minimum playable release boundary have been selected:

**Both, with a constrained v1.** The intended milestone combines a small
playable release with a portfolio demonstration of the product and its
analysis/QA delivery, while deferring everything not required to prove those
outcomes.

The primary product audience is casual players and friends playing together.
The portfolio audience is secondary and informs how the project documents its
analysis and QA process, not the game's core UX priorities.

The minimum boundary is a deployed GitHub Pages app with real-account,
two-client Firebase multiplayer. The v1 will not use runtime LLM calls or
prompt-driven behaviour; existing prompt/Gemini integration is to be retired
and the product direction revised around non-LLM gameplay. This supersedes the
earlier inclusion of one prompt-driven behaviour. Emil selected this revised
direction on 2026-10-10.

Custom-deck import and play remain available in the application but are
explicitly outside the v1 acceptance and release gates. The scope decision does
not authorize removing the existing functionality.

The security gate is also agreed: room/chat access must be narrowed to
authorized room members and roles before public release. The detailed
authorization policy below was approved in the Phase 0 follow-up. The PWA gate
is an installable app with offline app-shell loading; live multiplayer still
requires connectivity. The constrained v1 gameplay scope is Classic mode only;
Wild and Question First are deferred. These boundaries were selected on
2026-10-10.

### Approved Classic gameplay acceptance

Emil approved this acceptance on 2026-10-10. It is not implementation
authorization. The local gameplay scenario is mapped in `TEST_PLAN.md`; it is
designed not to require multiple devices or a deployed Firebase environment.

- Run one human-controlled player with two AI bots in a Classic room, with
  rounds-to-win set to two. The existing regression-account path is acceptable
  for automated local verification; no second device or real Firebase account
  is required for this gameplay acceptance.
- Across rounds, the human and bots take turns as Card Czar; the Card Czar
  cannot submit, and every other participant submits the number of cards
  required by the current black card's PICK value.
- The Card Czar receives all bot/human submissions without a refresh and can
  select a valid submission. The result shows the winning player and card
  combination, and exactly one point is added to that winner.
- Advancing a round increments the round number, rotates the Card Czar, and
  replenishes the human player's hand to ten cards before their next turn.
- With repeatable bot decisions in the automated test, the first player to two
  points ends the match. The game-over screen shows the correct winner and
  final scores, and no further round starts.
- The gameplay run makes no runtime LLM/API request and does not require a
  model API key or response.

### Separate two-client multiplayer release gate

Before public release, verify two distinct real accounts in separate clients
can join the same room and complete a synchronized game, after room/chat
member-and-role authorization is implemented and tested. This remains a release
gate, but lack of multiple devices must not block independent implementation or
automated local gameplay work. Prefer automating the two-client check on one
machine; if it cannot be automated, keep it as an explicit pre-release manual
gate rather than treating it as completed.

### Approved room/chat authorization policy

These policy decisions guide the later security phase; they do not authorize
changes to Firestore rules or application behavior in Phase 0.

- Only room members may read shared room/game state. Nonmembers do not browse an
  open-room directory; joining by room code must not expose room/game data
  before membership is established.
- The host manages the lobby, starts the game, and advances rounds. The current
  Card Czar alone selects the round winner.
- A room member may submit only for their own player identity and may use room
  chat. Members can read shared game state, but only a player can read their
  own hand.
- The current Card Czar can read submissions for adjudication. Other members
  cannot read them until the Card Czar opens judging; then submissions are
  visible to the room. Only the current Card Czar selects the winner.
- Private hands and unrevealed submissions require per-player data isolation.
  They cannot remain in a shared room document if member rules are expected to
  protect them, because Firestore document reads do not hide individual fields.
- The multiplayer security phase must design a safe room-code join path and
  separate shared state from per-player private state before implementing the
  access rules. Authorization allow/deny cases are recorded in `TEST_PLAN.md`.

## 8. Approved Phase 0 roadmap proposal

The sequence was approved as the Phase 0 roadmap proposal. It is not
implementation authorization.
Local Classic gameplay is deliberately sequenced before Firestore hardening
because the approved one-human/two-bot acceptance does not depend on deployed
Firebase or multiple clients. The deployed multiplayer gate depends on the
security/data-model phase completing first.

### Phase 1 — Non-LLM and test-foundation reset

- **Goal:** align executable behavior and test evidence with the selected v1
  direction.
- **Dependencies:** Phase 0 decisions and roadmap approved.
- **Work:** remove the runtime Gemini/prompt dependency while preserving
  deterministic gameplay; repair the Playwright table-row generator; regenerate
  and review specs; repair and explicitly triage the stability matrix.
- **Exit criteria:** gameplay completes with runtime model requests blocked;
  generator regression cases reject table headers/separators and accept valid
  IDs; regenerated output contains no header/separator test cases; the
  stability matrix has meaningful titles, sections, requirements, and reviewed
  statuses.

### Phase 2 — Local Classic gameplay acceptance

- **Goal:** prove the approved one-human/two-bot Classic game loop locally.
- **Dependencies:** Phase 1 test-foundation reset.
- **Work:** add deterministic regression coverage for selection/submission,
  Card Czar rotation and judging, score changes, hand replenishment, and match
  completion at two points.
- **Exit criteria:** a repeatable automated test reaches game over; the Czar
  cannot submit; each non-Czar submits the required PICK count; each result
  awards exactly one point; the Czar rotates; the human hand returns to ten;
  the first player to two wins and no further round starts; no model API call
  is required.

### Phase 3 — Room data isolation and authorization

- **Goal:** enforce the approved member/role access policy without exposing
  private player data.
- **Dependencies:** Phase 1 test infrastructure and approved Phase 0 policy.
- **Work:** design and review the room-code join flow; replace nonmember
  open-room browsing; separate shared room/game state from per-player hands and
  unrevealed submissions; implement Firestore rules and Emulator tests for
  FA-01 through FA-08.
- **Exit criteria:** every FA case passes against the Firebase Emulator;
  nonmembers cannot read room/game data; only the host manages lobby/start/round
  advancement; only the current Czar selects a winner; members write only
  their own submissions; hands are private; submissions are revealed only
  after judging opens; chat is member-only.

### Phase 4 — Deployed two-client multiplayer gate

- **Goal:** verify real-account synchronization against the deployed app.
- **Dependencies:** Phase 3 authorization and data isolation pass.
- **Work:** exercise two distinct real accounts in separate clients through
  room creation/join, lobby synchronization, a complete round, judging,
  advancement, and chat.
- **Exit criteria:** both clients observe consistent membership and shared
  game state; private hands and unrevealed submissions remain isolated;
  authorized operations succeed and unauthorized operations are denied; a
  dated report records environment and outcomes. If automation is infeasible,
  retain an explicit manual pre-release gate rather than marking it passed.

### Phase 5 — PWA, accessibility, and release readiness

- **Goal:** verify install/offline behavior, recoverability, mobile usability,
  and portfolio evidence for the selected v1.
- **Dependencies:** Phase 2 gameplay and Phase 4 multiplayer gate; Phase 3
  security must remain passing.
- **Work:** address KI-01 reload/data loss and KI-02 game-mode accessibility;
  verify installability, offline app-shell loading, 320px layouts, keyboard
  and assistive-technology use, recovery, and public documentation.
- **Exit criteria:** after one successful online visit/install has cached the
  app shell, a reload while offline loads that shell; service-worker
  activation/update does not lose in-progress sign-in data; critical journeys
  remain usable at 320px and via keyboard/accessibility checks; recovery cases
  pass; README and portfolio material match verified behavior and disclose
  multiplayer's connectivity requirement.

No implementation work in Phases 1–5 is authorized by this roadmap proposal.
Each phase needs its own reviewed plan and decision record.

## 9. Risks and constraints

- Historical “done” checkboxes are not equivalent to current verification.
  README and `TEST_PLAN.md` identify their current-vs-historical boundaries;
  the project brief, vision, and backlog are labelled historical. The current
  feature evidence and verification limits are summarized in
  `PHASE0_BASELINE.md`; a historical checklist is not treated as a verified
  inventory.
- Classic gameplay criteria are approved and mapped to `TEST_PLAN.md`;
  the separate two-client release gate remains unverified.
- Generated Playwright specs materially overstate coverage if counted as
  implemented tests.
- `test-stability-matrix.csv` is not a triaged stability assessment: the
  generator defaults every test to “Needs Implementation” and captures entire
  Markdown table rows as titles. Treat it as an untriaged generated inventory
  until the generator and matrix workflow are repaired in a later test-foundation
  phase.
- The generator parses table header and separator rows into skipped test
  scaffolds; the current run includes 33 such non-case entries.
- The standard Playwright configuration blocks service workers. A separate
  isolated local Chromium probe enabled them and reproduced a first-load reload
  after the worker took control, clearing filled sign-in fields; deployed-browser
  behavior and actual user reports remain unverified.
- The Firestore rules allow any authenticated user to read and write room and
  chat documents. The approved policy now defines member-only shared-state
  reads, host/Czar/member write roles, and per-player private data; implementation
  and rules tests remain unverified.
- The existing open-room browser reads complete room documents. It conflicts
  with the approved nonmember privacy policy and needs a reviewed replacement
  as part of a future implementation plan.
- Runtime prompt/Gemini code remains although the selected v1 direction excludes
  it. Retire it only in an authorized implementation phase after confirming
  deterministic gameplay does not depend on it.
- The runtime Gemini path and its timeout concern are planned for retirement,
  not for inclusion in public v1. Confirm that no remaining product behaviour
  depends on that path before removing it.

## 10. Exit criteria

Emil approved the Phase 0 closeout on 2026-10-11. The criteria are met:

- The intended v1 outcome and target release boundary are explicitly approved.
- Product and technical status claims are reconciled or clearly marked
  unverified.
- Critical journeys have a reproducible baseline with per-test outcomes
  available.
- Known issues and security/PWA risks are prioritized with owners or next
  verification actions.
- A dependency-aware roadmap exists with phase goals, dependencies, and
  measurable exit criteria.
- The roadmap and decision record are reviewed before implementation begins.

## 11. Decision-record gate

`PHASE0_DECISION_RECORD.md` records the approved product boundary, gameplay
acceptance, authorization policy, PWA boundary, source-of-truth hierarchy, and
roadmap proposal. P0-01 through P0-06 are complete. Phase 0 closeout is
approved; later implementation remains gated on reviewed phase-specific plans
and decision records.
