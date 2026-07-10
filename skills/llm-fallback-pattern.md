# Skill: LLM Fallback Pattern

## What this skill is for

When the user asks you to "add the fallback for X" or when `skills/runtime-prompt-replacement.md` calls for producing artefact (c)'s catch block, wrap a runtime LLM call so that any failure — network error, missing or invalid API key, rate limit, timeout, malformed response — degrades gracefully back to the coded behaviour that existed before the prompt replacement, with no visible break in gameplay.

The premise of this whole project is that prompts replace code without the game getting worse or less reliable. A prompt-driven feature that can crash the game, freeze a round, or show a raw error to a player has failed that premise regardless of how good its output is when the API is reachable. This skill exists so that promise is enforced the same way every time, rather than improvised per call site.

## Inputs you need from the user

Before writing a fallback, make sure you have:

1. **The `ask()` call being wrapped** — which prompt name, which variables.
2. **The original coded behaviour** — the exact logic that produced this outcome before the prompt replacement. This is not optional and not something to approximate — it is usually still sitting right above or below the new `ask()` call, about to be deleted. Do not delete it; it becomes the fallback.
3. **What "still works" means for this call site** — usually: the game screen renders the same way, the player is not blocked, and nothing looks like an error occurred.

If the original coded behaviour has already been deleted or isn't available, stop and ask for it rather than writing a new fallback from scratch — a fallback that behaves differently from what shipped before is a new feature, not a fallback, and needs its own acceptance criteria.

## Output format

Every call to `ask()` at every call site is wrapped exactly like this:

```js
let result;
try {
  result = await ask('<name>', { /* vars */ });
} catch (err) {
  console.warn('Gemini <name> call failed, falling back to <original behaviour>:', err);
  result = /* the original coded logic, unchanged */;
}
// rest of the function proceeds identically regardless of which branch ran
```

Three things must be true about every fallback block:

- **The original coded logic is preserved verbatim**, not rewritten or simplified. It was already tested and already shipped; the fallback's whole job is to reproduce it exactly.
- **The log level is `console.warn`, not `console.error` and not a user-facing alert.** This is an expected, handled condition — the game is working as designed when it falls back — not an unhandled crash. Reserve `console.error` and user-facing messaging for genuinely unexpected failures elsewhere in the app.
- **Everything downstream of the try/catch is identical either way.** The rest of the function must not know or care which branch produced `result`. If downstream code needs to branch on which path was taken, the fallback has leaked into behaviour it shouldn't touch.

## Rules

- **Never let a failed LLM call block gameplay.** No unresolved promises, no missing UI state, no round that can't advance because the API timed out.
- **Never show a raw error or stack trace to the player.** The player should not be able to tell, from the UI alone, whether a given round used the live model or the fallback.
- **The fallback path must be exercised by an explicit test case, not assumed.** Add a case to `TEST_PLAN.md` that forces the failure (typically: blank or invalid the API key) and confirms the pre-existing behaviour still occurs. "It should fall back fine" without a test that proves it is not acceptable per this project's regression conventions.
- **Keep the original coded logic in place permanently.** It is not scaffolding to delete once the prompt version is proven — it is the permanent degraded mode. Treat removing it as a deliberate, separate decision, not a cleanup step.
- **One fallback per call site.** Do not add retries, backoff, or multi-provider failover inside the fallback block — that is a different, heavier pattern and out of scope for this project's constraints (see `PROJECT_BRIEF.md` §3, budget and hardware constraints keep the runtime model layer intentionally simple). A single try/catch to the original coded behaviour is sufficient.
- **This skill assumes `skills/runtime-prompt-replacement.md`'s `ask()` contract** — the helper throws on any failure rather than swallowing it, so every call site gets full control over its own fallback. If a target project's runtime helper instead swallows errors and returns `null`, adapt the check accordingly (`if (result === null)` instead of `try/catch`), but keep the same three properties above.

## Worked example

The praise-message call site in `app.js` (see `skills/runtime-prompt-replacement.md` for the full feature this belongs to):

```js
let praise;
try {
  praise = await ask('praise', { black: bc.text, whites: texts.join(' / ') });
} catch (err) {
  console.warn('Gemini praise call failed, falling back to WINNER_PRAISES:', err);
  praise = WINNER_PRAISES[Math.floor(Math.random() * WINNER_PRAISES.length)];
}
```

`WINNER_PRAISES[Math.floor(Math.random() * WINNER_PRAISES.length)]` is the exact line that lived at this call site before the prompt replacement — reused verbatim as the catch block, not rewritten. Everything after this block (`document.getElementById('roundPraise').textContent = praise;` and onward) runs identically whether `praise` came from Gemini or from the array, which is the property this skill exists to guarantee.

The matching `TEST_PLAN.md` case forces the fallback by blanking `GEMINI_API_KEY` in `js/gemini.js` and confirming the round still resolves with a praise line pulled from `WINNER_PRAISES`.

## How Emil invokes this skill

Usually invoked implicitly, as a sub-step of `skills/runtime-prompt-replacement.md`. It can also be invoked directly, for example when hardening a call site that was migrated without a proper fallback:

> "Using the conventions in `skills/llm-fallback-pattern.md`, add a fallback to the `ask('<name>', …)` call in [file]. The original coded behaviour was: [describe or paste it]."

Same file, same conventions, on any markdown-reading agent.
