// scout.js
// Proxies AI completions through Azure OpenAI.
// Keeps the API key server-side — never exposed to the browser.

const { app } = require('@azure/functions');

app.http('scout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'scout',
  handler: async (request, context) => {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key      = process.env.AZURE_OPENAI_KEY;

    if (!endpoint || !key) {
      return { status: 500, jsonBody: { error: 'Azure OpenAI is not configured on the server.' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Request body must be JSON.' } };
    }

    const { systemPrompt, userPrompt } = body;
    if (!systemPrompt || !userPrompt) {
      return { status: 400, jsonBody: { error: 'systemPrompt and userPrompt are required.' } };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        status: res.status,
        jsonBody: { error: err?.error?.message || `Azure OpenAI error ${res.status}` },
      };
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return { jsonBody: { text } };
  },
});
