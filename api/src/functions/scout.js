// scout.js
// Proxies AI completions through Azure OpenAI.
// Keeps the API key server-side — never exposed to the browser.

const { app } = require('@azure/functions');

app.http('scout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'scout',
  handler: async (request, context) => {
    const baseEndpoint = process.env.AZURE_OPENAI_ENDPOINT; // e.g. https://my-resource.openai.azure.com
    const key          = process.env.AZURE_OPENAI_KEY;
    const deployment   = process.env.AZURE_OPENAI_DEPLOYMENT || 'Azure-Scout';

    if (!baseEndpoint || !key) {
      return { status: 500, jsonBody: { error: 'Azure OpenAI is not configured on the server.' } };
    }

    const endpoint = `${baseEndpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`;

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

    const bingKey = process.env.BING_SEARCH_KEY;

    const payload = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    };

    // When a Bing key is present, enable Grounding with Bing Search so the
    // model can pull live web results automatically during generation.
    if (bingKey) {
      payload.data_sources = [{
        type: 'bing_search',
        parameters: {
          endpoint: 'https://api.bing.microsoft.com/v7.0/search',
          key: bingKey,
        },
      }];
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
      },
      body: JSON.stringify(payload),
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
