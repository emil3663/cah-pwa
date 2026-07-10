# Skill: Prompt Template Format

## What this skill is for

When the user asks you to "write the prompt file for X" or when `skills/runtime-prompt-replacement.md` calls for producing artefact (a), write a runtime prompt template using the conventions in this file, so every prompt in `prompts/` stays editable, debuggable, and version-controllable without touching code.

A runtime prompt template is not a chat message. It is a small, single-purpose text file that the running app reads, fills in with live data, and sends to a language model on every relevant action (every round, every judge decision, every deck build). Because these files are the actual behaviour of the game — not documentation of the behaviour — they need a stricter, more disciplined format than an ordinary prompt you'd type into a chat window.

## Inputs you need from the user

Before writing a prompt template, make sure you have:

1. **Prompt name** — matches the name used in `skills/runtime-prompt-replacement.md`; determines the filename `prompts/<name>.txt`.
2. **Purpose** — one sentence: what does this call produce, and where does it show up in the game?
3. **Input variables** — the exact set of `{{key}}` placeholders the call site will supply, and what each one contains.
4. **Output constraints** — length, tone, format. Be specific: "one sentence," "a JSON array of 10 strings," "a single word." The call site will parse whatever comes back, so the prompt must make the shape of the response predictable.

If the output constraints are vague, ask for specifics before writing the file — an unconstrained prompt produces unparseable output at runtime, which surfaces as a fallback-path bug, not a prompt bug, and is much harder to diagnose later.

## Output format

Every prompt template file follows this exact shape:

```
<!--
  Prompt: <name>
  Purpose: <one sentence>
  Inputs: {{var1}} — <what it is>
          {{var2}} — <what it is>
  Output: <exact shape/length/format constraint>
  Last updated: <YYYY-MM-DD>
-->
<instruction body — the text actually sent to the model, with {{placeholders}}
 substituted at runtime>
```

- The header comment block is metadata for humans and agents reading the file later — it is stripped before the template is sent to the model (see `js/gemini.js` in `skills/runtime-prompt-replacement.md`).
- The instruction body is everything after the comment block. It is the literal text sent to the model once placeholders are substituted.
- File location is always `prompts/<name>.txt`, flat, no subdirectories, matching this project's flat-file-structure convention (`.github/copilot-instructions.md`).

## Rules

- **One prompt, one purpose.** If a prompt needs an `if/else` to describe two different situations, it should be two prompt files, not one with branching instructions.
- **Placeholders match call-site keys exactly.** `{{black}}` in the template must correspond to a `black` key in the `vars` object passed to `ask()`. Mismatches fail silently (the placeholder just doesn't get substituted) — double check the names match before considering the artefact done.
- **State the output constraint explicitly, inside the instruction body, not just the header comment.** The header comment documents the constraint for humans; the model only ever sees the instruction body, so the constraint must also be written as an instruction to the model itself (e.g. "Respond with exactly one sentence. No quotation marks.").
- **Keep the instruction body short.** A few lines, not a paragraph essay. Long prompts cost more, respond slower, and drift more between calls. If the behaviour needs more nuance than a short prompt can hold, that is a sign the coded behaviour being replaced was doing too much — split it before templating it.
- **No logic lives in the prompt file.** Substitution, parsing, retries, and fallback all belong in `js/gemini.js` or the call site. The prompt file only ever contains instruction text and placeholders.
- **Update `Last updated` whenever the instruction body changes materially** (not for whitespace tweaks). This is what lets a future agent — or Emil — tell at a glance whether a prompt has been tuned since it was first authored.

## Worked example

`prompts/praise.txt`, for the winner-of-the-round message described in `skills/runtime-prompt-replacement.md`:

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

Note what makes this a good example of the format: the purpose is one sentence, both inputs are documented with what they actually contain, the output constraint appears twice (once for humans in the header, once as an instruction to the model in the body), and the whole instruction body is three lines.

Changing the game's tone later is a one-line edit — swap "dry, tongue-in-cheek roast" for "Shakespearean iambic pentameter praise" — with no code touched and no redeploy needed beyond the static file.

## How Emil invokes this skill

Usually invoked implicitly, as a sub-step of `skills/runtime-prompt-replacement.md`. It can also be invoked directly:

> "Using the conventions in `skills/prompt-template-format.md`, write `prompts/<name>.txt`. Purpose: [one sentence]. Inputs: [list]. Output constraint: [specifics]."

Same file, same conventions, on any markdown-reading agent.
