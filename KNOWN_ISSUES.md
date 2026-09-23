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
but it also means nothing in the existing suite ever exercises this path
with a real service worker present, so the underlying issue was never
visible to it.

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

---

Both are real app defects, not test bugs — see
`examples/comparison-cah-pwa.md` (testforge repo) for the full comparison
context, including how three different test approaches (TestForge's
generated suite, this skill, and this repo's own generated suite) each
reacted differently to the same underlying issues.
