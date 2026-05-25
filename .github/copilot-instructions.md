# Copilot Instructions for CAH-PWA

This repository is a Cards Against Humanity Progressive Web App. It is developed using an agent-directed methodology: the human (Emil) writes specifications and reviews output; coding agents produce the code.

If you are an AI coding agent (Copilot, Claude, or other) working in this repo, follow these instructions on every task.

## Always do these things

1. **Read `START_HERE.md` and `PROJECT_BRIEF.md` first** for methodology and project goals.
2. **Check the `skills/` folder** before starting any task. If a skill file matches the work being asked (e.g. drafting a decision record, generating a card deck, appending to the test plan), follow that skill's instructions exactly. Skills override your defaults.
3. **Update `TEST_PLAN.md`** as part of any feature work. New features require new regression cases appended to TEST_PLAN before the work is complete.
4. **Bump the service worker cache version** when shipping user-facing changes, so installed PWA clients pull the new version.

## Coding conventions

- Vanilla JavaScript, no build step, no bundler, no package manager.
- All state lives in either `localStorage` (per-device) or Firestore (per-user, cross-device).
- Firestore security rules are in `firestore.rules`. They are intentionally strict — do not relax them without explicit confirmation.
- Mobile-first CSS. Smallest supported viewport is 320px; check layout at that width.
- Flat file structure. New code goes in the existing file that best matches its concern.

## Documentation conventions

- Phase plans → `PHASE_N_PLAN.md`
- Phase decision records → `PHASE_N_DECISION_RECORD.md` (see `skills/phase-decision-record.md`)
- Phase tickets → `PHASE_N_TICKETS.md`
- Test plan additions → append to `TEST_PLAN.md`
- All documents use a header convention: Version, Date, Status.

## Ask before doing

- Any change to `firestore.rules`.
- Any change to the authentication flow.
- Any new third-party dependency (the project has zero today; keep it that way unless explicitly authorized).
- Any rewrite of existing code that is not part of the requested work.

## Do not ask about

- Routine bug fixes within an existing feature.
- Updates to `TEST_PLAN.md` that accompany a feature you are implementing.
- Cache version bumps that accompany user-facing changes.
- Mobile-layout polish.

## PR conventions

- Keep PR descriptions short. Lead with what was done and why.
- List the acceptance criteria from the issue, each marked done or partially done.
- If you discover something unexpected during the work — a bug elsewhere, missing test coverage, an inconsistency — add a "Side observations" section to the PR description. Do **not** silently fix things outside the scope of the issue.
