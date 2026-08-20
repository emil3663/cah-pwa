# Tests

**Read this before drawing conclusions from the number of files in this
directory.** The count is large and most of it is scaffolding. That is
deliberate, and stating it plainly is more useful than letting the file count
imply coverage that does not exist.

## Current position

| | Count |
|---|---|
| Playwright spec files in total | 229 |
| Generated scaffolds under `tests/generated/` | 228 |
| Scaffolds currently calling `test.skip()` | 225 |
| Implemented spec files | 1 |
| Implemented tests | 4 |
| Assertions in implemented tests | 13 |

The one implemented file is `tests/inprogress-completed.spec.js`, covering
in-progress and completed game recovery.

Last verified: 2026-08-20.

## What the scaffolds are

`TEST_PLAN.md` defines manual test cases with stable IDs, grouped by area —
`LG-` for authentication and landing, `RM-` for room management, `GP-` for
gameplay, `GO-` for game over, `DE-` for the deck economy, and so on.

`scripts/generate_playwright_tests.js` expands that plan into the spec tree:
**one file per test-case ID**, under a directory per area, each carrying the case
title, its preconditions and its expected result as comments, and a
`test.skip()` so the suite stays green until the case is actually implemented.

The value is traceability. Because the tree maps one-to-one onto the plan's IDs,
coverage can be measured against the plan rather than estimated — you can see at
a glance which cases have a real assertion behind them and which are still a
placeholder. Adding a case to the plan and regenerating produces the file; it
does not silently disappear from the count.

`scripts/generate_test_stability_matrix.js` produces the companion artefact: the
stability matrix as CSV, rating every case **stable**, **moderate**, **flaky**,
**blocked** or **needs-implementation**. Cases that rate flaky get app test hooks
— stable element IDs and seeding — rather than retries, because a retried flaky
test is an untrustworthy test that passes.

See `AUTOMATION_TEST_PLAN.md` for the full matrix and the reasoning.

## Implementation order

The scaffolds are being implemented critical path first: authentication and
landing, room creation and joining, a full gameplay round, and game over. The
remainder stay skipped and labelled until they are genuinely implemented.

## Running the tests

```bash
npm install
npx playwright test                              # everything, skips included
npx playwright test tests/inprogress-completed    # the implemented specs only
```

## Why this file exists

A reviewer who counts spec files concludes there is a large automated suite here.
A reviewer who opens one concludes the opposite. The gap between those two
impressions is the problem, and this note closes it. The generator is worth
showing; a scaffold count presented as coverage is not.
