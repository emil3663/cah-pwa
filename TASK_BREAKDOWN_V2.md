# Task Breakdown V2 - CAH-PWA Test Implementation

## Project Overview
Cards Against Humanity PWA (Progressive Web App) with Firebase backend. Task: Continue Playwright test implementation work.

## Completed (as of 2026-06-05, ~4:20 PM)

### ✅ Section 1: 3-7 PWA Tests
- `tests/generated/3-7-pwa/pw-01.spec.js` - PASSING
- `tests/generated/3-7-pwa/pw-02.spec.js` - SKIPPED (planned)

### ✅ Section 2: 7-2 Quick-Run Smoke Tests
- `tests/generated/7-2-quick-run-checklist-15-20-min/.spec.js` - QS-01 through QS-13 implemented

### ✅ Section 3: 3-1 Auth Seedable Tests
- `tests/generated/3-1-authentication-landing/.spec.js` - LG-18, LG-19, LG-20, LG-23 ALL PASSING
- Commit: `b483540` (tests) + `522d102` (app.js fix)

### ✅ Critical Bug Fix
- **Missing `isAdminUser()` function in app.js** - was called 8 times but never defined
- Fix: Added `function isAdminUser() { return Boolean(me?.isAdmin); }`
- Commit: `522d102`

---

## Next Task: In-Progress/Completed Game Tests

### File: `tests/inprogress-completed.spec.js` (109 lines, 4 tests)
**Status: Already implemented, needs verification**

### Tests to Verify:
1. **PR-01**: In-progress game appears after leave
2. **PR-02**: Resume in-progress game from stats
3. **PR-03**: Completed game moves to Completed list
4. **PR-06**: In-progress/completed games persist after reload

### Step-by-Step Instructions:

#### Step 1: Run the tests
```bash
npx playwright test tests/inprogress-completed.spec.js --reporter=list
```

#### Step 2: If tests fail, common issues:
- **Stats screen not showing games**: Check `renderStats()` function in app.js (line 930+)
- **Resume button not found**: Check `inProgressGames` selector `#inProgressGames button:has-text("Resume")`
- **Persistence test fails**: Verify localStorage is being read after reload

#### Step 3: Key test files to check:
- `tests/helpers.js` - Has `seedRegressionProfile`, `createTestGame`, `waitForAppReady`
- `tests/inprogress-completed.spec.js` - The test file
- `app.js` lines 930-960 - `renderStats()` function

#### Step 4: Helper functions available:
```javascript
// From tests/helpers.js
seedRegressionProfile(page, overrides)  // Seeds localStorage
createTestGame({ roomCode, roomName })  // Creates test game object
waitForAppReady(page)                    // Waits for window.__APP_READY__
```

#### Step 5: Debugging commands:
```bash
# Run single test
npx playwright test tests/inprogress-completed.spec.js -g "PR-01" --reporter=list

# Run with debug
npx playwright test tests/inprogress-completed.spec.js -g "PR-01" --debug
```

#### Step 6: Commit and push:
```bash
git add tests/inprogress-completed.spec.js
git commit -m "Verify in-progress/completed game tests pass"
git push origin main
```

---

## Additional Pending Sections

### Section 4: Other Generated Test Stubs
- `tests/generated/` has many subdirectories with stub test files
- Most are already implemented (e.g., `lg-01.spec.js`, `gp-01.spec.js`)
- Check if any are still stubs needing implementation

### Section 5: Pre-existing Test Failures (from full suite run)
The full test suite (247 tests) showed 8 failures in QS-* tests:
- QS-03: Sign in with regression account
- QS-04: Open Deck Store
- QS-06: Toggle Show Owned Decks
- QS-08: Create room with AI and start game
- QS-09: Drag/double-tap card into Play Area
- QS-10: Submit cards and judge view
- QS-11: Judge drag to Winner Zone
- QS-12: Game over appears and stats update

**Common issue:** `#screen-create` not visible, `#deckStoreList` hidden, `#roomName` not visible.
**Root cause:** Likely related to deck store rendering and room creation flow.

These are PRE-EXISTING issues, not caused by the isAdminUser fix.

---

## Git History (Recent)
```
522d102 (HEAD -> main, origin/main) Fix LG-23: add missing isAdminUser() function in app.js
b483540 Seedable Auth tests: LG-18 (regression login), LG-19 (build tag), LG-20 (admin login), LG-23 (admin visibility)
4f5b200 Implement PW-01 manifest test + QS quick-run smoke tests (1-13)
686c279 Fix Playwright tests for game recovery: web server, CommonJS exports, SW block, proper waits
41b8543 Phase 3 complete: in-progress/completed game recovery & test automation rollout
```

---

## Environment
- **OS:** Windows 11
- **Shell:** PowerShell
- **Node:** Available via `npx`
- **Playwright:** Installed
- **HTTP Server:** Runs on port 8081 for tests

---

## Key Code Locations
- `app.js` line 170: `isAdminUser()` (newly added)
- `app.js` line 930: `renderStats()` function
- `app.js` line 861: `getInProgressGames()` function
- `app.js` line 865: `getCompletedGames()` function
- `app.js` line 869: `addInProgressGame()` function
- `app.js` line 882: `addCompletedGame()` function

---

## Test Constants
```javascript
REGRESSION_TEST_LOGIN = {
  email: 'regression@test.local',
  password: 'Regression123!',
  name: 'Regression QA',
  id: 'local-regression-user-v1'
}
```

---

## Next Model Instructions

1. **Verify in-progress tests pass** - Run the test suite
2. **If passing**: Commit any changes and push
3. **If failing**: Debug using the test artifacts in `test-results/`
4. **Move to next pending section** - Check other generated stubs
5. **Document any new issues** - Add to this breakdown file

### Quick Start:
```bash
# Verify the next section
npx playwright test tests/inprogress-completed.spec.js --reporter=list

# If passing, commit and push
git add -A
git commit -m "Verify in-progress/completed game tests"
git push origin main
```

### Common test failure patterns:
1. **Element not visible** - Check if the screen/element needs to be navigated to first
2. **Timeout** - Increase timeout or add explicit waits
3. **localStorage not seeded** - Verify `addInitScript` is being called
4. **App not ready** - Use `waitForAppReady(page)` after `page.goto()`

---

## Success Criteria
- All 4 in-progress/completed tests pass
- No regressions in other test suites
- Changes committed and pushed to origin/main
