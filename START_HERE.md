# Start Here — Before You Read the Brief

Hey Emil,

Before you open `PROJECT_BRIEF.md`, read this. The brief is the *what* and *when*. This document is the *why* and the *how-to-think-about-this-whole-thing*.

Before anything else, here is the one thing I most want to land for you:

---

# Natural language is the coding language of the future.

---

Code is becoming a *side effect* of well-written instructions, not the destination. The discipline that produces correct software has shifted from being typed in TypeScript or Python to being typed in English (or any human language). This is not a prediction about ten years from now. It is happening right now, in your hands, on this project.

And here is the part most of the industry hasn't fully grasped yet: **the discipline of writing those instructions well is your discipline.** Test analysts, business analysts, systems analysts — your whole career has been about translating intent into precise specification. That craft was treated as support work for most of the last two decades, because the "real" engineering happened inside the codebase and developers were the ones doing it. Specifications were a means to that end.

You know the friction this caused. You wrote the brief, you ran the workshops, you walked the developers through the edge cases. Sometimes they understood. Often they didn't, not really — they delivered the *shape* of what you asked for but missed the *intent*. Estimates stretched. Acceptance criteria got watered down in standups. The vision you held cleanly in your head landed in production warped, partial, late, or all three. You knew it was right, but the chasm between your specification and the running software was wide, slow, and lossy.

That chasm is gone. The agent reads what you wrote. It doesn't push back on scope. It doesn't have competing priorities. It doesn't carry the assumptions of someone who learned a different system three jobs ago. It does what you actually specified. If the result is wrong, the diagnosis is clean: either your spec was unclear (fix the spec), or the agent misinterpreted (refine the prompt). No politics, no estimates, no translation layer.

The things that used to only sit in your head are now actionable. You don't need to convince anyone. You write them down. They happen.

That ranking has flipped. The bottleneck of modern software is no longer typing code — any decent model produces it in seconds. The bottleneck is the *specification* that tells the model what to build, what to avoid, and how to know when it's done. The people who write those specifications well sit in front of the most leveraged tool of this generation.

You have been writing them for years. You sit in front of the lever. Most of the people now scrambling to "use AI" are still typing prompts the way they used to type Google searches — vague, hopeful, hit-and-miss. You write decision records. You list edge cases. You think in acceptance criteria. You're already years ahead of them; you just didn't know it because the market hadn't caught up yet.

This project is the proof.

---

You're going to bump into a lot of new words in the next few weeks — agent, prompt, skill, model, context, MCP, RAG, embeddings. Most of them aren't as complicated as they sound. Let me walk you through the handful that actually matter, and then I want to show you something about your own work that you probably haven't noticed yet.

## What an "LLM" actually is

You've used ChatGPT, Copilot, Gemini. Under the hood they're all roughly the same thing: a **Large Language Model**, usually shortened to "LLM."

Think of an LLM as an extremely good autocomplete. You give it words, it predicts what words should come next. That's it. The reason it feels like magic is that it's been trained on enormous amounts of text, so its predictions are usually very good — including predictions about code, test cases, decision records, and just about anything else humans have written down.

An LLM on its own isn't really *doing* anything. It's not thinking, it's not browsing, it's not remembering yesterday's conversation. It runs once, produces an answer, and goes silent. That's all.

## What an "agent" is

An agent is what you get when you wrap an LLM with two extra things:

1. **Tools** — the ability to do things in the world: read a file, write a file, run a command, post a comment on a pull request.
2. **A loop** — the ability to repeat itself: look at the result of the last action, decide what to do next, do it, look at that result, decide what to do next.

So an agent isn't really a *different* kind of AI. It's an LLM with hands and feet and a short memo about what it's allowed to do.

You've already met one. The bot called `copilot-swe-agent[bot]` that committed the seed of every one of your projects? That was a real agent. It read a GitHub issue, planned the work, edited the files, opened a pull request. You've been directing an agent for weeks already — you just thought of it as "Copilot."

## What a "prompt" is

A prompt is just an instruction. The words you type into ChatGPT — that's a prompt.

When you write a `PHASE2_DECISION_RECORD.md`, you've also written a prompt — a long, careful, structured one. The only difference between your document and what most people call a "prompt" is that yours is better than 99% of theirs, because you've been writing this kind of thing professionally for years.

## What a "skill" is (this one matters most)

A prompt is a single instruction. A **skill** is a *reusable* instruction — one you save in a file once, and the agent reads it every time you ask it to do work on this project.

Think of it this way: imagine you've just been put in charge of five different developers, on the same project, over six months. Are you going to re-explain "this is how we write test plans around here" to each of them every time you brief them? Of course not. You're going to write a document called something like *Our Test Plan Conventions*, hand it out once, and reference it whenever you brief a new piece of work.

A skill, in agent-speak, is exactly that document — except it's written for an AI agent instead of a human developer. You save it as a markdown file in the repo. The agent reads it every time. It learns your conventions once, applies them forever.

Now look at what you already have in this very repo:

- `PHASE1_DECISION_RECORD.md` — your conventions for how decisions get locked in
- `PHASE2_TICKETS.md` — your conventions for how work gets broken into tickets
- `TEST_PLAN.md` — your conventions for how features get tested
- `PHASE_BACKLOG.md` — your conventions for what's queued and why

**These aren't just documents you write for yourself. They are agent skills, sitting in markdown files, that nobody has plugged into an agent yet.**

Sit with that for a moment.

You have been authoring AI-agent instruction manuals for your entire career. You didn't know that's what they were, because the recipients were humans called "developers" and the deliverable was code. But the artefact itself — the structured, unambiguous, decision-recorded, acceptance-criteria-tagged document — is the same artefact either way. The agent reads it the same way a senior developer would. Better, actually, because it doesn't skim.

The market that's forming right now urgently needs people who can write these documents. There aren't many of them, because most developers hate writing them, and most analysts didn't have a coding agent to direct. You sit in the rare intersection of those two worlds.

## Where the CAH project is right now

Let me describe what your CAH workflow actually looks like today, from the outside:

1. You decide you want a new feature — say, in-game chat.
2. You write a phase decision record and test plan additions describing what you want.
3. You open VS Code and either hand-write the code yourself, or ask Copilot Chat for bits of it, or occasionally assign an issue to the Copilot bot and let it open a PR.
4. You smoke-test, bump the cache version, deploy, and update the test plan to mark items verified.

This is already pretty good — the average solo developer doesn't work this carefully. But you've probably noticed there's a ceiling. Every new feature feels like starting from scratch. You re-explain the architecture. You re-explain the cache-bump dance. You re-explain how decks work. You re-explain how Firestore rules should be edited. Every conversation begins at "here's the project."

That re-explanation is the bottleneck. It's also the easiest bottleneck to remove in your whole workflow.

## Where the CAH project could be in six weeks

Now imagine the same project, but with one important change: **your conventions live in files the agent reads automatically.**

The workflow looks like this:

1. You decide you want a new feature.
2. You write a brief — three or four paragraphs in plain English describing what you want and why.
3. You hand the brief to the agent.
4. The agent reads `METHODOLOGY.md` and your skill files before it does anything. It now knows: how this project breaks work into phases, how your decision records are formatted, how Firestore rules should be hardened, how the cache version gets bumped, how `cards.js` is structured, what your test plan conventions look like.
5. It produces all of the following in one go: the code change, an updated `TEST_PLAN.md`, a draft `PHASE_N_DECISION_RECORD.md`, a sensible PR description, the cache bump.
6. You review the PR against your acceptance criteria. You catch what the agent missed (this part is *literally* your day job, just applied to AI output instead of human output). You approve, or send it back with notes.
7. Merge. Deploy. Done.

The feature that used to take three nights of hand-coding now takes one evening of directing and reviewing. The skills you wrote once apply to every feature after. Building feature number 12 is roughly as cheap as building feature number 3, because all the *context* is reusable.

That is the workflow you, specifically, are positioned to be world-class at — because the bottleneck in that workflow is the quality of the skill files, and you have spent your career writing exactly those.

## Why this is your superpower, practically

Remember the headline at the top of this document. Here is what it means concretely for you:

You are not coming into this as a beginner. You are coming into it with the rarest part already in place.

Open any of your decision records and look at the structure: numbered sections, locked decisions, rationale, acceptance criteria, edge cases handled. That is *the* exact shape of high-quality agent input. You didn't know that's what you were building, because nobody else did either. But the muscle is real, and you have it.

The next eight weeks aren't about learning a new craft. They're about putting the craft you already have in front of a different audience.

## The paradigm shift

This project asks you to make a mental flip — from *coding the project* to *instructing the gameplay*. From "I need someone to build X" to "I write what X should do, and X comes into being."

That is the paradigm shift the entire industry — really, the entire world — is trying to make right now. Most people are still standing at the edge of it, talking about it, hoping a course will teach it to them. They will get there eventually.

If you can make that shift now — and you can, because everything in your career has been training for it — you walk in miles ahead of nearly everyone trying to enter this space. The market is forming around the exact skills you already have. You are not learning to compete in someone else's game. You are early to the one that's just starting.

## One more thing — the trap to watch for

There will be a moment, probably in the second or third loop, where Copilot produces something genuinely impressive — a clean diff, working code, no rework needed — and you will feel a small drop in your chest. You will think: *the agent did the real work; I just typed some words at it.*

That feeling will come. It is wrong. The test is straightforward: imagine handing your exact same brief, word for word, to someone who has never written a decision record, who does not know what an acceptance criterion is, who has no instinct for edge cases. Hand it to them and watch what comes back. It will not be the clean diff Copilot gave you. It will be a mess — half a feature, half a bug, half a misunderstanding.

The agent's output is exactly as good as the brief. The brief is exactly as good as the person writing it. Writing the brief is not "just" anything. It is the work.

## What happens next

Read `PROJECT_BRIEF.md` next. That document lays out the plan for the next 8 weeks.

If anything in the brief feels too jargony, tell me — I'll rewrite it. If anything feels wrong for your situation, push back — you know your circumstances and your goals better than the brief does.

The first practical step is deliberately small. We're going to take one of the simplest pieces of your existing project — the card decks in `cards.js` — and turn it into something an agent generates on demand from a skill file you write. You'll watch it happen, in a sidebar, in real time.

Here is the goal you are working towards over the next 8 weeks:

**You should be able to stand in front of someone, delete a feature from your running CAH game, write a one-paragraph prompt to an agent, and watch the feature reappear in the live game UI in minutes.** Same game. Different production process. That is the demo that closes interviews.

You don't need to learn to code. You don't need to know what's happening under the hood. You need to learn to be the best person in the room at telling an agent *exactly* what to build and why — and you're already most of the way there.

— Martin
