# The test-plan generator — and why it changed

`TEST_PLAN.md` is the source of truth. `generate_playwright_tests.js` expands
it into a spec tree, one file per test case. **The idea is the good part of
this repository** and none of it changed. What follows is four things that
made it more useful, each with the evidence that prompted it — because "this
is better" is worth less than "here is what it caught".

```bash
npm run test           # the generator's own tests
npm run test:generate  # write stubs for cases that have none
npm run test:check     # verify plan and spec tree agree — exits non-zero
```

---

## 1. Parse the table, do not pattern-match it

**Was:**

```js
const m = line.match(/^\|\s*([A-Z0-9-]+)\s*\|\s*(.*?)\s*\|/);
```

That matches any table row whose first cell is uppercase alphanumeric. Every
markdown table contains two rows that fit and are not test cases: the header
`| ID | Test | ... |` and the separator `|----|------|`.

**What it produced:** 14 files called `id.spec.js`, 21 called `.spec.js` — 35
of 228 generated files, in a tree whose size is the first thing a reviewer
judges.

**Now:** cells are split properly and the first must look like a case ID
(`/^[A-Z]{2,4}-\d{2,3}$/`). Requiring the shape of the thing you want removes
a class of error; excluding the two rows you happened to notice removes two
rows.

**The part that matters more than the junk.** Two of those `.spec.js` files
were not empty. Somebody had implemented into them — 17 real Playwright
tests, including the entire QS-01…QS-13 smoke run. Because the filename began
with a dot they were invisible to `ls`, and `tests/README.md` counted the
implemented work as **1 file, 4 tests** when it was **4 files, 22 tests**.

A generator bug did not just add noise. It hid five times the test coverage
the project was claiming credit for.

## 2. Carry the expected result into the stub

The plan's tables have four columns — `ID | Test | Expected Result | Status`
— and the generator used two, then wrote `// Expected: (fill expected
result)` into every stub.

The plan already states the expected result. Asking someone to retype it is
how the test and the plan start disagreeing, and the expectation is the part
of a test that matters most. Stubs now carry it as a comment.

## 3. A generator that can verify, not only create

A tool that only writes is a one-way door: the plan and the tree drift apart
silently, and the drift is invisible precisely because everything still
passes.

`--check` reports both directions and exits non-zero, so CI can hold them in
step. Run for the first time, it immediately found:

- **`GP-23 Live praise generation`** and **`GP-24 Praise fallback on API
  failure`** — in the plan, no spec anywhere. These are the LLM-prompt
  features from `PRODUCT_VISION.md`. The plan had moved ahead of the tree and
  nothing said so.
- **14 scaffolds** matching no case in the plan, left behind when sections
  were renamed.

It also reports the number worth tracking: **22 of 181 cases covered by an
implemented test**. "229 spec files" is a number that flatters; "22 of 181"
is one that can go up.

## 4. Distinguish an implementation from a scaffold

The check reads each file to decide what it is, rather than trusting its
name. A scaffold calls `test.skip()`; an implementation does not. Case IDs
are read from test titles, so one file may legitimately cover thirteen cases
— as `qs-smoke.spec.js` does.

**Only a scaffold can be reported as an orphan.** This is not a nicety: a
reasonable tidy-up of "empty generated files named `.spec.js`" would have
deleted the 17 rescued tests. A tool that cannot tell work from scaffolding
will eventually throw work away.

---

## What was not changed, deliberately

- **The plan stays the source of truth.** Spec files are derived; the markdown
  is authored.
- **Existing files are never overwritten.** Stubs are disposable, the
  implementations are the work, and a generator that could clobber them is
  one nobody would dare run.
- **No new dependencies.** The tests use `node --test`, which is built in.
  This project's dependency-free posture is a feature.
- **The one-file-per-case convention**, even though two implementations cover
  several cases each. Whether that convention should bend is a real design
  question, and not one to settle in a refactor — the check now handles both
  shapes either way.

## The general lesson

The generator is the most leveraged code here — it produced 228 of the 229
files under `tests/` — and it was the only code with no tests of its own. The
bug that hid 17 real tests would have been caught by a single assertion that
`ID` is not a test case ID.

**Leverage is where tests pay best**, and generated output is exactly where a
small error is hardest to see, because the volume of it defeats reading.
