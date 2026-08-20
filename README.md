# CAH-PWA

**A multiplayer party game where the behaviour lives in prompt files, not in code.**

Live: **https://emil3663.github.io/cah-pwa/**

Every point where the system used to make a coded decision — how an AI opponent
chooses a card, how the Card Czar judges a round, how a themed deck gets
generated — is now a call to a language model against a designed prompt, with a
structured fallback to coded behaviour when the model call fails.

The game is the vehicle. The interesting property is that behaviour became
**editable and evaluable without touching the application**: change a prompt file,
change how an opponent plays. That is the same separation that makes AI systems
testable, and it is why this project exists.

---

## The prompt architecture

Prompts live in `prompts/` as editable files rather than as string literals in
the application. Each one covers a decision the system used to make in code:

- **Opponent strategy** — how an AI player picks from its hand, given the prompt
  card and its own personality
- **Judging** — how the Card Czar chooses a winner from the submitted answers
- **Deck generation** — producing themed card content on demand
- **Response text** — the dynamic commentary around a round

Every call has a **structured fallback**. If the model is unavailable, returns
malformed output, or times out, the coded behaviour takes over and the game
continues. A game that stalls because a model call failed is not a game, and the
fallback path is treated as a first-class requirement rather than error handling.

Four reusable patterns extracted from this work are documented in `skills/`:
`llm-fallback-pattern`, `runtime-prompt-replacement`, `prompt-template-format`
and `phase-decision-record`.

---

## Backend and security

- **Firebase Authentication** with **Firestore** realtime multiplayer
- Room state moved off local storage into backend state, with real-time round and
  submission sync, and reconciliation logic that prevents duplicate writes
- **Firestore security rules** (`firestore.rules`) restrict user documents to the
  authenticated owner and deny all other collections by default — verified by
  cross-account read and write testing, not by inspection
- Progressive web app: `manifest.json` and a service worker, installable on mobile
- Deployed by GitHub Actions (`.github/workflows/deploy-pages.yml`)

---

## How this was built

Specification before implementation, on every phase. The documents in this
repository are the record, not a write-up produced afterwards:

| Document | What it is |
|---|---|
| `PROJECT_BRIEF.md`, `PRODUCT_VISION.md` | What the thing is and why |
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

In short: the repository contains **229 Playwright spec files, of which 228 are
generated scaffolds** produced from `TEST_PLAN.md` by
`scripts/generate_playwright_tests.js` — one file per test-case ID, ready for
implementation. 225 of them currently call `test.skip()`. One file,
`tests/inprogress-completed.spec.js`, is implemented: 4 tests, 13 assertions.

The generator is the point. A test plan mechanically expanded into a spec tree
that maps one-to-one onto its case IDs means coverage can be tracked against the
plan rather than guessed at. `scripts/generate_test_stability_matrix.js` produces
the stability matrix as CSV — every case rated stable, moderate, flaky, blocked or
needs-implementation, so the flaky ones get app test hooks rather than retries.

Implementation of the scaffolds is in progress, critical path first.

---

## Running it locally

```bash
npm install
npx playwright test          # run the implemented specs
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
