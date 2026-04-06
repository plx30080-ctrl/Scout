// maps-config.js
// Returns the Azure Maps subscription key so the browser map SDK can
// authenticate without embedding the key in the React bundle.

const { app } = require('@azure/functions');

app.http('maps-config', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'maps-config',
  handler: async (_request, _context) => {
    const key = process.env.AZURE_MAPS_KEY;
    if (!key) {
      return { status: 500, jsonBody: { error: 'AZURE_MAPS_KEY is not configured on the server.' } };
    }
    return { jsonBody: { key } };
  },
});
