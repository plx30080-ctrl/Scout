// api.js
// All AI completions go through the /api/scout Azure Function.
// No secrets are held in the browser bundle.

export async function callAI(systemPrompt, userPrompt) {
  const res = await fetch('/api/scout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ systemPrompt, userPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Server error ${res.status}`);
  }

  const data = await res.json();
  // Strip any accidental markdown code fences the model may add
  return (data.text ?? '').replace(/```json|```/g, '').trim();
}
