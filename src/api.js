// api.js
// Handles calls to either Anthropic or Azure OpenAI.
// Configure your endpoint in the .env file (see SETUP.md).

const USE_AZURE = process.env.REACT_APP_USE_AZURE === 'true';

const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const AZURE_ENDPOINT = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT; // e.g. https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-02-01

const ANTHROPIC_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const AZURE_KEY = process.env.REACT_APP_AZURE_OPENAI_KEY;

/**
 * Send a prompt to the configured AI provider.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>} The text response from the model
 */
export async function callAI(systemPrompt, userPrompt) {
  if (USE_AZURE) {
    return callAzure(systemPrompt, userPrompt);
  }
  return callAnthropic(systemPrompt, userPrompt);
}

async function callAnthropic(systemPrompt, userPrompt) {
  const response = await fetch(ANTHROPIC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.find((b) => b.type === 'text')?.text || '';
  return text.replace(/```json|```/g, '').trim();
}

async function callAzure(systemPrompt, userPrompt) {
  if (!AZURE_ENDPOINT) throw new Error('REACT_APP_AZURE_OPENAI_ENDPOINT is not set.');

  const response = await fetch(AZURE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Azure API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return text.replace(/```json|```/g, '').trim();
}
