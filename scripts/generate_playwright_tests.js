const fs = require('fs');
const path = require('path');

const md = fs.readFileSync(path.resolve(__dirname, '..', 'TEST_PLAN.md'), 'utf8');
const lines = md.split(/\r?\n/);

let currentSection = 'general';
const outDir = path.resolve(__dirname, '..', 'tests', 'generated');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function sanitizeName(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  const h = line.match(/^#{2,3}\s*(.+)$/);
  if (h) {
    currentSection = sanitizeName(h[1]);
    continue;
  }

  // Match table rows that start with | ID | Test ... |
  // e.g. | PR-01 | Start a new game and leave before finishing | ... |
  const m = line.match(/^\|\s*([A-Z0-9-]+)\s*\|\s*(.*?)\s*\|/);
  if (m) {
    const id = m[1];
    const title = m[2].replace(/`/g, "");
    const sectionDir = path.join(outDir, currentSection);
    if (!fs.existsSync(sectionDir)) fs.mkdirSync(sectionDir, { recursive: true });
    const fileName = path.join(sectionDir, `${sanitizeName(id)}.spec.js`);
    if (fs.existsSync(fileName)) continue; // don't overwrite

    const content = `// Auto-generated Playwright test stub for ${id} — ${title}\nconst { test, expect } = require('@playwright/test');\n\ntest.describe('${currentSection} - ${id}', () => {\n  test('${id}: ${title}', async ({ page }) => {\n    // Preconditions: (fill as needed)\n    // Description: ${title}\n    // Steps:\n    // 1. (step 1)\n    // 2. (step 2)\n    // Expected: (fill expected result)\n\n    // Example navigation: await page.goto('/');\n    await test.skip(); // remove this once test is implemented\n  });\n});\n`;
    fs.writeFileSync(fileName, content, 'utf8');
  }
}

console.log('Generated test stubs in', outDir);
