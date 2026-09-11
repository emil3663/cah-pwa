#!/usr/bin/env node
/**
 * Expand TEST_PLAN.md into a Playwright spec tree, one file per test case.
 *
 *   node scripts/generate_playwright_tests.js            write missing stubs
 *   node scripts/generate_playwright_tests.js --check    verify, write nothing
 *
 * --check is the mode worth having. A generator that only creates is a
 * one-way door: the plan and the spec tree drift apart silently, and the
 * drift is invisible precisely because everything still passes. --check
 * reports both directions of drift and exits non-zero, so CI can hold the
 * two in step.
 *
 * Existing files are never overwritten. The stubs are scaffolding; the
 * implementations are the work, and a generator that could clobber them
 * would be one nobody dared run.
 */
const fs = require('fs');
const path = require('path');
const { parseTestPlan, slug } = require('./lib/test-plan');
const { readSpecTree } = require('./lib/spec-tree');

const ROOT = path.resolve(__dirname, '..');
const PLAN = path.join(ROOT, 'TEST_PLAN.md');
const OUT = path.join(ROOT, 'tests', 'generated');

function specPath(testCase) {
  return path.join(OUT, testCase.section, `${slug(testCase.id)}.spec.js`);
}

/**
 * The stub for one case.
 *
 * Carries the plan's Expected Result rather than a `(fill expected result)`
 * placeholder. The plan already states it; making someone retype it is how
 * the two versions start disagreeing - and the expectation is the part of a
 * test that matters most.
 */
function renderStub({ id, title, expected, section }) {
  const escape = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `// Generated from TEST_PLAN.md for ${id}. Safe to edit - the generator
// never overwrites an existing file. Remove the skip once implemented.
const { test, expect } = require('@playwright/test');

test.describe('${escape(section)}', () => {
  test('${escape(id)}: ${escape(title)}', async ({ page }) => {
    // Expected (from TEST_PLAN.md):
    //   ${expected || '(the plan states no expected result for this case)'}
    test.skip(true, 'Not yet implemented — ${escape(id)}');

    await page.goto('/');
  });
});
`;
}

function main() {
  const check = process.argv.includes('--check');
  const cases = parseTestPlan(fs.readFileSync(PLAN, 'utf8'));
  const specs = readSpecTree(path.join(ROOT, 'tests'));

  // Coverage is what tests actually cover, not what files are named. An
  // implemented suite may cover several cases in one file, and did: two of
  // them cover seventeen cases between them.
  const covered = new Set();
  for (const spec of specs) {
    if (spec.implemented) for (const id of spec.covers) covered.add(id);
  }

  const missing = cases.filter((c) => !fs.existsSync(specPath(c)));
  const scaffolds = specs.filter((s) => !s.implemented);
  const implemented = specs.filter((s) => s.implemented);

  // Only a scaffold can be an orphan. An implementation is somebody's work,
  // whatever it is called - reporting it as deletable is how real tests get
  // thrown away during a tidy-up.
  const expected = new Set(cases.map(specPath));
  const orphans = scaffolds.filter((s) => !expected.has(s.file));

  console.log(`TEST_PLAN.md declares ${cases.length} test cases.`);
  console.log(`Spec tree: ${specs.length} files — ${implemented.length} implemented, ${scaffolds.length} scaffolds.`);
  console.log(`Cases covered by an implemented test: ${covered.size} of ${cases.length}.`);

  if (!check) {
    let written = 0;
    for (const testCase of missing) {
      const file = specPath(testCase);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, renderStub(testCase), 'utf8');
      written += 1;
    }
    console.log(`Wrote ${written} new stub(s).`);
    return;
  }

  let failed = false;
  if (missing.length) {
    failed = true;
    console.error(`\n${missing.length} case(s) in the plan have no spec file:`);
    for (const c of missing) console.error(`  ${c.id}  ${c.title}`);
  }
  if (orphans.length) {
    failed = true;
    console.error(`\n${orphans.length} scaffold(s) match no case in the plan:`);
    for (const s of orphans) console.error(`  ${path.relative(ROOT, s.file)}`);
  }
  if (failed) {
    console.error('\nThe plan and the spec tree disagree. Run without --check to add');
    console.error('missing stubs; review orphans by hand before deleting any.');
    process.exit(1);
  }
  console.log('Plan and spec tree agree.');
}

if (require.main === module) main();
module.exports = { renderStub, specPath };
