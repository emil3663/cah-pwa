const fs = require('fs');
const path = require('path');

// Generates a CSV mapping of tests found in TEST_PLAN.md to a stability matrix.
// Usage: node scripts/generate_test_stability_matrix.js

const ROOT = path.join(__dirname, '..');
const TEST_PLAN = path.join(ROOT, 'TEST_PLAN.md');
const OUT = path.join(ROOT, 'test-stability-matrix.csv');

if (!fs.existsSync(TEST_PLAN)) {
  console.error('TEST_PLAN.md not found at', TEST_PLAN);
  process.exit(1);
}

const text = fs.readFileSync(TEST_PLAN, 'utf8');
const lines = text.split(/\r?\n/);

const seen = new Set();
const rows = [];

for (const line of lines) {
  // Capture tokens like PR-01, GP-05, RM-02, etc.
  const matches = line.match(/([A-Z]{1,4}-\d{2,3})/g);
  if (!matches) continue;
  for (const id of matches) {
    if (seen.has(id)) continue;
    seen.add(id);
    const title = line.trim().replace(/^[-\*\s]+/, '').replace(/"/g, '""');
    rows.push({ id, title });
  }
}

if (rows.length === 0) {
  console.log('No test ids found in TEST_PLAN.md using heuristic. Please review TEST_PLAN.md formatting.');
}

const header = ['TestID','Title','Stability','RequiredChanges','TargetSection','Requirements'];
const csv = [header.join(',')];
for (const r of rows) {
  csv.push([r.id, `"${r.title}"`, 'Needs Implementation', '','', ''].join(','));
}

fs.writeFileSync(OUT, csv.join('\n'));
console.log('Wrote', OUT, 'with', rows.length, 'rows.');
