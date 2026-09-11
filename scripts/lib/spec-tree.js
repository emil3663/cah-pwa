/**
 * Reading the spec tree back, so the generator can verify and not only create.
 *
 * The distinction that matters here is between a scaffold and an
 * implementation. A scaffold is the generator's output and is disposable.
 * An implementation is somebody's work and is not - so the check must never
 * describe one as an orphan to be deleted, however oddly it is named.
 *
 * That is not hypothetical. Two implemented suites - 17 real tests between
 * them - were sitting in files called `.spec.js`, because the old parser
 * matched a markdown separator row and named a file after it. They were
 * invisible to `ls`, uncounted in the README, and a tidy-up that deleted
 * "empty generated files" by name would have deleted them.
 */
const fs = require('fs');
const path = require('path');

const CASE_ID_IN_TEST = /\b([A-Z]{2,4}-\d{2,3})\b/g;

function isImplemented(source) {
  return !/test\.skip\s*\(/.test(source);
}

/** Case IDs a file claims to cover, read from its test titles. */
function coveredCaseIds(source) {
  const ids = new Set();
  for (const line of source.split(/\r?\n/)) {
    if (!/\btest\s*\(/.test(line)) continue;
    for (const match of line.matchAll(CASE_ID_IN_TEST)) ids.add(match[1]);
  }
  return ids;
}

function readSpecTree(dir) {
  const specs = [];
  if (!fs.existsSync(dir)) return specs;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.spec.js')) {
        const source = fs.readFileSync(full, 'utf8');
        specs.push({
          file: full,
          implemented: isImplemented(source),
          covers: coveredCaseIds(source),
        });
      }
    }
  };
  walk(dir);
  return specs;
}

module.exports = { readSpecTree, isImplemented, coveredCaseIds };
