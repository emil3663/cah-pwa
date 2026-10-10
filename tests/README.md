# Tests

**Read this before drawing conclusions from the number of files in this
directory.** Most generated specs are still skipped scaffolds; their count is
not evidence of equivalent automated coverage.

## Current position

Last verified: 2026-10-10, local Playwright run.

| Measure | Count |
|---|---:|
| Playwright spec files | 235 |
| Passing tests | 37 |
| Skipped tests | 225 |
| Failed tests | 0 |
| Spec files containing passing tests | 10 |

All Playwright specs are now organized under `tests/generated/` by their
`TEST_PLAN.md` section. The root of `tests/` contains the shared helper module
and this readme, not standalone spec files. The implemented coverage includes:

- Authentication/landing seedable cases (LG-18, LG-19, LG-20, LG-23).
- PWA manifest smoke (PW-01).
- Quick-run smoke checklist (QS-01 through QS-13).
- Game recovery cases (PR-01, PR-02, PR-03, PR-06).
- 15 TestForge dogfooding regression cases across authentication, room
  management, game modes, gameplay, friends, accessibility, and responsive
  smoke coverage.

The full run was local. The regression-account and AI-bot tests exercise the
local gameplay path; they do not verify real Firebase authentication,
cross-client multiplayer, or deployed room authorization. One passing
TestForge case is explicitly a `FINDING` that confirms the game-mode
accessibility defect (KI-02).

The approved one-human/two-bot Classic v1 gameplay acceptance scenario is
documented in `TEST_PLAN.md`, but is not yet implemented as a regression test.
It does not require a second device. Two-client Firebase multiplayer remains a
separate pre-release gate and has not been verified by this local test baseline.

The approved Phase 0 room/chat policy and planned Firebase Emulator cases
(FA-01 through FA-08 in `TEST_PLAN.md`) are not implemented or verified. The
current rules still permit any authenticated user to read and write room/chat
documents, and the current open-room browser reads full room documents.

Phase 0 separately exercised a fresh local Chromium context with service
workers allowed. It observed two main-frame navigations, navigation type
`reload`, and clearing of synthetic sign-in email/password values entered
before worker control (KI-01). This temporary probe was not added to the suite;
it did not verify deployed-browser behavior or offline loading. The regular
Playwright suite still blocks service workers.

## Generated scaffolds

`TEST_PLAN.md` defines test cases with stable IDs, grouped by area — `LG-` for
authentication and landing, `RM-` for room management, `GP-` for gameplay,
`GO-` for game over, `DE-` for the deck economy, and so on.

`scripts/generate_playwright_tests.js` expands that plan into the spec tree:
one stub per recognized case, under a directory per section, with the case
title, preconditions, expected result, and a `test.skip()` until the case is
implemented.

The generator currently accepts Markdown table header and separator rows as
test IDs. Those malformed generated specs account for 33 skipped outcomes in
the baseline and are not real planned test cases. Fix and test the parser
before regenerating or removing generated files; do not count those entries as
product coverage.

`scripts/generate_test_stability_matrix.js` produces a CSV inventory, but it is
not currently a stability assessment: it assigns every row `Needs
Implementation`, stores the source line rather than a clean test title, and
leaves section and requirements fields empty. `AUTOMATION_TEST_PLAN.md`
describes the intended triage workflow; repair the generator and explicitly
triage the output before using it to estimate risk or stability.

## Running the tests

```bash
npx playwright test
npx playwright test tests/generated --grep "TestForge|In-Progress/Completed Game Recovery"
```

The first command runs the complete suite, including skipped scaffolds. The
second runs the 15 TestForge cases and four implemented recovery cases.

## Coverage interpretation

A reviewer who counts spec files can mistake generated scaffolding for a large
automated suite. The full-run totals and the section-level implementation
status above distinguish the volume of planned cases from behaviour that is
currently exercised.
