# Known Issues

Real defects found while dogfooding TestForge's `write-playwright-test`
skill against this app (`testforge`'s Phase 25,
`examples/skills/write-playwright-test/cah-pwa/cah-pwa.spec.ts` and
`examples/comparison-cah-pwa.md` — both in the `testforge` repo, since
that's where the run happened). Recorded here, in this repo, so they
surface next time this project is picked up rather than staying
findable only from `testforge`'s side.

## KI-01: Service worker's `controllerchange` reload wipes the sign-in form on first load

**Where:** `index.html:370-371`
**Found by:** `write-playwright-test`'s FINDING comment,
`examples/skills/write-playwright-test/cah-pwa/cah-pwa.spec.ts` (testforge
repo), while writing the sign-in test.

**What happens:** the service worker registration uses the standard
"activate immediately" pattern —
`navigator.serviceWorker.addEventListener('controllerchange', () =>
window.location.reload())`. In a fresh browser context (every
Playwright test's default, and — more importantly — any first-time
visitor's actual first load), the new SW takes control and fires this
reload moments after the page loads. If a real first-time visitor has
already started typing into the sign-in form by then, the reload
silently wipes it with no warning.

**Why it wasn't caught before:** this project's own
`playwright.config.js` already sets `serviceWorkers: 'block'` — a
deliberate, working workaround for the *test suite*, confirmed by
`tests/generated/3-7-pwa/pw-02.spec.js`'s own comment ("Service worker is
blocked by playwright.config.js"). That correctly keeps the suite stable,
but it also means no test in the existing suite exercises this path with a
real service worker present.

**Phase 0 verification (2026-10-10):** An isolated local Chromium probe with
service workers enabled observed two main-frame navigations in a fresh context;
the page was controlled by the worker after navigation, and the final
Performance Navigation entry reported `type: "reload"`. This reproduces the
first-load reload behavior and is consistent with the `controllerchange`
handler above. In a follow-up run, synthetic email and password values entered
before the reload were both empty after it. This confirms the data-loss impact
in local Chromium. Other browsers, deployed behavior, and offline loading were
not verified. The temporary probe was removed and the standard test
configuration was not changed.

**Suggested fix direction (not implemented, just the shape of it):**
either debounce/guard the reload so it doesn't fire over an in-progress
form (e.g. skip the reload if a sign-in field has focus or content), or
show an explicit "Updating…" notice before reloading instead of doing it
silently.

## KI-02: The game-mode radio group is invisible to assistive technology

**Where:** `style.css:170` (`.mode-opt input { display: none; }`),
affecting the three radios at `index.html:159-161`
(Classic/Wild 🔥/Question First ❓).

**Found by:** `write-playwright-test`'s FINDING test (same file as
above), and independently corroborated by TestForge's own generated
suite failing to even locate these elements via `getByRole('radio', ...)`
(`TFFU-030/031/032`, `TFAC-030/031/032` in
`examples/testforge-app/cah-pwa/generated.spec.ts`, testforge repo).

**What happens:** the actual `<input type="radio">` elements are hidden
with `display: none`, which removes them from the accessibility tree
entirely — not just visually hidden, structurally absent from it. The
"selected" look is drawn purely in CSS via `.mode-opt:has(input:checked)`
on the wrapping `<label>`, which carries no `role` or `aria-checked` of
its own. Mouse/touch users see correct behavior (label-click delegates to
the hidden input regardless), so this shipped unnoticed — but a
screen-reader user gets no indication these are radio buttons, or which
one is selected, at all.

**Suggested fix direction (not implemented):** either keep the native
inputs visually hidden but accessible (the standard "visually-hidden, not
`display:none`" pattern — `position: absolute; opacity: 0` with the
custom visual on top, no `display:none`), or add `role="radiogroup"` /
`aria-checked` to the custom control if the native inputs must stay
`display:none` for some other reason.

## KI-03: Legacy Gemini call has no timeout (superseded for selected v1)

**Status:** The timeout defect remains in the existing code, but runtime model
calls are outside the approved v1 scope. Phase 1 is to remove this dependency,
not add timeout/retry behavior. Reassess this issue only if runtime LLM behavior
is approved again.

**Where:** `js/gemini.js:16` (the `fetch` call to the Gemini endpoint,
inside `ask()`); caller `app.js` (`resolveRound()`, the
`ask('praise', ...)` call).

**Found by:** flagged as an aside during Phase 25 dogfooding, while
confirming this app as a viable target (see the testforge repo's
`docs/decisions/phase-25-cah-pwa-dogfooding-backlog.md`, "Aside, not part
of this phase's scope") — not by either skill's FINDING tests, unlike
KI-01/KI-02 above. Verified directly against this repo's current code on
2026-09-23 rather than taken on the original note's word.

**What happens:** `ask()`'s `fetch` call has no `AbortController` or
timeout, and a browser does not time out `fetch()` on its own — a slow or
hung response from the Gemini endpoint leaves the awaited promise pending
indefinitely, with nothing to reject it. The one current caller
(`resolveRound()` in `app.js`) already wraps `ask('praise', ...)` in a
try/catch with a static `WINNER_PRAISES` fallback, so this is narrower
than "uncaught" — most real failures (a 4xx/5xx status, a thrown error)
are already handled reasonably. But `catch` only fires on rejection, never
on a promise that just never settles, so the missing timeout is the one
gap that fallback can't reach: a hung request stalls the round-result
screen (`showScreen('result')` never runs) with no visible error and no
fallback ever triggering. Separately, and lower severity: there's no
retry, so a single transient failure skips straight to the static
fallback instead of getting one quick retry first — worth bundling with
the timeout fix since both touch the same function, not worth its own
ticket.

If runtime LLM behavior is approved again, reassess the timeout requirement
and an appropriate bounded failure policy before restoring this call path.

---

All three are real app defects, not test bugs. KI-01 and KI-02 — see
`examples/comparison-cah-pwa.md` (testforge repo) for the full comparison
context, including how three different test approaches (TestForge's
generated suite, this skill, and this repo's own generated suite) each
reacted differently to the same underlying issues. KI-03 was caught by
direct code review during the same phase, not by any of those three test
approaches — worth noting since it's a real gap none of them happened to
surface either.
