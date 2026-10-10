# Phase 0 Plan — Current-State Baseline and Roadmap Reset

**Version:** 1.3  
**Date:** 2026-10-10  
**Status:** In progress

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
- Produce a proposed roadmap and identify decisions that require Emil's approval.

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
| P0-03 | Reconcile conflicting and stale documents; identify a source of truth | List of updates needed and proposed ownership for status | In progress; source-of-truth hierarchy approved and stale documents labelled, but feature/status claims still need evidence-based reconciliation |
| P0-04 | Triage known defects and unverified release/security claims | Prioritized risk register with verification needs | In progress; KI-01 reload and sign-in field loss reproduced locally; room/chat access policy and test cases are approved, while deployed behavior and rules remain unverified |
| P0-05 | Agree the v1 outcome, target users, and release boundary | Approved product outcome and measurable success criteria | Outcome, boundaries, and Classic gameplay acceptance approved; two-client Firebase remains a separate release gate |
| P0-06 | Build and review dependency-aware delivery phases | Approved roadmap, phase goals, dependencies, and exit criteria | Draft sequence documented; details pending P0-03/04/05 |

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

The minimum boundary is a deployed GitHub Pages app with real-account,
two-client Firebase multiplayer. The v1 will not use runtime LLM calls or
prompt-driven behaviour; existing prompt/Gemini integration is to be retired
and the product direction revised around non-LLM gameplay. This supersedes the
earlier inclusion of one prompt-driven behaviour. Emil selected this revised
direction on 2026-10-10.

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
- Submissions remain private from other players until the Card Czar opens
  judging; at that point they are visible to the room. Only the current Card
  Czar selects the winner.
- Private hands and unrevealed submissions require per-player data isolation.
  They cannot remain in a shared room document if member rules are expected to
  protect them, because Firestore document reads do not hide individual fields.
- Phase 2 must design a safe room-code join path and separate shared state from
  per-player private state before implementing the access rules. Authorization
  allow/deny cases are recorded in `TEST_PLAN.md`.

## 8. Provisional phase sequence

This sequence is for discussion and will be revised after document reconciliation,
risk verification, and detailed acceptance criteria:

1. **Phase 0 — Baseline and roadmap reset:** complete the activities above.
2. **Phase 1 — Non-LLM scope and test-foundation reset:** retire the existing
   Gemini/prompt runtime path, align project-facing documents with the
   non-LLM direction, and correct the test generator's false cases.
3. **Phase 2 — Multiplayer security gate:** redesign shared/private room data
   and the room-code join flow, implement member/role-based authorization, then
   validate allowed and denied operations with Firebase Emulator rules tests.
4. **Phase 3 — Deployed multiplayer verification:** verify real-account
   sign-in and two-client room/game flows on the deployed app; resolve confirmed
   blockers and add regression coverage.
5. **Phase 4 — Core gameplay and reliability:** validate key non-LLM gameplay
   paths, triage known defects, and add regression coverage for the agreed v1.
6. **Phase 5 — Release hardening and portfolio readiness:** verify the
   installable PWA and offline app shell, accessibility, mobile, and recovery
   expectations; align public documentation, test evidence, and demonstration
   materials with the shipped and verified v1.

No implementation work in Phases 1–5 is authorized by this provisional
sequence. Each phase needs its own reviewed plan and decision record.

## 9. Risks and constraints

- Project status documents conflict; historical “done” checkboxes are not
  equivalent to current verification. README and `TEST_PLAN.md` now flag stale
  claims, and the old prompt-driven brief/vision and backlog are labelled
  historical. The proposed source-of-truth hierarchy and implementation-status
  reconciliation still need review.
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

Phase 0 is complete when:

- The intended v1 outcome and target release boundary are explicitly approved.
- Product and technical status claims are reconciled or clearly marked
  unverified.
- Critical journeys have a reproducible baseline with per-test outcomes
  available.
- Known issues and security/PWA risks are prioritized with owners or next
  verification actions.
- A dependency-aware roadmap exists with phase goals, non-goals, risks, and
  measurable exit criteria.
- The roadmap and decision record are reviewed before implementation begins.

## 11. Decision-record gate

No Phase 0 decision record is marked “Locked” yet. The strategic v1 outcome,
minimum playable boundary, non-LLM product direction, multiplayer security
gate, PWA acceptance, and Classic gameplay acceptance are selected or
approved. The formal decision record and documentation reconciliation remain
open; that record must contain only decisions and acceptance criteria that
have actually been approved.
