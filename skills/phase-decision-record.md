# Skill: Generate a Phase Decision Record

## What this skill is for

When the user asks you to "draft a phase decision record" or "create the decision record for Phase N", produce a markdown file named `PHASE{N}_DECISION_RECORD.md` following the exact conventions used in this repo.

A Phase Decision Record locks in scope and acceptance criteria *before* implementation starts. It is the document you (the agent) and any future reviewer read first when working on a phase. Once it is approved, treat it as binding.

## Inputs you need from the user

Before producing the document, make sure you have:

1. **Phase number** — which phase is this?
2. **Scope summary** — one or two sentences. Examples from this repo: *"Deck visibility and profile inspector"*, *"Inactivity timer for non-czar players, czar Next button always enabled"*.
3. **The decisions being locked in** — the user gives you these as a list. Do not invent decisions, do not soften them, do not add extras.
4. **The acceptance criteria** — what specifically must be true for this phase to be considered done?

If anything above is missing, ask the user — do not make it up. A decision record with invented decisions is worse than no decision record at all.

## Output format

Use this exact structure. Match the conventions in `PHASE1_DECISION_RECORD.md` and `PHASE2_DECISION_RECORD.md` in this repo.

```
# Phase {N} Decision Record (Locked)

Date: YYYY-MM-DD
Scope: {one-line scope summary}
Status: Approved and in implementation

## Decisions

1. {Decision title in a single short sentence.}
- {Sub-bullet: what specifically this means.}
- {Sub-bullet: any constraint or boundary that comes with it.}

2. {Next decision...}

## Acceptance Criteria

1. {Criterion area, e.g. "Profile inspector"}
- {Bullet: specific observable behaviour.}
- {Bullet: edge case handled.}

2. {Next criterion area...}

## Regression Policy

- {What gets added to TEST_PLAN.md as a result of this phase, e.g. "Add explicit DE regression cases for owned-hide behaviour."}
```

## Rules

- **Decisions are short and declarative.** Each numbered decision is one short sentence. Sub-bullets add specifics. Do not write paragraphs.
- **No hedging language.** Words like *should*, *may*, *consider*, *ideally* do not belong in a decision record. Decisions are locked. Use *is*, *must*, *does not*.
- **Acceptance criteria are observable.** Each one must be something a person (or an automated test) can check directly. *"Code is clean"* is not a criterion. *"Empty owned state shows a clear call to action"* is.
- **Always include a Regression Policy section.** Even if the policy is just "add cases X, Y, Z to TEST_PLAN under the relevant section." This is what keeps the test plan in sync with the work.
- **Reference `TEST_PLAN.md` by name** when describing what regression cases will be added. The agent doing the work later will read both files together.

## Worked example

The user says:

> "Phase 1, scope is deck visibility and the profile inspector. Decisions: profile inspector is in, purchased decks hidden in store by default with a toggle to reveal, custom packs stay visible. Add regression for both."

Produce:

```
# Phase 1 Decision Record (Locked)

Date: 2026-05-09
Scope: Deck visibility and profile inspector (items 1 and 4)
Status: Approved and in implementation

## Decisions

1. Profile deck inspector is included.
- The profile/stats screen shows all owned decks.
- Each deck is expandable and reveals card texts inside the deck.
- Active deck is indicated in the deck metadata.

2. Purchased decks are hidden in deck store by default.
- Purchased non-custom decks are removed from category list views.
- A user-facing override toggle is provided: Show Owned Decks / Hide Owned Decks.

3. Custom packs remain visible by default.
- Custom packs are not treated as purchased store catalog items.
- Users must keep direct access for equip/delete workflows.

## Acceptance Criteria

1. Profile inspector
- Opening Stats shows an Owned Decks section.
- Expanding a deck reveals its white card texts.
- Empty owned state shows a clear call to action.

2. Deck store filtering
- Purchased non-custom decks are hidden by default after purchase.
- The owned toggle reveals hidden purchased decks and can hide them again.
- Category counts reflect the filtered list currently shown.

## Regression Policy

- Add explicit regression cases in TEST_PLAN for profile deck inspector and store owned-hide behaviour.
```

## How Emil invokes this skill

In a GitHub Issue assigned to Copilot Coding Agent, or in a Copilot Chat prompt in VS Code, write something like:

> *"Using the conventions in `skills/phase-decision-record.md`, generate `PHASE3_DECISION_RECORD.md` for the following decisions: [list of decisions]. Acceptance criteria: [list of criteria]."*

The agent reads this skill file, applies it, produces the document. If anything is missing it will ask, because this skill tells it to.

The same file works with any other agent tool — Claude, Cursor, Aider, Cline — because it is plain markdown. You write the conventions once; every agent you ever use reads them.
