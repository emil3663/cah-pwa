# CAH-PWA

**A browser-based party game for casual play among friends, documented as a
portfolio example of product analysis, quality engineering, and agent-directed
delivery.**

Live: **https://emil3663.github.io/cah-pwa/**

The selected v1 direction is a constrained, playable, non-LLM product and a
portfolio demonstration of its analysis and QA delivery. The current code still
contains a legacy runtime prompt path for round-winner praise; retiring it and
aligning the implementation with the selected direction remain planned work.
The current release boundary is a deployed GitHub Pages app with real-account,
two-client Firebase multiplayer, member/role-based room and chat authorization,
and an installable PWA with offline app-shell loading. Multiplayer requires a
network connection.

The earlier prompt-driven thesis is preserved as historical context in
`PROJECT_BRIEF.md` and `PRODUCT_VISION.md`; it is not the current v1 scope.

---

## Backend and security

- **Firebase Authentication** with **Firestore** realtime multiplayer
- Room state moved off local storage into backend state, with real-time round and
  submission sync, and reconciliation logic that prevents duplicate writes
- **Firestore security rules** (`firestore.rules`) restrict user profile access
  to the authenticated owner and deny unlisted collections. Current room and
  chat rules still allow any authenticated user to read and write those
  documents; member/role-based authorization is a pre-public-release gate and
  has not yet been implemented or verified.
- Progressive web app: `manifest.json` and a service worker, installable on mobile
- Deployed by GitHub Actions (`.github/workflows/deploy-pages.yml`)

---

## How this was built

Specification before implementation, on every phase. The documents in this
repository are the record, not a write-up produced afterwards:

| Document | What it is |
|---|---|
| `PROJECT_BRIEF.md`, `PRODUCT_VISION.md` | Historical runtime-prompt direction; superseded for v1 |
| `PHASE0_PLAN.md`, `PHASE0_BASELINE.md`, `PHASE0_DECISION_RECORD.md` | Approved v1 direction and roadmap proposal, evidence baseline, and Phase 0 decisions |
| `PHASE1_DECISION_RECORD.md`, `PHASE2_DECISION_RECORD.md` | Scope and acceptance criteria locked before building each phase |
| `PHASE2_RESULT_SYNC.md` | The amendment record — see below |
| `PHASE_BACKLOG.md`, `PHASE1_TICKETS.md`, `PHASE2_TICKETS.md` | Tickets with scope, deliverables, observable acceptance criteria and explicit dependencies |
| `TASK_BREAKDOWN.md`, `TASK_BREAKDOWN_V2.md` | Work decomposition, with the revision kept rather than overwritten |
| `TEST_PLAN.md` | ID-coded manual test cases by area |
| `AUTOMATION_TEST_PLAN.md` | The automation matrix and per-test stability rating |
| `CONTENT_LICENCE_DECISION.md` | The content, attribution and naming position |
| `skills/` | Four reusable patterns extracted from the build |

**The amendment record is the one worth opening.** Mid-implementation in Phase 2
it became clear that the result-sync design would force every player forward at a
single pace — the host's pace — which would be jarring for everyone else. Rather
than patching around it, the design was amended, and the amendment got its own
decision record with its own acceptance criteria. `PHASE2_RESULT_SYNC.md` is that
document. It is a small thing, and it is the most representative artefact here.

---

## Testing

Read `tests/README.md` before drawing conclusions from the size of the test tree.

In the latest local run, the repository contained **235 Playwright spec files**:
37 tests passed, 225 were skipped, and none failed. All specs are under
`tests/generated/`; the passing set includes generated-section regression specs
and skipped scaffolds. The skipped total includes 33 malformed entries
generated from Markdown table headings/separators, so it does not equal the
number of distinct planned cases. See `tests/README.md` and `PHASE0_BASELINE.md`
for coverage limits and test-path details.

The test generator and stability matrix are planning aids, not proof of
coverage. The current stability-matrix generator defaults every row to
"Needs Implementation" and does not currently assess test stability.

---

## Running it locally

```bash
npm install
npx playwright test          # run the suite; generated scaffolds are skipped
```

The app itself is static — serve the repository root, or use the live URL above.
Firebase configuration is required for multiplayer; single-player against AI
opponents works without it.

---

## Attribution and licensing

The card content in this project comes from the
[json-against-humanity](https://github.com/crhallberg/json-against-humanity)
dataset, which packages Cards Against Humanity content released by Cards Against
Humanity LLC under a **Creative Commons BY-NC-SA** licence. That content remains
under its original terms, and this project is non-commercial.

The original code in this repository — the application, the prompt architecture,
the Firestore data and security model, the test tooling and all project
documentation — is released under the **MIT Licence**. See `LICENSE`.

This is a personal, non-commercial project. It is not affiliated with, endorsed
by, or sponsored by Cards Against Humanity LLC. The reasoning behind this position
is recorded in `CONTENT_LICENCE_DECISION.md`.

---

Part of a portfolio of AI-directed projects — see
[github.com/emil3663](https://github.com/emil3663).
