# Phase 0 Current-State Baseline

**Version:** 1.6  
**Date:** 2026-10-10  
**Status:** In progress — initial verification incomplete

## 1. Executive assessment

The repository contains a substantial game implementation, a legacy runtime
prompt integration for round praise, Firebase-backed multiplayer code, and a
documented agent-directed workflow. Emil has now selected a non-LLM v1; the
legacy prompt integration is slated for retirement. The primary planning risk
is that current product intent, delivered scope, and test status are recorded
in several documents that disagree or have not been refreshed together.

The baseline supports a narrow conclusion: the tested local smoke and recovery
journeys are currently green, but 225 tests are skipped and major deployed,
multi-client, service-worker, and security behaviours remain outside this run.
It does not yet support a claim that the complete product is release-ready.

## 2. Test baseline

### Full Playwright run

- Commands: `npx playwright test --reporter=dot` and
  `npx playwright test --reporter=json`
- Environment: local Playwright run using the repository's configured web
  server and browser settings.
- Result: **262 total; 37 passed; 225 skipped; 0 failed.**
- A JSON run was also captured at
  `test-results/phase0-playwright-report.json`. It records 262 individual
  outcomes (37 expected/passed, 225 skipped, 0 unexpected). `test-results/` is
  git-ignored, so this raw report is available in the local working copy but is
  not a versioned project artifact.
- The report was produced with `npx playwright test --reporter=json`; the full
  run duration was approximately 123 seconds.
- The 37 passing cases comprise LG-18/19/20/23 (4), PW-01 (1), QS-01..QS-13
  (13), PR-01/02/03/06 (4), and 15 TestForge dogfooding cases now organized
  under the matching `tests/generated/` sections.
- One dogfooding test is explicitly marked `FINDING` and passes by confirming
  the known game-mode accessibility defect (KI-02). A passing suite can
  therefore still document a known product defect.
- After relocating the specs into `tests/generated/`, the full suite was run
  again and retained the same result: **37 passed, 225 skipped, 0 failed**.
  The relocated 15 TestForge cases and four recovery cases also passed in a
  focused run (**19 passed**).

### Focused runs

- `tests/generated/3-6-1-in-progress-completed-game-recovery-phase-3/implemented-recovery.spec.js`:
  **4 passed** (PR-01, PR-02, PR-03, PR-06).
- All relocated TestForge dogfooding files plus implemented recovery:
  **19 passed**.
- `tests/generated/7-2-quick-run-checklist-15-20-min/.spec.js`: **13 passed**
  (QS-01 through QS-13).

### Interpretation and gaps

- The 225 skipped tests are not 225 observed runtime defects. They are largely
  generated `test.skip()` placeholders awaiting implementation; PW-02 is
  explicitly skipped because the shared Playwright config sets
  `serviceWorkers: 'block'`. The JSON report includes two header/placeholder
  entries (`"---------: --------"` and `"ID: Test"`) in addition to named test
  cases, so raw skip totals should not be treated as a count of distinct
  planned product cases without filtering.
- Further classification of the report found **192 named case-like skips and
  33 header/separator rows** masquerading as skipped tests. In
  `scripts/generate_playwright_tests.js`, the row-matching regex accepts
  arbitrary uppercase letters, digits, and hyphens as an ID; it consequently
  accepts Markdown table headers and separator rows. Fix the generator and
  review affected generated files before treating the skip count as planned
  coverage.
- The focused 19 and 13 passing tests are included in the full-run total; they
  must not be added to it.
- The current run was local. It does not prove GitHub Pages behaviour, Firebase
  authentication with a real account, real multi-device synchronization,
  service-worker activation/offline behaviour, or security-rule enforcement.
- All Playwright specs are now under `tests/generated/`, grouped by their
  `TEST_PLAN.md` section; `tests/README.md` records the current verified
  totals and the local-vs-deployed coverage boundary.
- `test-results/.last-run.json` stores only aggregate status and failed-test
  identifiers; it is insufficient as the durable Phase 0 test report.

## 3. Current-state evidence

| Area | Repository evidence | Assessment |
|---|---|---|
| Product direction | `PROJECT_BRIEF.md` and `PRODUCT_VISION.md` record the original runtime-prompt thesis. | Emil's 2026-10-10 decision supersedes it for v1. README and the metadata on the brief/vision now identify the new direction and preserve the old thesis as historical context. |
| Core game | `TEST_PLAN.md` and README describe auth, rooms, decks, gameplay, stats, and game recovery; QS-01..QS-13 passed locally. | A broad local happy-path slice is implemented and tested. Deployed and real-user journeys still need verification. |
| Multiplayer | `PHASE_BACKLOG.md` says the Firestore multiplayer foundation and game loop are complete; the smoke tests cover a local AI game, not two authenticated clients. | Treat cross-client multiplayer completion as reported, not currently verified by the automated baseline. |
| Custom decks | `app.js` contains custom-deck input parsing, minimum-card validation, import, ownership updates, deletion, and store rendering. | Implementation paths are present. The `DE-24`, `DE-28`, and `DE-29` checkmarks were not exercised by the Phase 0 run and are now marked unverified in `TEST_PLAN.md`. The selected v1 documents do not yet settle whether custom packs are in scope. |
| Game history | `app.js` records end-of-game history and renders in-progress/completed lists; four recovery tests cover list display/resume affordance and persistence. | Recovery-list behavior has focused local coverage. Detailed all-time history content and the 12-entry retention limit are not verified by the Phase 0 baseline. |
| Prompt integration | `prompts/praise.txt` exists; `app.js` calls `ask('praise', ...)`; `js/gemini.js` reads a prompt file and makes a Gemini request. The configured API key is blank. | **Out of v1 scope by decision.** Emil selected a non-LLM product direction on 2026-10-10. Retire the runtime prompt/Gemini path and reconcile the product documentation; verify no other behavior depends on it. |
| Runtime model failure handling | `KNOWN_ISSUES.md` records an unbounded Gemini request; the helper in `js/gemini.js` has no timeout. | The timeout issue is superseded by the decision to remove runtime LLM calls from v1. Remove the dependency rather than invest in a timeout path, unless a later approved scope reintroduces it. |
| PWA/service worker | `service-worker.js` uses cache `cah-v30`; the standard `playwright.config.js` blocks service workers and PW-02 remains a skipped suite test. In an isolated local Chromium probe with service workers allowed, synthetic sign-in values were entered before first-load control; the page made two main-frame navigations, reported `navigationType: "reload"`, and both values were empty after reload. | Reload and sign-in field loss are reproduced locally and are consistent with KI-01's `controllerchange` handler. The probe did not test other browsers, real-user impact, deployed behavior, or offline loading. No application fix was made. |
| Firestore security | `firestore.rules` restricts user profile access, but any authenticated user can read and write all room and chat documents. Its comments describe this as a foundation awaiting stricter rules. | The member/role authorization gate is approved. Actual allow/deny behavior has not been exercised with rules tests or deployed clients; no rules were changed in Phase 0. |
| Automated coverage | Full run: 37 pass and 225 skip; [tests/README.md](./tests/README.md) and README now describe test inventory and limitations. | `PHASE0_BASELINE.md` is the approved durable summary for commands, environment, totals, executed case IDs, and limitations. The full JSON remains local/ignored; do not add a duplicate per-test report. |
| Test generator accuracy | `scripts/generate_playwright_tests.js` matches arbitrary pipe-delimited rows and produces test stubs from table headings/separators. The latest JSON report contains 33 malformed skipped entries. | Fix row recognition, then review generated output. Do not count these 33 entries as planned cases or delete generated files without confirming they are artifacts. |
| Stability matrix | `test-stability-matrix.csv` has 174 lines including its header. `scripts/generate_test_stability_matrix.js` extracts IDs heuristically, writes the full source line as each title, and assigns every row `Needs Implementation`; it does not assess stability or populate section/requirement fields. | Do not use this CSV as a stability assessment or estimate. Repair the generator and perform explicit triage in the later test-foundation phase. |
| Known issue KI-01 | With service workers enabled in a fresh local Chromium context, the first-load activation produced two main-frame navigations; the post-reload navigation type was `reload`, and previously filled synthetic email/password fields were cleared. | Reload and field loss are reproduced locally. Deployed-browser behavior and real-user impact remain unverified. Keep the defect open for an authorized implementation phase. |
| Known issue KI-02 | The TestForge regression verifies that the game-mode radio is absent from the accessibility role tree while the underlying input can still be toggled through its label. | Reproduced by a local browser regression test; remediation remains open. |
| Known issue KI-03 | `js/gemini.js` has an unbounded request; `resolveRound()` falls back only if the request rejects. | Superseded for v1 by the non-LLM decision. Retire the call path in planned work rather than adding a timeout, unless runtime LLM behaviour is later approved. |
| Planning records | `PHASE_BACKLOG.md`, `TEST_PLAN.md`, `TASK_BREAKDOWN.md`, `TASK_BREAKDOWN_V2.md`, README, and product documents carry differing dates/statuses and conflicting feature claims. | The Phase 0 source-of-truth hierarchy is approved. README and `TEST_PLAN.md` flag stale claims; brief, vision, and backlog are labelled historical. Current implementation status still needs verification. |
| Content/licensing | `CONTENT_LICENCE_DECISION.md` records a decision; README contains attribution and `LICENSE` exists. Some acceptance checkboxes in the decision record remain unchecked. | The described outcome appears present, but the decision record's completion state is inconsistent and needs housekeeping. |

## 4. Conflicts and stale records to reconcile

1. **Feature status:** `PHASE_BACKLOG.md` marks multiplayer, chat, custom packs,
   and history done, while its older `TEST_PLAN.md` snapshot said some were not
   started and described the app as single-device only. `TEST_PLAN.md` now
   labels its feature snapshot, limitations, and sprint roadmap historical;
   it records Firebase multiplayer/chat and custom-deck code as present but
   incompletely verified. Game-history code and recovery-list tests are
   present, while detailed history behavior remains unverified.
2. **Test coverage:** README and the test README previously reported four
   implemented tests; both now report the 2026-10-10 local run (37 passed,
   225 skipped). The stability matrix and its generator remain inaccurate and
   untriaged.
3. **Roadmap:** `TEST_PLAN.md` retains a Node/Socket.io sprint plan that does not
   match the Firebase architecture described by later records.
4. **Prompt scope:** the historical vision describes praise, AI strategy, judging, and deck
   generation as targets; current file evidence confirms only praise prompt
   wiring and one prompt file. Emil has since removed runtime prompts from v1
   scope; README and the brief/vision status labels now reflect that decision.
   Runtime code retirement remains planned, not implemented.
5. **Issue record:** `KNOWN_ISSUES.md` has actionable defect descriptions, but
   current severity, reproduction, and fix status are not recorded consistently
   with the roadmap.

### Firestore authorization evidence and approved policy

- `firestore.rules` allows any signed-in user to read and write every
  `rooms/{roomCode}` and `chats/{roomCode}` document. This includes room
  creation, joining, lobby settings, and game-state fields such as submissions
  and scores; the rules do not enforce the client-side host/join/Czar checks.
- The app lists up to 30 lobby-status room documents for signed-in users and
  renders each room's name, code, player count, capacity, and mode. Because
  those fields live in the same document as room membership and game state,
  document-level Firestore reads expose more than a sanitized listing.
- The room document also contains private player decks and unrevealed
  submissions. Firestore rules cannot hide selected fields from a document
  reader, so member-only access to the current shared document would still
  expose all of that data. Phase 2 must separate private player data from
  shared room/game state before enforcing per-player read restrictions.
- Chat is stored as one document per room with an array of up to 50 messages.
  Message length and send throttling are enforced in client code, not by the
  current Firestore rules.
- `TEST_PLAN.md` CH-10 is an unimplemented, skipped placeholder for an
  unauthenticated write denial. No implemented regression case verifies
  nonmember denial, host-only operations, Card Czar adjudication, or own-player
  submission constraints. Phase 2 authorization cases are now specified in
  `TEST_PLAN.md` as planned, unimplemented rules tests.
- Approved Phase 0 policy: only room members can read shared room/game state;
  there is no nonmember open-room browser. Host authority covers lobby
  management, game start, and round advancement. The current Card Czar alone
  selects the winner. Each member can write only their own submission and can
  use room chat. Members can read shared state and their own private hand.
  Submissions remain private from other players until the Card Czar opens
  judging; then the submissions are visible to the room.
- No Firestore rules, authentication code, schema, or room-browser behavior was
  changed in Phase 0. The implementation path for safe room-code joining and
  member discovery must be designed without granting pre-join access to room
  or game data.

### Approved source-of-truth hierarchy

Emil approved this hierarchy on 2026-10-10:

1. **Product outcome and v1 boundary:** the latest approved phase decision
   record; until Phase 0 is locked, use decisions recorded in
   `PHASE0_PLAN.md`. The old project brief is historical until reconciled.
2. **Sequencing and active work:** approved `PHASE_N_PLAN.md` files and their
   decision records. `PHASE_BACKLOG.md` is a candidate backlog, not evidence of
   completion.
3. **Test case definitions:** `TEST_PLAN.md`; implementation status must be
   distinguished from a generated spec file existing.
4. **Verification evidence:** dated test and smoke reports, recording
   environment and per-test outcomes.
5. **Public summary:** `README.md` describes verified product behaviour but
   does not override a phase decision or test evidence.
6. **Historical work notes:** `TASK_BREAKDOWN.md`, `TASK_BREAKDOWN_V2.md`, and
   superseded roadmap sections remain historical unless explicitly refreshed.

This hierarchy is intended to stop historical task lists and public summaries
from competing with approved scope. Existing implementation-status claims still
need evidence-based reconciliation under it.

## 5. Initial risk register

| Priority | Risk | Evidence | Phase 0 disposition |
|---|---|---|---|
| High | A green aggregate run can be mistaken for broad coverage. | 225 skipped; 37 passed; 33 malformed generated skips; stability CSV is untriaged. The raw JSON report is git-ignored. | Emil approved `PHASE0_BASELINE.md` as the durable test summary; keep totals, named executed cases, and limitations current there. Do not create a duplicate report. |
| High | Room/chat rules permit broader access than the intended trust model. | `firestore.rules` permits any authenticated user to read/write room and chat docs. | **Resolved:** Emil requires member/role-based access before public release. A rules review and authorization tests are still required; no rule changes in Phase 0. |
| Medium | Service-worker lifecycle, offline behavior, and first-load update UX need release validation. | Standard suite blocks service workers and skips PW-02. Isolated local probe reproduced reload and clearing of filled sign-in fields; offline behavior was not tested. | Reload/data-loss reproduction is complete locally. Keep mitigation and offline/deployed-browser validation for the authorized PWA phase; do not treat the probe as a fix or release sign-off. |
| Medium | Old prompt-driven implementation remains despite the approved non-LLM direction. | Runtime praise call path remains in `app.js`/`js/gemini.js`; README and brief/vision are relabelled to reflect historical scope. | Retire the runtime path in an authorized implementation phase, confirm deterministic gameplay remains intact, and remove or revise KI-03 as appropriate. |
| Medium | Test generator creates false cases from Markdown table syntax. | Regex in `scripts/generate_playwright_tests.js` also matches header and separator rows; 33 such skips appeared in the report. | Correct and test the parser, review generated output, and refresh the test inventory in the test-foundation phase. |
| Medium | Test stability inventory is mistaken for a completed risk assessment. | Generator sets every test to “Needs Implementation” and captures full Markdown rows as titles; stability is not assessed. | Repair and explicitly triage the matrix in the test-foundation phase. |
| Medium | First-load service-worker activation reloads the page and clears in-progress sign-in fields. | Isolated local Chromium probe confirmed reload and clearing of synthetic email/password values; deployed behavior and real-user impact were not tested. | Reproduction is confirmed locally. Validate an approved mitigation with focused regression coverage in the PWA phase. |
| Medium | Game-mode controls are inaccessible to assistive technology. | KI-02 is confirmed by a local regression asserting no radio role is exposed. | Keep as an open defect; include keyboard and screen-reader regression criteria in release-quality work. |

Priorities are preliminary triage, not approved severity labels or implementation
authorization.

## 6. Product decisions recorded

1. **Resolved 2026-10-10:** the v1 outcome is both a constrained playable
   product and a portfolio demonstration, with the project explicitly
   reoriented away from runtime LLM calls and prompt-driven behaviour.
2. **Resolved 2026-10-10:** the minimum playable boundary is a deployed GitHub
   Pages app with real-account, two-client Firebase multiplayer.
3. **Resolved 2026-10-10:** v1 requires an installable PWA and offline
   app-shell loading; live multiplayer requires connectivity.
4. **Resolved 2026-10-10:** room/chat access must be narrowed to authorized
   room members and roles before public release. Current rules permit any
   authenticated user to read/write room and chat documents; no rule changes
   have been made as part of Phase 0.
5. **Resolved 2026-10-10:** constrained v1 gameplay acceptance covers Classic
   mode only. Wild and Question First are deferred; this selects product scope
   and does not authorize removing those modes before a reviewed implementation
   plan.
6. **Resolved 2026-10-10:** one human-controlled player plus two AI bots is
   sufficient for the v1 Classic gameplay acceptance scenario. Emil approved
   the detailed gameplay criteria on 2026-10-10; this allows automated gameplay
   verification without multiple devices.
7. **Retained as a separate pre-release gate:** two real accounts in separate
   clients must complete a synchronized game after room/chat member-and-role
   authorization is implemented and tested. Device availability must not block
   independent implementation work; automate the gate on one machine if
   feasible, otherwise keep it explicitly open until a pre-release manual run.
8. **Resolved 2026-10-10:** use `PHASE0_BASELINE.md` as the versioned summary
   of test commands, environment, totals, named executed cases, and limitations.
   Keep the full Playwright JSON report local and ignored; do not add a
   duplicate per-test status export.
9. **Approved in the Phase 0 authorization review:** only room members can
   read shared room/game state; nonmembers cannot browse an open-room list.
   Preserve the private room-code join concept only through a flow that does
   not disclose room/game data before membership is established.
10. **Approved in the Phase 0 authorization review:** the host manages the
    lobby, starts the game, and advances rounds; the current Card Czar selects
    the winner; each member writes only their own submission and may use chat.
11. **Approved in the Phase 0 authorization review:** shared state is visible
    to members, but hands are private to their owner. Submissions remain private
    from other players until the Card Czar opens judging, when the submissions
    become visible to the room. The Firestore data layout must separate private
    records before member-only rules can provide these guarantees.

The approved local acceptance criteria are in `PHASE0_PLAN.md` and mapped in
`TEST_PLAN.md`; the full scenario is not yet implemented as a regression test.

The earlier plan for a prompt-driven v1 behaviour is superseded by the
2026-10-10 decision. The selected non-LLM direction means no runtime model
request or API key is a prerequisite for round completion.

## 7. Immediate next actions

1. Reconcile remaining feature/status claims against repository evidence using
   the approved hierarchy; README and `TEST_PLAN.md` identify stale/current-
   status boundaries, while the old brief, vision, and backlog are historical.
2. In the authorized test-foundation phase, correct the Playwright generator's
   row matching, review bogus generated cases, and repair/triage the stability
   matrix before refreshing the coverage inventory.
3. Keep `PHASE0_BASELINE.md` current as the durable summary; retain the full
   JSON report as a local diagnostic artifact without duplicating it in another
   versioned report.
4. Keep the reproduced KI-01 first-load reload open for an authorized PWA fix;
   authorization policy and allow/deny cases are now recorded, while rules,
   schema, and live behavior remain unimplemented and unverified.
5. Formalize the approved product and gameplay decisions in the Phase 0
   decision record; keep Wild and Question First out of v1 acceptance.
6. Convert the approved outcome and risk disposition into reviewed phase
   plans, acceptance criteria, and dependencies, including a safe room-code
   join/data-separation design before Phase 2 implementation.
