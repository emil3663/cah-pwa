/**
 * Parsing TEST_PLAN.md into test cases.
 *
 * Split out from the generator so it can be tested without writing files.
 * The generator is the most leveraged code in this repo - it produces the
 * whole of tests/generated/ - and until now nothing verified it.
 */

/** A row is only a test case if its first cell looks like a case ID. */
const CASE_ID = /^[A-Z]{2,4}-\d{2,3}$/;

/**
 * Pull the test cases out of TEST_PLAN.md.
 *
 * The previous parser matched any table row whose first cell was uppercase
 * alphanumeric. Markdown tables always carry two rows that fit that
 * description and are not test cases: the header (`| ID | Test | ... |`) and
 * the separator (`|----|------|`). It generated a spec file for both, in
 * every table - 14 files called `id.spec.js` and 21 called `.spec.js`, 35 of
 * 228 generated files, all junk.
 *
 * Requiring the shape of a real ID rather than "looks tableish" is what
 * removes an entire class of that, rather than special-casing the two rows
 * we happen to have noticed.
 */
function parseTestPlan(markdown) {
  const cases = [];
  let section = 'general';

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();

    const heading = line.match(/^#{2,3}\s*(.+)$/);
    if (heading) {
      section = slug(heading[1]);
      continue;
    }

    if (!line.startsWith('|')) continue;

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim().replace(/`/g, ''));

    if (cells.length < 2) continue;

    const [id, title, expected = ''] = cells;
    if (!CASE_ID.test(id)) continue;

    cases.push({ id, title, expected, section });
  }

  return cases;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

module.exports = { parseTestPlan, slug, CASE_ID };
