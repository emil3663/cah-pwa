/**
 * Tests for the generator's parser.
 *
 * The generator is the most leveraged code in this repository - it produces
 * the whole of tests/generated/ - and until now nothing tested it. The bug
 * below shipped 35 junk files into the repo and hid two real test suites,
 * and a single assertion would have caught it.
 *
 * Run: node --test scripts/test/
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { parseTestPlan } = require('../lib/test-plan');

const PLAN = `
## 3-1 Authentication

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| LG-01 | Create account | Account created and menu shown | ⬜ |
| LG-02 | Sign in | Profile loads | ✅ |

## 3-2 Rooms

| ID | Test | Expected Result | Status |
|----|------|-----------------|--------|
| RM-01 | Create room | 6-char code displayed | ⬜ |
`;

test('a markdown header row is not a test case', () => {
  const ids = parseTestPlan(PLAN).map((c) => c.id);
  assert.ok(!ids.includes('ID'), 'the literal header "| ID | Test |" was parsed as a case');
});

test('a markdown separator row is not a test case', () => {
  const ids = parseTestPlan(PLAN).map((c) => c.id);
  assert.ok(!ids.some((id) => /^-+$/.test(id)), 'a separator row was parsed as a case');
  assert.ok(!ids.includes(''), 'an empty id was produced — this is what named files ".spec.js"');
});

test('parses exactly the real cases', () => {
  assert.deepEqual(parseTestPlan(PLAN).map((c) => c.id), ['LG-01', 'LG-02', 'RM-01']);
});

test('captures the expected result, not just the title', () => {
  const [first] = parseTestPlan(PLAN);
  assert.equal(first.expected, 'Account created and menu shown');
});

test('assigns each case to the section it appears under', () => {
  const cases = parseTestPlan(PLAN);
  assert.equal(cases[0].section, '3-1-authentication');
  assert.equal(cases[2].section, '3-2-rooms');
});

test('ignores tables that are not test cases', () => {
  const other = `
## Notes

| Term | Meaning |
|------|---------|
| Czar | The judge for a round |
`;
  assert.deepEqual(parseTestPlan(other), [],
    'a glossary table was parsed as test cases');
});

test('the real TEST_PLAN.md parses without junk', () => {
  const fs = require('fs');
  const path = require('path');
  const md = fs.readFileSync(path.resolve(__dirname, '..', '..', 'TEST_PLAN.md'), 'utf8');
  const cases = parseTestPlan(md);
  assert.ok(cases.length > 100, `expected the plan to hold real cases, got ${cases.length}`);
  for (const c of cases) {
    assert.match(c.id, /^[A-Z]{2,4}-\d{2,3}$/, `"${c.id}" is not a case ID`);
  }
});
