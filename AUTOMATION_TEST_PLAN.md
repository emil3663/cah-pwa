**Automation Test Plan — CAH PWA**

Overview
- Purpose: provide an actionable automation plan that maps the existing `TEST_PLAN.md` to an automated test matrix, with a stability indicator and required changes per test.
- Output: a CSV `test-stability-matrix.csv` (generated) that lists every test, initial stability, and columns for required changes and targeting info.

Legend — Stability indicators
- Stable: deterministic, uses stable selectors, no external services required.
- Moderate: mostly deterministic but depends on timing or non-critical dynamic UI updates; needs small waits or improved selectors.
- Flaky: likely to fail intermittently without extra seeding/mocks; requires test harnessing (localStorage seed, mock backend, or multi-page coordination).
- Blocked: requires backend changes (Firestore rules, server-side features) or multi-client realtime that are not available in the test environment.
- Needs Implementation: placeholder tests generated but not yet implemented.

High-level approach
1. Generate a stability matrix from `TEST_PLAN.md` (script provided at `scripts/generate_test_stability_matrix.js`). The generated CSV defaults every test to `Needs Implementation` so the team can triage and mark stability values.
2. Apply two classes of changes:
   - App test hooks (small additions in `index.html`/`app.js`): add stable IDs for major buttons and an `window.__APP_READY__ = true` signal when initialization completes.
   - Test harness changes (in `tests/helpers.js`): seeding `localStorage` before page load using `page.addInitScript`, and a shared helper for multi-page contexts when needed.
3. Convert generated test stubs to use the helpers and stable selectors. Start with highest-value tests (Phase 3 in-progress/completed flows), then expand coverage.

Per-section targeting + requirements
- 3-1 Session & header: Target: make `#menuBtn`, `#createRoomBtn`, `#joinRoomBtn` stable. Requirement: add IDs and ensure `window.__APP_READY__` after DOM ready. Stability: Moderate → Stable after IDs.
- 3-2 Room management (create/join/lobby): Target: deterministic create/join flows via seeding or URL query param to skip animations. Requirement: add test hooks to allow creating rooms with deterministic codes (or seed `localStorage` to simulate join). Stability: Flaky → Moderate with seeding.
- 3-3 In-game chat: Target: use Playwright multi-page contexts to simulate multiple clients. Requirement: small mocking layer for Firestore realtime or a local mock dispatcher for tests. Stability: Flaky → Moderate after mocks.
- 3-4 Gameplay: Target: stable selectors for play area, drag/drop targets, and judge actions. Requirement: provide test-only fast-path to auto-complete AI actions or seed AI submissions. Stability: Flaky → Moderate with harness.
- 3-5 Game over / Stats: Target: ensure `#completedGames`, `#inProgressGames` are visible and have stable item structure. Requirement: seed `localStorage` for completed/in-progress games, or add test endpoint to mark game finished. Stability: Moderate (current failures indicate unstable selectors).
- 3-6 In-progress/completed recovery (Phase 3): Target: seed `localStorage` or use test hooks to create an in-progress entry and validate resume flow. Requirement: add stable `id`s for `My Stats` button and resume buttons; add small API to create in-progress items via `window.__TEST_SEED__`. Stability: Flaky → Stable after seeding and IDs.
- 3-7 PWA checks (manifest/service worker): Target: static checks (manifest validity) and SW registration; run in headful browser. Requirement: no app changes needed; add small test waits for `navigator.serviceWorker.controller` and assert registration. Stability: Stable.
- 3-8 AI player regression: Target: seed deterministic AI behavior for tests (use test-only flag to make AI deterministic). Requirement: configurable AI seed or canned responses. Stability: Flaky → Moderate after deterministic AI mode.
- 3-9 Deck/economy/store: Target: seed store state in `localStorage` and assert UI rows. Requirement: helper to seed owned decks and wallet. Stability: Moderate.
- Quick-run / smoke tests (7-2): Target: tests that should be very fast; ensure stable selectors and `__APP_READY__` signal. Requirement: minor app IDs and pre-seeded account. Stability: Moderate → Stable after IDs and seeding.

Workflow to implement plan
1. Run: `node scripts/generate_test_stability_matrix.js` — produces `test-stability-matrix.csv` with every test from `TEST_PLAN.md` and `Needs Implementation` as default.
2. Triage: open the CSV and mark stability per test, add required changes per row (IDs, seeding, mocks, or code fix).
3. Implement low-effort app changes (IDs, `__APP_READY__`, tiny test hooks). Commit those.
4. Implement `tests/helpers.js` and update a handful of high-priority tests (Phase 3). Re-run focused tests.
5. Gradually convert generated stubs to real tests using helpers and multi-page contexts where necessary.

Files provided
- `scripts/generate_test_stability_matrix.js` — generator script (node) that creates `test-stability-matrix.csv` from `TEST_PLAN.md`.

Notes
- The generator is intentionally conservative — it extracts test identifiers and lines from `TEST_PLAN.md` and creates rows for triage. Human review is required to assign stability and precise required changes.
- After initial triage, we can incrementally stabilize the suite (start with Phase 3). Commit small app changes alongside tests to keep regression window small.

Next actions (recommended)
- Run the generator, triage Phase 3 tests first, apply app IDs and seed helpers, then implement PR‑01 patch and re-run focused tests.

---
Generated by automation; put into repo root and update as progress is made.
