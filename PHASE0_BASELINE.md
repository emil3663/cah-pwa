# Phase 0 Current-State Baseline

**Version:** 1.7
**Date:** 2026-10-11
**Status:** Phase 0 complete — release verification remains incomplete

## 1. Executive assessment

The repository contains a substantial game implementation, a legacy runtime
prompt integration for round praise, Firebase-backed multiplayer code, and a
documented agent-directed workflow. Emil has now selected a non-LLM v1; the
legacy prompt integration is slated for retirement. Earlier records contained
conflicting product intent, feature status, and test claims. Phase 0 has
established a source-of-truth hierarchy and an evidence register; historical
checklists remain explicitly non-authoritative.

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
| Custom decks | `app.js` contains custom-deck input parsing, minimum-card validation, import, ownership updates, deletion, and store rendering. | Implementation paths are present. The `DE-24`, `DE-28`, and `DE-29` checkmarks were not exercised by the Phase 0 run and are now marked unverified in `TEST_PLAN.md`. Emil approved retaining custom-deck functionality while excluding it from v1 acceptance and release gates. |
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
| Planning records | `PHASE_BACKLOG.md`, `TEST_PLAN.md`, `TASK_BREAKDOWN.md`, `TASK_BREAKDOWN_V2.md`, README, and product documents carry differing dates/statuses and conflicting feature claims. | The approved hierarchy distinguishes current scope, test definitions, verification evidence, and historical work notes. Current feature claims are classified in this table; old checkboxes are not treated as verification. |
| Content/licensing | `CONTENT_LICENCE_DECISION.md` records a decision; README contains the attribution, non-commercial and non-affiliation statements, and `LICENSE` exists. | The decision's documentary acceptance criteria are present; the checklist is marked complete. The record explicitly does not constitute legal advice. |
| Target audience | Emil confirmed the primary audience on 2026-10-11. | Casual players and friends are primary; portfolio reviewers are secondary and the portfolio framing must not override player UX priorities. |

## 4. Historical conflicts and their disposition

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
  expose all of that data. Phase 3 must separate private player data from
  shared room/game state before enforcing per-player read restrictions.
- Chat is stored as one document per room with an array of up to 50 messages.
  Message length and send throttling are enforced in client code, not by the
  current Firestore rules.
- `TEST_PLAN.md` CH-10 is an unimplemented, skipped placeholder for an
  unauthenticated write denial. No implemented regression case verifies
  nonmember denial, host-only operations, Card Czar adjudication, or own-player
  submission constraints. Phase 3 authorization cases are now specified in
  `TEST_PLAN.md` as planned, unimplemented rules tests.
- Approved Phase 0 policy: only room members can read shared room/game state;
  there is no nonmember open-room browser. Host authority covers lobby
  management, game start, and round advancement. The current Card Czar alone
  selects the winner. Each member can write only their own submission and can
  use room chat. Members can read shared state and their own private hand.
  The current Card Czar can read submissions for adjudication; other members
  cannot read them until the Card Czar opens judging, after which submissions
  are visible to the room.
- No Firestore rules, authentication code, schema, or room-browser behavior was
  changed in Phase 0. The implementation path for safe room-code joining and
  member discovery must be designed without granting pre-join access to room
  or game data.

### Approved source-of-truth hierarchy

Emil approved this hierarchy on 2026-10-10:

1. **Product outcome and v1 boundary:** the latest approved phase decision
   record; `PHASE0_PLAN.md` records Phase 0 closeout work. The old project
   brief is historical until reconciled.
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

## 5. Prioritized risk register

Priorities are preliminary triage for sequencing, not approved severity labels.
The phase named in the final column owns the next verification action; no action
below authorizes implementation before that phase's plan and decision record.

| Priority | Risk | Evidence | Next verification action / phase |
|---|---|---|---|
| High | Aggregate test totals can be mistaken for broad coverage. | 37 passed, 225 skipped, including 33 malformed generated outcomes; the stability inventory is untriaged. | Phase 1: repair and regression-test test generation, review generated output, and explicitly triage the stability inventory. Keep verified totals and limitations current in this baseline. |
| High | Room/chat access exceeds the approved member/role trust model. | Current rules permit any authenticated user to read/write room and chat documents; shared room documents also contain private data. | Phase 3: design safe room-code joining and private-data separation, then pass FA-01..FA-08 against the Firebase Emulator before any deployed multiplayer gate. |
| High | Deployed two-client multiplayer is not verified. | Local tests use regression accounts and bots; there is no verified two-real-account end-to-end run. | Phase 4: after Phase 3 passes, complete the synchronized two-client game and retain dated environment/outcome evidence; otherwise keep the manual release gate open. |
| Medium | Service-worker activation can reload and clear sign-in fields; offline behavior is unverified. | Local Chromium reproduced the reload and loss of synthetic credentials; standard tests block service workers. | Phase 5: validate a reviewed mitigation with a service-worker-enabled regression and verify app-shell loading offline on supported targets. |
| Medium | Runtime prompt/Gemini code conflicts with the approved non-LLM v1. | `app.js` still calls the praise prompt through `js/gemini.js`; no current test proves gameplay is independent of the model path. | Phase 1: trace/remove the runtime dependency and verify the approved Classic game completes while model requests are blocked; update KI-03 to match its final status. |
| Medium | Game-mode controls are absent from the accessibility tree. | KI-02 is confirmed by a local regression; no full keyboard or screen-reader assessment exists. | Phase 5: include keyboard and assistive-technology checks for game-mode selection and other critical journeys. |
| Medium | History behavior beyond resume-list coverage is unverified. | Code records completed history; existing recovery tests do not verify detailed contents or the 12-entry retention limit. | During phase planning, decide whether detailed history/retention is in the release boundary; if included, add direct regression coverage before claiming it verified. |
| Low | Old feature checklists and test inventories can be mistaken for current status. | Backlog and Test Plan retain historical checkboxes; generator/matrix outputs are not verification. | Ongoing: preserve the evidence table and approved source hierarchy; future status updates must cite current tests or be labelled unverified/historical. |

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
12. **Approved in the Phase 0 scope review:** custom-deck import and play remain
    available but are outside v1 acceptance and release gates. This decision
    does not authorize removing the existing feature.
13. **Approved as the Phase 0 roadmap proposal:** complete the test-foundation
    and non-LLM reset first, then local Classic gameplay, room-data isolation
    and authorization, deployed two-client multiplayer, and finally PWA,
    accessibility, and release readiness. Each implementation phase requires
    its own reviewed plan and decision record.
14. **Confirmed on 2026-10-11:** casual players and friends are the primary
    product audience; portfolio reviewers are secondary. UX and release
    trade-offs prioritize casual play among friends.

The approved local acceptance criteria are in `PHASE0_PLAN.md` and mapped in
`TEST_PLAN.md`; the full scenario is not yet implemented as a regression test.

The earlier plan for a prompt-driven v1 behaviour is superseded by the
2026-10-10 decision. The selected non-LLM direction means no runtime model
request or API key is a prerequisite for round completion.

## 7. Phase 0 closeout and subsequent gates

1. P0-03 reconciliation is complete: current feature evidence distinguishes
   code presence from test and deployment verification; conflicting checklists
   are explicitly historical. The README, `TEST_PLAN.md`, `PHASE_BACKLOG.md`,
   project brief, and vision identify their current or historical role.
2. P0-04 risk triage is complete: the prioritized risks name their next
   verification action and the phase responsible. These are planning
   assignments, not implementation authorization.
3. `PHASE0_DECISION_RECORD.md` and the approved roadmap proposal record the
   selected scope and release gates. Emil approved the Phase 0 closeout on
   2026-10-11; the primary audience is casual players and friends.
4. Phase 1 remains gated on its own reviewed plan and decision record. Once
   authorized, repair the Playwright generator, review malformed generated
   cases, repair and triage the stability inventory, and remove the runtime
   model dependency while verifying deterministic gameplay.
5. Retain this file as the durable test summary. Keep the full JSON report as a
   local diagnostic artifact rather than creating a duplicate versioned
   report.
6. Keep all unverified release gates open: local Classic regression,
   Firestore emulator authorization, deployed two-client play, and PWA/offline
   and accessibility validation.
