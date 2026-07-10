# Skill: Runtime Prompt Replacement

## What this skill is for

When the user asks you to "replace this hardcoded behaviour with a prompt" or "apply runtime-prompt-replacement to X," find a piece of coded decision-making in the target codebase and replace it with a call to a language model at runtime, driven by an editable prompt template file.

This is the cornerstone skill of the portable library. It is agent-agnostic and codebase-agnostic — it does not assume Cards Against Humanity, Gemini, or any specific stack. It works on any project where a piece of behaviour is currently a fixed array, a switch statement, or a rule-based function, and the owner wants that behaviour to live in a text file instead of in code.

Every application of this skill produces the same three artefacts (see Output format) and always pairs with two supporting skills:

- `skills/prompt-template-format.md` — governs how artefact (a), the prompt file itself, is written.
- `skills/llm-fallback-pattern.md` — governs how artefact (c), the call-site swap, degrades gracefully.

Apply those two skills' conventions when producing artefacts (a) and (c) below rather than improvising the format each time.

## Inputs you need from the user

Before producing anything, make sure you have:

1. **Target file and location** — which file currently contains the hardcoded behaviour, and roughly where (function name, line, or a snippet).
2. **Target behaviour** — what the coded logic currently does. Quote or describe it; do not infer it from a vague description.
3. **Prompt name** — a short, single-word-or-hyphenated name for this behaviour (e.g. `praise`, `czar-judge`, `deck-generate`). This becomes the template filename and the `ask()` call's first argument.
4. **Input variables** — what data the running app has available at the call site that the prompt will need (e.g. the black card text, the submitted white cards, a player's recent history).
5. **Acceptance criteria** — what must be true for this replacement to be considered done. At minimum this always includes: the game plays identically when the LLM call succeeds, and identically to the *old* coded behaviour when it fails.

If anything above is missing, ask — do not invent the target behaviour or the acceptance criteria. A prompt replacement built on an assumed target is worse than no replacement.

## Output format

Every application of this skill produces exactly three artefacts:

**(a) A new prompt template file** — `prompts/<name>.txt`.
Written according to `skills/prompt-template-format.md`. Contains the instruction text and `{{variable}}` placeholders for the input variables identified above. Nothing else lives in this file — no code, no JSON scaffolding beyond what the model is asked to return.

**(b) A single shared JS helper** — `js/gemini.js`, created once and reused by every subsequent application of this skill.
One async function, `ask(promptName, vars)`, that:
- Reads the prompt template from `prompts/<promptName>.txt`.
- Substitutes each `{{key}}` placeholder with the matching value from `vars`.
- Calls the runtime model's API directly (no server round-trip, per the project's toolkit — see `PROJECT_BRIEF.md` §4.2).
- Returns the response text.
- Throws on any failure — it does **not** catch and swallow errors itself. Fallback handling belongs at the call site (see `skills/llm-fallback-pattern.md`), not inside the shared helper, so every call site controls its own degradation.

If `js/gemini.js` already exists from a prior application of this skill, do not create a second helper — reuse the existing `ask()` function.

**(c) The call-site swap** — in the target file, replace the coded decision with `await ask('<name>', { ...vars })`, wrapped in a try/catch per `skills/llm-fallback-pattern.md`. The original coded logic is not deleted — it becomes the catch-block fallback, permanently. See that skill for exactly what the catch block must do.

**(d) A `TEST_PLAN.md` addition** — a new regression case (or pair of cases) confirming: the behaviour is freshly generated when the API is reachable, and the fallback path produces the old coded behaviour when it isn't. Follow the existing `TEST_PLAN.md` conventions in this repo for ID format and table structure.

## Rules

- **One hardcoded behaviour per loop.** Do not bundle two replacements (e.g. praise messages and Czar judging) into a single application of this skill. Each is its own brief, its own artefacts, its own test case.
- **Keep prompts short.** A runtime prompt is not a system prompt for a chat assistant — it is a single-purpose instruction sent on every round or every action. Long prompts are slower, costlier, and drift more. If the prompt is starting to accumulate conditional instructions ("but if X, do Y instead"), that is a sign the behaviour should split into two prompts, not one clever one.
- **Always include a fallback path.** No exceptions. A runtime prompt replacement that can break gameplay when the network is down or the API quota is exhausted has failed its acceptance criteria regardless of how good the generated output looks when it works.
- **Never write a real API key into any file.** Store the key as a `const` placeholder in `js/gemini.js` with a comment marking it as a placeholder to be filled in locally by the project owner (e.g. `// TODO: paste your API key here — do not commit a real key`). Leave it blank or templated. This applies even if the user's own brief includes a real key — do not transcribe it into a file the agent writes.
- **Document input variables in a comment block** at the top of the prompt template file — see `skills/prompt-template-format.md` for the exact format.
- **Do not touch unrelated code.** If applying this skill surfaces an unrelated bug or missing test coverage, note it (per this project's PR conventions in `.github/copilot-instructions.md`) rather than fixing it inline.
- **The skill is agent-agnostic.** Nothing above assumes a specific runtime model, agent tool, or language. When applying it outside this repo, swap the model call in artefact (b) for whatever runtime model the target project uses; the three-artefact shape and the rules stay the same.

## Worked example

The user says:

> "Target file is `app.js`, around line 2503, where `WINNER_PRAISES[Math.floor(Math.random() * WINNER_PRAISES.length)]` picks a random line from the array defined in `cards.js`. Replace it with a live Gemini call. Prompt name is `praise`. Variables available at the call site: `bc.text` (the black card) and `texts` (the array of submitted white card texts, already joined-ready). Acceptance criteria: praise is freshly generated per round when the API is reachable; falls back to the existing `WINNER_PRAISES` random pick when it isn't."

Produce:

**`prompts/praise.txt`**
```
<!--
  Prompt: praise
  Purpose: One-line, tongue-in-cheek roast of the round's winning combo.
  Inputs: {{black}} — the black card prompt text
          {{whites}} — the winning white card text(s), joined with " / "
  Output: a single sentence, no quotation marks, no markdown.
  Last updated: 2026-07-10
-->
Write one short, dry, tongue-in-cheek roast of this Cards Against Humanity
answer. Black card: "{{black}}". Winning answer: "{{whites}}".
Respond with exactly one sentence. No quotation marks. No preamble.
```

**`js/gemini.js`**
```js
// Runtime model helper — shared by every prompt-driven feature.
// Reads prompts/<name>.txt, substitutes {{key}} placeholders, calls Gemini Flash.

const GEMINI_API_KEY = ''; // TODO: paste your API key here — do not commit a real key
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

async function ask(promptName, vars) {
  const res = await fetch(`prompts/${promptName}.txt`);
  let template = await res.text();
  template = template.replace(/<!--[\s\S]*?-->/, '').trim(); // strip header comment
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(`{{${key}}}`, String(value));
  }

  const apiRes = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: template }] }] })
  });
  if (!apiRes.ok) throw new Error(`Gemini call failed: ${apiRes.status}`);

  const data = await apiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini call returned no text');
  return text.trim();
}
```

**Call-site swap in `app.js`** (see `skills/llm-fallback-pattern.md` for why the catch block looks like this):
```js
let praise;
try {
  praise = await ask('praise', { black: bc.text, whites: texts.join(' / ') });
} catch (err) {
  console.warn('Gemini praise call failed, falling back to WINNER_PRAISES:', err);
  praise = WINNER_PRAISES[Math.floor(Math.random() * WINNER_PRAISES.length)];
}
```

**`TEST_PLAN.md` addition** — one new regression pair, e.g. `PR-01` (praise freshly generated when API reachable) and `PR-02` (fallback to `WINNER_PRAISES` when the API key is blanked out), added under the relevant round-resolution section using this repo's existing ID and table conventions.

## How Emil invokes this skill

In Cline, Copilot Agent Mode, or any markdown-reading agent:

> "Read `skills/runtime-prompt-replacement.md` and apply it to [target behaviour] in [target file]. Prompt name: [name]. Variables available at the call site: [list]. Acceptance criteria: [list]."

The agent reads this skill plus `skills/prompt-template-format.md` and `skills/llm-fallback-pattern.md`, produces the three artefacts, and appends the `TEST_PLAN.md` case. If any required input is missing, it asks first, because this skill tells it to.

This file is plain markdown and reads the same on any agent platform — Claude, Cline, Cursor, Open WebUI. Each reuse (praise → AI player personalities → Czar judging → deck generation) is a chance to refine this skill; keep it a living file, not a contract.
