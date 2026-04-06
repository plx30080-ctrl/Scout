// search.js
// Proxies Bing Web Search API.
// Used to ground territory research in live web results (news, job postings, company info).

const { app } = require('@azure/functions');

app.http('search', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'search',
  handler: async (request, context) => {
    const bingKey = process.env.BING_SEARCH_KEY;

    if (!bingKey) {
      return { status: 500, jsonBody: { error: 'BING_SEARCH_KEY is not configured on the server.' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Request body must be JSON.' } };
    }

    const { query, count = 10 } = body;
    if (!query) {
      return { status: 400, jsonBody: { error: 'query is required.' } };
    }

    // Grounding with Bing Search uses a configurable endpoint.
    // Default falls back to the classic v7 URL for backwards compatibility.
    const bingEndpoint = (process.env.BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search').replace(/\/$/, '');

    const url =
      `${bingEndpoint}` +
      `?q=${encodeURIComponent(query)}` +
      `&count=${count}` +
      `&mkt=en-US` +
      `&safeSearch=Moderate` +
      `&freshness=Month`;

    const res = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': bingKey },
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      context.error('Bing Search error:', res.status, errBody);
      return { status: res.status, jsonBody: { error: `Bing Search error ${res.status}`, detail: errBody } };
    }

    const data = await res.json();
    const snippets = (data.webPages?.value ?? []).map((r) => ({
      title:   r.name,
      url:     r.url,
      snippet: r.snippet,
    }));

    return { jsonBody: { snippets } };
  },
});
