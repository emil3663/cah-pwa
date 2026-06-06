# Task Breakdown for CAH-PWA Test Implementation

## Project Overview
This is a Cards Against Humanity PWA (Progressive Web App) with Firebase backend. The task is to implement Playwright test suites for various features.

## Current State (as of 2026-06-05)

### Completed Sections ✅
1. **3-7 PWA Tests** (`tests/generated/3-7-pwa/`)
   - PW-01: Service Worker registration - PASSING
   - PW-02: Offline fallback - SKIPPED (planned, requires network simulation)

2. **7-2 Quick-run Smoke Tests** (`tests/generated/7-2-quick-run-checklist-15-20-min/.spec.js`)
   - QS-01 through QS-13 - All implemented

3. **3-1 Auth Seedable Tests** (`tests/generated/3-1-authentication-landing/.spec.js`)
   - LG-18: Local regression account sign-in - PASSING
   - LG-19: Build/update tag visibility - PASSING
   - LG-20: Local admin account sign-in - PASSING
   - LG-23: Admin section visibility - **FAILING** (needs fix)

### Pending Sections ⏳
4. **In-Progress/Completed Tests** (`tests/inprogress-completed.spec.js`)
5. **Other generated test stubs** in `tests/generated/`

---

## Detailed Task Breakdown

### Task 1: Fix LG-23 Admin Section Visibility (HIGH PRIORITY)
**File:** `tests/generated/3-1-authentication-landing/.spec.js`

**Problem:** The admin sign-in works (LG-20 passes) but the admin button (`#btnAdmin`) remains hidden after sign-in.

**Root Cause Analysis:**
- `updateAdminUi(user)` is called in `handleSignIn()` at line 1600
- `updateAdminUi` checks `Boolean(user) && isAdminUser()`
- `isAdminUser()` function is NOT defined in the visible code - it must be defined elsewhere or is missing
- The admin profile from `getAdminProfile()` has `isAdmin: true` (line 226)
- But `isAdminUser()` likely checks `me?.isAdmin === true` or similar

**Investigation Needed:**
1. Find where `isAdminUser` is defined (search entire codebase)
2. Check if `me.isAdmin` is properly set after admin sign-in
3. Verify `updateAuthTopbar(getEffectiveAuthUser())` passes a truthy user object

**Potential Fixes:**
- Add `await page.waitForTimeout(1000)` after sign-in before checking button
- Check if `isAdminUser()` needs `me` to be fully initialized
- Verify the admin profile's `isAdmin: true` is being read correctly

**Test Command:**
```bash
npx playwright test tests/generated/3-1-authentication-landing/.spec.js -g "LG-23" --reporter=list
```

---

### Task 2: Implement In-Progress/Completed Tests
**File:** `tests/inprogress-completed.spec.js`

**Requirements:** Based on filename, these test:
- Games persist after reload
- In-progress game from stats

**Approach:**
1. Read existing test file to understand structure
2. Implement tests using seeded profiles
3. Use `seedRegressionProfile` helper for consistent state

---

### Task 3: Implement Remaining Generated Test Stubs
**Directory:** `tests/generated/`

**Files to check:**
- Any `.spec.js` files that are empty or have stubs
- Implement based on test naming conventions

---

### Task 4: Run Full Test Suite & Verify
**Command:**
```bash
npx playwright test --reporter=list
```

**Expected:** All tests pass (or expected skips)

---

### Task 5: Commit & Push Each Section
**Workflow:**
```bash
git add <files>
git commit -m "Descriptive message"
git push origin main
```

---

## Helper Functions Available

### `tests/helpers.js`
- `seedRegressionProfile(page)` - Seeds localStorage with regression profile
- `waitForAppReady(page)` - Waits for `window.__APP_READY__` flag

### Test Constants (from app.js)
```javascript
REGRESSION_TEST_LOGIN = {
  email: 'regression@test.local',
  password: 'Regression123!',
  name: 'Regression QA',
  id: 'local-regression-user-v1'
}

ADMIN_TEST_LOGIN = {
  email: 'admin@test.local',
  password: 'Admin123!',
  name: 'admin',
  id: 'local-admin-user-v1'
}
```

---

## Key Technical Details

### Auto-Login Bypass (Regression Only)
- Only triggers for `local-regression-user-v1` ID
- Sets `isLocalRegressionSession = true`
- Calls `showScreen('menu')` directly
- Does NOT call `updateAdminUi()` - so admin button stays hidden

### Admin Sign-In Flow
- Form-based: fills `#playerEmail`, `#playerPassword`, clicks `#btnSignIn`
- Calls `handleSignIn()` → `isAdminCredentialPair()` → `getAdminProfile()`
- Sets `isLocalAdminSession = true`, `me = adminProfile`
- Calls `updateAuthTopbar(getEffectiveAuthUser())` → `updateAdminUi(user)`
- **Should** show admin button via `adminBtn.hidden = !canSeeAdmin`

### Firebase Interference
- `onAuthStateChanged` fires even for local accounts
- Can override local session state
- Tests should wait for `authMessage` or `greetName` as completion signals

---

## Debugging Commands

### Run Single Test with Debug
```bash
npx playwright test tests/generated/3-1-authentication-landing/.spec.js -g "LG-23" --debug
```

### View Test Artifacts
```bash
# Screenshots and videos in test-results/
ls test-results/
```

### Check App Console Logs
Add to test:
```javascript
page.on('console', msg => console.log('BROWSER:', msg.text()));
```

---

## Next Model Instructions

1. **Start with Task 1** - Fix LG-23 admin visibility
2. **Search for `isAdminUser`** definition in app.js (may be arrow function or const)
3. **Add console logging** to understand why admin button stays hidden
4. **Once LG-23 passes**, commit and push
5. **Move to Task 2** - In-progress/completed tests
6. **Continue through remaining tasks**

### Quick Search for isAdminUser:
```bash
# In terminal
grep -n "isAdminUser" app.js
# Or in VS Code: Ctrl+Shift+F "isAdminUser"
```

---

## Git History Reference
- `b483540` - Seedable Auth tests: LG-18, LG-19, LG-20, LG-23
- `4f5b200` - Previous commit
- Check `git log --oneline -10` for recent history

---

## Environment
- **OS:** Windows 11
- **Shell:** PowerShell
- **Node:** Available via `npx`
- **Playwright:** Installed
- **HTTP Server:** Runs on port 8081 for tests