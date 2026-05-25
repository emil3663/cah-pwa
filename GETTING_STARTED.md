# Getting Started

You don't need to do anything ambitious yet. The goal is **one full loop** of the agent-direction workflow — see an agent do real work on this project end-to-end, understand what happened, and refine the methodology so the next loop is better. Once you've done it once, the rest of this project is repetition.

Work through the phases below at your own pace. There are no fixed days. If you do it all in a single weekend, fine. If it takes you a couple of weeks, also fine. The phases matter; the calendar doesn't.

## Phase 0 — Confirm your view

The "view" is where the wow lands: your CAH game, running in a browser, showing prompt-driven behaviour in the cards and messages in front of you. You need this view working end to end before you start changing anything — there's no point editing prompts if you can't watch them take effect.

### Run the game locally
1. Open a terminal in the `cah-pwa` folder.
2. Run `python3 -m http.server 8000`.
3. Open `http://localhost:8000` in your browser.
4. Sign in, create a room, start a quick game, play one round.
5. If everything works, your view is ready.

If the local game can't connect to Firebase or behaves differently from the deployed version, fix that first. Without a working local game, you have nowhere to see your prompts land.

### Get a Gemini API key
The runtime prompts you'll write get sent to Gemini Flash from inside the running game. You need a free API key.

1. Open https://aistudio.google.com in a browser.
2. Sign in with a Google account.
3. Click **Get API key** → **Create API key in new project**.
4. Copy the key and keep it somewhere safe. You'll paste it into the game's code in Phase 4.

### About your dev agent
You're already directing **GitHub Copilot** in VS Code — Copilot Chat and Copilot Agent Mode. That's the agent you'll use for the development work in Phases 2 and 4. Keep using what you know.

If at some point Copilot's quotas tighten or you want to experiment with different models, **Cline** (a free VS Code extension pointed at Gemini Pro on the same Google AI Studio account) is the upgrade path. Not required to start; install the day you need it.

**Take a pause and reflect before moving on.** You can run the game. You have a Gemini key. You know which agent you're directing. That's the whole setup — the rest of this onboarding is about *what to do with it*.

## Phase 1 — Get oriented

Read, in this order:

1. `START_HERE.md` — what LLMs, agents, prompts, and skills actually are, in plain English.
2. `PROJECT_BRIEF.md` — the 8-week plan, what success looks like, and what's been deliberately deferred and why.

Then watch some short demos so you can *see* this style of work in practice before you try it yourself. The most useful YouTube searches (Martin may also send you specific links):

- **"GitHub Copilot coding agent demo"** — the exact tool you will be using. Look for one where a human assigns a GitHub Issue and the bot opens a pull request without anyone writing code.
- **"Claude Code skills demo"** or **"Anthropic Claude Code walkthrough"** — you do not have Claude in your toolkit yet, but Claude is the most skill-native agent right now, and watching one in action makes the *concept* of skills click in a way that reading about it can't. Anthropic's own demos are the best ones.
- **"Cursor agent mode walkthrough"** — another popular agent tool. Useful for seeing the "AI does work in my codebase" pattern in different hands.
- **"MCP Model Context Protocol demo"** — for the bigger picture of where this whole field is heading. Don't worry if a lot of it goes over your head on the first watch.

Finally, open `skills/phase-decision-record.md` and put it side by side with `PHASE1_DECISION_RECORD.md`. Convince yourself that the skill file is just a description of the document you already write — the same words, reframed as instructions for an agent instead of as a record for yourself.

**Take a pause here and reflect to make sure you understand this before moving on.** The next phase has you doing the work, not reading about it. If anything about the methodology, the skills concept, or the workflow still feels foggy, sit with it — or ask Martin — before you continue. Going slower at this step saves time at every later one.

## Phase 2 — Author your first skill

Your first authored skill is `skills/runtime-prompt-replacement.md` — a portable, agent-agnostic instruction set that teaches any agent how to take a piece of hardcoded behaviour in a codebase and replace it with a runtime call to a language model.

This is the **cornerstone** skill. You will reuse it many times over the next 8 weeks — first for the praise messages, then for AI players, then for the Card Czar, then for deck generation. Each reuse refines it. By loop four it will be the first publishable file in your portable library.

Use `skills/phase-decision-record.md` as your structural template. Copy its sections one by one:

- What this skill is for
- Inputs you need from the user (target file, target behaviour, acceptance criteria)
- Output format — describe the three artefacts the skill produces: (a) a new `prompts/<name>.txt` template file, (b) a single JS helper `ask()` in `js/gemini.js` (if it doesn't exist yet), (c) the call-site swap in the target file, plus a fallback to the existing coded behaviour
- Rules — keep prompts short, always include a fallback path, store the API key as a constant for now, document the prompt's input variables in a comment block
- Worked example — show the praise-message replacement end to end
- How Emil invokes this skill — what to type into Cline

A first draft is fine. You will refine the skill as you use it. Don't be precious — the skill is a living file, not a contract.

## Phase 3 — Pick a feature and write a brief

The first feature is deliberately small so the first loop lands cleanly: **replace the 12 hardcoded praise messages with a live call to Gemini**. After a player wins a round, the game will call Gemini Flash with a short prompt and show a fresh, custom one-liner each time. If the API call fails, the game falls back to the old hardcoded array — so there's no risk of breaking gameplay.

Why this feature first:

- Single-purpose, visible to the player every round, low stakes
- Tiny code change — a new prompt file, a small helper, a one-line swap in `app.js`
- The wow moment is immediate: play a round, see a fresh AI-generated praise. Edit the prompt file, play another round, see the new tone.

Write a brief in plain English — three to five sentences describing what you want and why. Save it as a scratch markdown file in the repo. This is just for you to think clearly before you talk to the agent.

## Phase 4 — Hand the brief to your dev agent and watch it work

Open your dev agent in VS Code — Copilot Agent Mode (default) or Cline if you've set it up. In the input box, paste a prompt like:

> "Read `skills/runtime-prompt-replacement.md` and apply it to the praise messages in this CAH-PWA codebase. Specifically:
>
> 1. Create `prompts/praise.txt` containing a Gemini prompt template with `{{black}}` and `{{whites}}` placeholders. The prompt should produce a short, tongue-in-cheek roast of the winning combo — one sentence, dry humour.
> 2. Create `js/gemini.js` with a single async function `ask(promptName, vars)` that reads the prompt template from `prompts/<promptName>.txt`, substitutes `{{key}}` placeholders with values from `vars`, calls the Gemini Flash API directly from the browser (use `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`), and returns the response text. Hardcode the API key as a `const` at the top of the file with a comment that says `// demo key, restricted at the API provider`. Wrap the call in try/catch — on any failure, throw the error up to the caller.
> 3. In `app.js`, at the place where the praise message is currently picked from `CAH_PRAISE_MESSAGES`, replace it with `await ask('praise', { black, whites })`. Wrap in try/catch that falls back to the existing random-pick from the array on any failure.
> 4. Append a new regression case to `TEST_PLAN.md` confirming (a) the praise is freshly generated each round when the API is reachable, and (b) the fallback to `CAH_PRAISE_MESSAGES` works when the API is unavailable (test by setting the API key to an empty string)."

Hit go. **Don't walk away.** Watch the sidebar:

- The agent reads `skills/runtime-prompt-replacement.md`. You'll see the skill in the sidebar.
- The agent reads `app.js` and finds where the praise message is currently chosen.
- The agent announces a plan — three new files / edits, in order.
- The agent proposes each edit. You see the diff before it's applied, and you approve each change.
- The agent updates `TEST_PLAN.md` the same way.

You are doing two things at once: *running* the loop, and *learning* by watching. Pay attention to what the agent does that you didn't expect. Pay attention to what it doesn't do that you assumed it would. That is the raw material for refining the skill file you wrote in Phase 2.

When the agent finishes, **paste your Gemini API key into the constant in `js/gemini.js`** (the agent left it blank or templated). Then serve the app locally with `python3 -m http.server 8000` and open `http://localhost:8000`. Start a game, play a round, win it. Watch the praise message — it has been generated *live*, for *this round*, for *this winning combo*.

Now open `prompts/praise.txt`. Change "tongue-in-cheek" to "Shakespearean iambic pentameter". Save. Refresh the game. Play another round.

**That is the wow moment.** The game's behaviour now lives in a text file. You just changed how the game behaves without touching any code.

## Phase 5 — Commit and retrospect

When you're happy with what Cline produced:

1. Open the Source Control panel in VS Code (Git icon on the left sidebar).
2. Review the staged diff one more time.
3. Stage the changes, write a commit message, commit, push.

Then write 5–10 lines in a new file `RETRO_FIRST_LOOP.md`:

- What worked.
- What was clunky.
- What you'd change about the `runtime-prompt-replacement.md` skill file you wrote in Phase 2.
- What your dev agent did that surprised you, in either direction.
- Which words in `prompts/praise.txt` had the most leverage on the game's tone? (This insight directly informs your future prompts.)

That retro is the most valuable artefact you'll produce in this whole onboarding, because it becomes the input to every loop after. Every skill file gets refined as you use it. That is normal and good.

## If you get stuck

- **Copilot is slow or fails on the issue.** Simplify the brief and try again. Briefs are too vague far more often than they are too specific.
- **You don't know what to write in the skill file.** Open `skills/phase-decision-record.md` and copy the structure section by section. Substitute deck-related content where it talks about decision records. The form is what matters most — the content will follow.
- **You're not sure if the output is "right".** It is right if it meets the acceptance criteria you wrote in the Issue. If you missed a criterion that turns out to matter, add it to the next Issue. Don't try to write perfect briefs — write briefs that improve every loop.

**Done is better than perfect, every loop of this project.**
