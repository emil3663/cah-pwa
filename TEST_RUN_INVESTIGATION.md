# Investigation of Skipped or Blocked Tests

**Version:** 1.0  
**Date:** 2026-10-10  
**Status:** Complete

## Evidence reviewed

- `test-results/.last-run.json`
- `playwright.config.js`
- `tests/README.md`
- Relevant specs under `tests/` and `tests/generated/`
- `TEST_PLAN.md`

## Findings

| Test or group | Status indicated by source | Reason |
|---|---|---|
| Latest recorded run | Passed; `failedTests` is empty | `.last-run.json` contains only `status` and `failedTests`. It does not list test names, skipped-test counts, or skip reasons, so it cannot establish which cases ran or were skipped. |
| PW-02 — Service worker registers | Explicitly skipped | Its spec calls `test.skip(true, ...)` because `playwright.config.js` sets `serviceWorkers: 'block'`. The spec says to run it with a config that allows service workers. |
| Generated placeholder cases (224 call sites) | Skipped by their test bodies | These scaffolds call `await test.skip()` with the comment “remove this once test is implemented.” They contain placeholder preconditions, steps, and expected results, rather than executable checks. Examples include LG-01 (account creation), AI-01 (lobby player count with bots), PR-01 (in-progress game appears after leave), and QS-04 (open Deck Store). |

A source scan found 225 `test.skip()` call sites: the 224 generic placeholders above and the explicit PW-02 skip. These are source-level skip declarations, not a count of skips in the latest recorded run. The test README also reports 225 skipped generated scaffolds and says its totals were last verified on 2026-08-20.

## Notes on the examples in the request

- **“Recent Games” / Test Case 101:** The “Test Case 101: Recent Games” block in `tests/inprogress-completed.spec.js` is a comment, not a Playwright test. That file contains implemented PR-01, PR-02, PR-03, and PR-06 test bodies and has no skip declaration. The real Recent Games identifiers in `TEST_PLAN.md` are ST-04 through ST-07. The comment's suggested link between Recent Games and service-worker blocking is not supported by the test code; the explicit service-worker skip is PW-02.
- **Lobby Player Count:** The matching planned case is AI-01, “Lobby player count with bots.” Its generated spec is an unimplemented placeholder; it does not encode a login-based skip condition.
- **Deck Store:** QS-04, “Open Deck Store,” has a generic skipped scaffold. An implemented QS-04 body also appears in the hidden `tests/generated/7-2-quick-run-checklist-15-20-min/.spec.js` file, but `.last-run.json` does not say whether that file was discovered or what result it produced.

## Recommendations

1. Keep PW-02 marked as environment/configuration-blocked until it is run with service workers allowed; then assert actual registration/activation rather than removing the skip without a check.
2. Treat the generic scaffolds as **needs implementation**, not runtime failures. Implement their planned steps and assertions before counting them as automated coverage.
3. Save a detailed Playwright report (for example, HTML or JSON output) for future investigations. `.last-run.json` alone is insufficient to identify individual skipped or passed tests.
4. Correct or remove the “Test Case 101: Recent Games” comment in `tests/inprogress-completed.spec.js`; it currently describes a skip and cause that the executable tests do not show.

## Summary

The recorded run reports no failures, but it does not provide per-test results or skipped counts. Source inspection confirms one intentionally blocked case (PW-02) and 224 generic unimplemented placeholders. No evidence in `.last-run.json` supports a claim that a particular number of tests passed, or that the “Recent Games” case was skipped.
