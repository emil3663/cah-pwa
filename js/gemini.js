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
