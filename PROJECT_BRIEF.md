# CAH-PWA Project Brief

**Version:** 1.0
**Date:** 2026-05-25
**Status:** Draft for Emil's review
**Author:** Martin (with assistant support)

## 1) Background

Emil is repositioning from his long-standing analyst career (software tester, test analyst, systems analyst, business analyst) into a new role he is defining as **Senior AI Agent Director** — a person who scopes, plans, directs, and verifies the work of AI coding agents to produce real software.

This role is forming in the market right now. The shortage is not of people who can run agents — it is of people who can give agents *the right instructions, in the right order, with the right acceptance criteria.* That is exactly the work Emil has been doing for 15+ years; the only thing that has changed is the recipient of the specification.

Emil's existing strengths map cleanly into this role:

- Multi-year experience writing structured specifications, decision records, and test plans
- Habit of breaking work into phased, risk-managed slices
- Strong security and edge-case instincts (already visible in `firestore.rules`)
- Mobile-first, user-centric product judgement

What he is *not*, and does *not need to become*: a hands-on developer. The brief assumes the future of this craft is direction and verification, not code authorship.

## 2) Project Goal

By the end of this project, the Cards Against Humanity PWA *plays* the same as before. The difference is that its behaviour no longer lives in code. **It lives in prompts.**

Every place the old game made a coded decision — the praise message after each round, the way AI opponents pick their cards, the way the Card Czar judges submissions, the way themed decks are generated — has been replaced by a call to a language model with a prompt template. The prompts are short text files. Edit a prompt, play another round, the game behaves differently. No code regeneration, no rebuild, no redeploy. **The prompts are the source.**

The portfolio centrepiece is the demonstration that Emil can stand in front of a recruiter, open a prompt file, change three words, play a round of the game live, and show the new behaviour. Same game UI, completely different production model: **natural language as the runtime, not just the input.**

CAH-PWA is the right vehicle for this transformation because:

- It is already past the toy-demo stage (40 commits, Firebase backend, realtime multiplayer)
- Its current behaviour is full of small, replaceable coded decisions: praise messages, AI player logic, judging heuristics, deck content
- It is still in active development, so the remaining features can be deliberately built under the new methodology
- It is a recognisable product — a hiring manager understands "Cards Against Humanity online" in two seconds, and the contrast of "I rebuilt this so the prompts are the code" is immediately legible

Emil's job over the next 8 weeks is to convert as much of CAH-PWA as possible from code-driven behaviour to prompt-driven behaviour, *and* to package the methodology as a small library of portable, agent-agnostic skills that other practitioners can install and use on their own projects.

Proving this proves he can:

1. Identify code that wants to be a prompt
2. Refactor coded behaviour into prompt + runtime call patterns
3. Direct multiple agent tools through a documented, repeatable methodology
4. Maintain decision records, phase plans, and test plans that make the work auditable
5. Build reusable, portable skills that compound across features and across projects
6. Ship and operate a real product (auth, realtime, mobile UX, deployment)

## 3) Constraints

### 3.1 Budget
- **Sponsored:** GitHub Copilot (individual)
- **Out of scope:** Paid Claude, paid Cursor, paid OpenAI subscriptions
- All other tooling must be free, free-tier, or open-source

### 3.2 Hardware
- Working laptop, unknown but assume modest specs
- Local model use (Gemma, Llama via Ollama) is **deferred**, not rejected — pending a one-evening feasibility test (see Section 9)

### 3.3 Time
- Emil is currently between roles and has full-time availability
- Target a public-ready portfolio milestone in **8 weeks**

## 4) Toolkit

There are two distinct model surfaces in this project, and it's important not to conflate them:

- The **dev agent** — what Emil uses inside VS Code to write code, prompts, and skill files.
- The **runtime model** — what the *running game* calls in the browser at the moments where coded behaviour used to sit.

### 4.1 Dev agent: GitHub Copilot in VS Code (already in use, sponsored)
Emil is already directing **Copilot Chat** and **Copilot Agent Mode** in VS Code. Both provide a sidebar where the agent's reads, plans, and proposed edits are visible step by step. No setup needed; no change to his existing workflow. This is sufficient for the first loops.

### 4.2 Runtime model: Gemini Flash via direct browser call (new)
The CAH game itself calls **Gemini Flash** from the browser at runtime, using prompt templates stored in the `prompts/` directory. This is what produces the live, prompt-driven behaviour. Setup is a single API key from Google AI Studio (free tier, ~1,500 requests/day — far more than a game needs). Covered in `GETTING_STARTED.md` Phase 0.

### 4.3 Autonomous dev mode: GitHub Copilot Coding Agent on GitHub (sponsored)
For features Emil trusts without watching, he can convert a brief into a GitHub Issue and assign it to Copilot Coding Agent. The bot opens a PR. Lower visibility, full autonomy. Used as a graduation mode once enough loops have been run in-editor.

### 4.4 Upgrade path: Cline + Gemini Pro (optional, free)
If Copilot's model choices or quotas ever become limiting, Cline (a free VS Code extension) pointed at Gemini Pro via Google AI Studio gives more headroom and finer model control. Install on the day he needs it, not before.

### 4.5 Deferred
- Local LLMs (Gemma, Llama via Ollama) — pending hardware feasibility test
- Anthropic Claude (Claude Code, Claude API) — out of budget. Would offer the deepest skill/MCP integration; revisit when budget allows.

## 5) Methodology

Emil's existing analyst practice already *is* the methodology. The only change is that the recipient of the specification is now a coding agent, not a developer.

### 5.1 Feature lifecycle
For every new feature, the primary loop runs in **visibility mode** (Cline):

1. **Phase plan** — `PHASE_N_PLAN.md`. Goal, scope, non-goals, risks, exit criteria.
2. **Decision record** — `PHASE_N_DECISION_RECORD.md`. Locked decisions and rationale *before* any code or prompts are produced.
3. **Test plan addendum** — new cases appended to `TEST_PLAN.md` *before* the work starts.
4. **Brief in plain English** — three to five sentences describing the work, the target files, and the acceptance criteria.
5. **Hand to Cline** — paste the brief into Cline's input box. Watch every step in the sidebar. Approve or reject each diff as it's proposed. (This is where Emil's QA instinct lives — agents are confident, sometimes confidently wrong, and his job is to catch that *while* it's happening.)
6. **Local smoke** — open the running app, play a round, confirm the new behaviour is what was specified.
7. **Commit, push, deploy** — review the staged diff in VS Code's Source Control panel, commit with a descriptive message.

For features Emil has confidence in — variants of work he's done before — the same shape can be run in **autonomous mode** (GitHub Copilot Coding Agent): convert the brief into a GitHub Issue, assign Copilot, review the resulting PR. Same lifecycle, less visibility, less hands-on. Use this once trust in the methodology is established.

### 5.2 Reusable agent skills
A senior agent director is recognised by their **skill library** — reusable instructions that compound across features. The skill files split into two categories:

**Portable, agent-agnostic, publishable:**
- `skills/runtime-prompt-replacement.md` — the cornerstone. Find a hardcoded behaviour in any codebase, replace it with a prompt + runtime call pattern.
- `skills/prompt-template-format.md` — how to structure runtime prompts so they remain editable, debuggable, and version-controllable.
- `skills/llm-fallback-pattern.md` — graceful degradation when LLM calls fail at runtime.
- `skills/phase-decision-record.md` — how to lock scope before work starts. *(Already in the repo as a worked example.)*

**Project-specific:**
- `.github/copilot-instructions.md` — repo-wide instructions any agent reads automatically. *(Already in the repo.)*
- `skills/cah-feature.md` — how to structure a new CAH game feature end-to-end.
- `skills/cah-test-plan.md` — how to append to `TEST_PLAN.md` for any new feature.

The portable skills are the *second portfolio piece* (see §6.2). They are designed to install and run on any agent platform that ingests markdown skills — Claude Code, Cline, Open WebUI, Cursor — without modification. "I shipped 12 prompt-driven features using 4 portable skills I authored, and the skills work on any project" is a statement a hiring manager understands immediately.

## 6) Deliverables (8-week milestone)

### 6.1 Inside the repo
1. CAH-PWA shipped publicly on GitHub Pages with at least four major behaviours driven by **runtime prompts** instead of code: praise messages, AI player personalities, Czar judging, and deck generation. Each behaviour swap is its own feature loop.
2. A `prompts/` directory containing the runtime prompt templates — the new source of the game's behaviour. Each prompt file is short, single-purpose, and editable without touching code.
3. A complete `PHASE_N_PLAN.md` and `PHASE_N_DECISION_RECORD.md` for every phase up to v1.0.
4. A complete `TEST_PLAN.md` covering every shipped feature, with explicit acceptance criteria including LLM-fallback behaviour.
5. `SMOKE_TEST.md` runnable in under 15 minutes.
6. `METHODOLOGY.md` — Emil's full process, written so a recruiter or hiring manager can read it cold and understand what he does.
7. `README.md` rewritten — top half sells the methodology and the runtime-prompts thesis, bottom half describes the game. Hiring managers land here first.

### 6.2 Portable skill library (the second portfolio piece)
A small set of agent-agnostic skill files, each in markdown with a defined structure, each *publishable* on its own. Cornerstone:

- **`skills/runtime-prompt-replacement.md`** — the methodology in a file. Given any codebase, identify a coded behaviour, replace it with a prompt + runtime call. Battle-tested by reuse on at least three CAH features.

Plus supporting skills as they emerge during the work (`prompt-template-format.md`, `llm-fallback-pattern.md`, etc.). Each skill is designed to install and run on any agent platform that ingests markdown — Claude Code, Cline, Open WebUI, Cursor — without modification.

This library is the artefact that distinguishes a Senior AI Agent Director from "someone who used AI to build an app." The files are publishable on GitHub, installable in any compatible agent platform, and reusable on any future project Emil takes on.

### 6.3 Career artefacts (outside the repo)
1. **LinkedIn rewrite** — headline and About section repositioning as Senior AI Agent Director, with CAH-PWA as the worked example.
2. **Three short writeups** (LinkedIn articles or a personal blog):
   - "How I directed an agent to build a multiplayer game without writing code"
   - "Test plans for the agent age: making QA discipline scale"
   - "Phase decision records as agent instructions: why specs are the new code"
3. **One 5-minute video walkthrough** of a single feature end-to-end: brief → issue → Copilot PR → review → merge. This is the single most-shareable artefact in the whole package.

## 7) Success Criteria

The milestone is met when *all* of the following are true:

1. CAH-PWA is publicly playable end-to-end on mobile and desktop with no open critical bugs.
2. Every feature in v1.0 has a phase plan, decision record, and test plan entry that pre-dates its implementation.
3. At least three reusable agent skills exist in the repo and have each been used to produce at least one feature.
4. The repo `README.md` sells the methodology, not the game.
5. **The live regeneration demo.** Emil can stand in front of a recruiter, delete any single feature from the running app, write a one-paragraph prompt in Cline, and watch the feature reappear in the running game in under 10 minutes. This is the artefact that closes interviews.
6. The career artefacts (LinkedIn, three writeups, video) are live and linked from the repo README.

## 8) Sequencing

| Week | Focus |
|---|---|
| 1 | Stand up the new workflow: repo housekeeping, draft skill files, draft `METHODOLOGY.md`. Run one small feature end-to-end as a dry run of the methodology. |
| 2 | Finish a Phase 2/3 feature using the full workflow. Refine skill files as patterns emerge. |
| 3 | Finish remaining Phase 2/3 features under the workflow. Skill files stabilise. |
| 4 | Polish: bug burn-down, mobile UX pass, security rules review, smoke pack pass. |
| 5 | Rewrite `README.md` and LinkedIn. Polish `METHODOLOGY.md`. |
| 6 | Draft and publish the three writeups. |
| 7 | Record and edit the 5-minute video walkthrough. |
| 8 | Soft launch: post on LinkedIn, share with first 10 contacts for feedback, iterate. |

## 9) Open Questions

1. **Target market** — which geography/job market is Emil aiming at? Affects platform choice (LinkedIn vs. Wellfound vs. local boards) and English-vs-Dutch framing of the writeups.
2. **Job vs. freelance** — is the goal full-time employment, freelance contracts, or both? Affects whether the portfolio leans employer-polish or pitch-polish.
3. **Hardware feasibility** — can his laptop run a 7–8B quantised model via Ollama at usable speeds? A one-evening test would settle the local-model question for good.
4. **Personal site** — does Emil want a personal domain to host the methodology writeups, or do we lean entirely on GitHub + LinkedIn?
5. **First skill to build** — which of the four skills in Section 5.2 should be authored first? Recommendation: `cah-deck.md`, because it has the smallest blast radius (just `cards.js`), the most obvious value (a 3-hour task becomes a 30-second one), and produces the most visually demo-able output.

## 10) Deferred decisions

These were considered for the 8-week scope and intentionally parked. Re-open them only after the methodology is proven and there is bandwidth.

### 10.1 Replacing Firebase as the backend
Pocketbase, Supabase, or Firebase Local Emulator are all real options. They add migration burden during the most important phase of the project, and the Firebase free tier is adequate for a portfolio-stage app. **Park until v1.0 ships.**

### 10.2 Custom MCP (Model Context Protocol) server
A local MCP server that exposes project context to agents is an excellent advanced portfolio piece. It is also a significant project in its own right and depends on MCP-aware agent tooling that Copilot only partially supports today. **Park until the standard workflow is comfortable and there is a clear use case the existing tools can't already cover.**

### 10.3 Local LLMs (Gemma, Llama via Ollama)
Pending hardware feasibility test (see 9.3). Even if feasible, defer adoption until the Copilot-driven workflow is stable. Switching models mid-stride creates noise without learning.

## 11) Why this brief, in one paragraph

The market for "AI Agent Director" roles is going to grow faster than the supply of people who can credibly fill them. The bottleneck is not technical access to agents — anyone can install Copilot. The bottleneck is the *analyst discipline* that turns a vague intention into a specification an agent can execute, a test plan that catches what the agent misses, and a phased plan that keeps the work shippable. Emil already has that discipline from 15 years of professional practice. This project is the artefact that proves it.
