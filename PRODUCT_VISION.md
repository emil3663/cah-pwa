# Product Vision: CAH-PWA + The Portable Skill Library

**Version:** 1.0
**Date:** 2026-05-25
**Status:** Vision locked

## 1) What you see when it's done

Open Cards Against Humanity in any browser. The game plays the same as it always did — multiplayer, mobile-friendly, fast, irreverent. You sign in, create a room, drop in a few AI opponents, deal a hand, play a black card, watch the Card Czar judge.

But the game's *behaviour* — the parts that used to live in code — now lives in a directory called `prompts/`. Each prompt is a short, plain-English text file. Edit any of them, refresh the game, play another round. The behaviour shifts immediately.

- `prompts/praise.txt` — the prompt that produces the one-liner roast of the winning combo after each round.
- `prompts/skeeter.txt` — the AI personality file for Skeeter the Spicy. Edit a few words; he gets even spicier. Or sweeter. Or alliterative.
- `prompts/czar.txt` — how the AI Card Czar judges submissions when it's their turn.
- `prompts/deck.txt` — how new themed decks are generated. Type a theme into the in-game deck creator; the LLM produces the cards on the fly.
- `prompts/game-summary.txt` — the closing recap at the end of a match.

The code that wires these up is intentionally thin. The intelligence of the game lives in the prompts.

## 2) The demo

In a video call with a recruiter, Emil shares his screen. He plays a round of CAH. Wins it. The game roasts him in tongue-in-cheek style. He opens `prompts/praise.txt`, changes one phrase, refreshes, plays another round. The game roasts him in Shakespearean iambic pentameter. He does it again with "noir detective".

*"This is what I do,"* he says. *"I take projects whose behaviour lives in code, and I move that behaviour into prompts. The code becomes glue. The behaviour becomes English. Editable, testable, ownable by anyone who can write a clear instruction — which has always been the analysts, the QA people, the business stakeholders. Me."*

Then he opens the `skills/` folder. *"And this is the methodology, packaged. These markdown files install in any agent platform — Claude Code, Open WebUI, Cline, Cursor. Anyone can pick them up and apply the same pattern to their own codebase. The first one, `runtime-prompt-replacement.md`, is what produced everything you just saw."*

## 3) The two artefacts

The portfolio produces two complementary, public deliverables:

### 3.1 CAH-PWA — the worked example
A real, playable, multiplayer game whose behaviour is prompt-driven. The proof that the methodology produces real software in a recognisable product. Visible at `https://emil3663.github.io/cah-pwa/`.

### 3.2 The portable skill library — the productised methodology
A small set of agent-agnostic markdown skill files that document the patterns. Each one is publishable on its own, installable in any agent platform that reads markdown skills. The cornerstone is `runtime-prompt-replacement.md`, supported by `prompt-template-format.md`, `llm-fallback-pattern.md`, and `phase-decision-record.md`.

The first artefact proves Emil can do the work. The second proves the methodology generalises beyond CAH. Together they make him a Senior AI Agent Director, not just *"someone who built a chatty game."*

## 4) The story Emil tells

For most of his career, Emil has been writing the specifications that developers read. Test plans. Phase decision records. Business requirements. He has been authoring instructions for intelligent agents to act on his entire career — only the agents were human, and the instructions were Word documents and Jira tickets.

The end state of this project is the proof that the same discipline, applied to AI agents instead of human developers, produces real software faster, more transparently, and more flexibly than the old way. The bottleneck has shifted. The skill that used to be treated as support work — writing the specification — is now the load-bearing skill of the practice.

Emil did not start this project as a developer. He does not end it as one either. He ends it as a Senior AI Agent Director with a working portfolio and a publishable methodology.

## 5) The architecture, in one paragraph

A thin JavaScript helper called `ask(promptName, vars)` reads a prompt template from `prompts/`, substitutes variables, calls Gemini Flash, returns the response. Every place the original game made a coded behavioural decision — picking praise, scoring submissions, generating cards — calls `ask()` with the appropriate prompt name. Every call has a fallback to the original coded behaviour, so the game never breaks if the LLM is unavailable. The prompts are the source of behaviour; the code is the glue.

## 6) What success looks like 8 weeks in

- CAH-PWA is publicly playable on `https://emil3663.github.io/cah-pwa/`.
- At least four major game behaviours (praise messages, AI player personalities, Czar judging, deck generation) run on runtime prompts rather than coded logic.
- The `prompts/` folder contains the runtime prompts as plain text — the "source code" of the game's behaviour.
- The `skills/` folder contains at least four agent-agnostic markdown skill files, each independently publishable.
- `README.md` opens by selling the methodology and the runtime-prompts thesis. The game description is below.
- `METHODOLOGY.md` walks the entire practice end to end.
- Three short writeups (LinkedIn or personal blog) explain the approach to a general audience.
- A 5-minute video shows the live demo: edit a prompt, refresh, observe the game's behaviour change.
- LinkedIn is rewritten to match the new positioning.
- Emil can walk into a 30-minute interview, share his screen, and run the demo without notes.

The players see the same game. Everything else underneath has moved from code to English. **That is the product.**
