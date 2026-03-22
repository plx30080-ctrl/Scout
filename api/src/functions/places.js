// places.js
// Proxies Azure Maps geocoding and POI search.
// Supports two actions: 'geocode' and 'search'.

const { app } = require('@azure/functions');

const MAPS_BASE = 'https://atlas.microsoft.com';
const key = () => process.env.AZURE_MAPS_KEY;

async function geocode(query) {
  const url =
    `${MAPS_BASE}/search/address/json` +
    `?api-version=1.0` +
    `&query=${encodeURIComponent(query)}` +
    `&subscription-key=${key()}`;

  const res  = await fetch(url);
  const data = await res.json();
  const r    = data.results?.[0];

  if (!r) throw new Error(`Could not geocode "${query}".`);

  return {
    lat: r.position.lat,
    lng: r.position.lon,
    formattedAddress: r.address.freeformAddress,
  };
}

async function searchPOI(query, lat, lng, radiusMeters) {
  const url =
    `${MAPS_BASE}/search/fuzzy/json` +
    `?api-version=1.0` +
    `&query=${encodeURIComponent(query)}` +
    `&lat=${lat}&lon=${lng}` +
    `&radius=${Math.round(radiusMeters)}` +
    `&limit=20` +
    `&subscription-key=${key()}`;

  const res  = await fetch(url);
  const data = await res.json();

  return (data.results || []).map((r) => ({
    id:         r.id,
    name:       r.poi?.name ?? r.address?.freeformAddress ?? 'Unknown',
    address:    r.address?.freeformAddress ?? '',
    categories: r.poi?.categories ?? [],
    brands:     (r.poi?.brands ?? []).map((b) => b.name),
    url:        r.poi?.url ?? null,
    lat:        r.position?.lat,
    lng:        r.position?.lon,
  }));
}

async function getRouteMatrix(origins, destinations) {
  // Azure Maps Route Matrix — used by Route Planner for drive-time estimates
  const url =
    `${MAPS_BASE}/route/matrix/sync/json` +
    `?api-version=1.0` +
    `&subscription-key=${key()}`;

  const body = {
    origins: {
      type: 'MultiPoint',
      coordinates: origins.map((o) => [o.lng, o.lat]),
    },
    destinations: {
      type: 'MultiPoint',
      coordinates: destinations.map((d) => [d.lng, d.lat]),
    },
  };

  const res  = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.matrix ?? [];
}

app.http('places', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'places',
  handler: async (request, context) => {
    if (!key()) {
      return { status: 500, jsonBody: { error: 'AZURE_MAPS_KEY is not configured on the server.' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Request body must be JSON.' } };
    }

    try {
      switch (body.action) {
        case 'geocode': {
          const result = await geocode(body.query);
          return { jsonBody: result };
        }
        case 'search': {
          const results = await searchPOI(body.query, body.lat, body.lng, body.radiusMeters);
          return { jsonBody: { results } };
        }
        case 'routeMatrix': {
          const matrix = await getRouteMatrix(body.origins, body.destinations);
          return { jsonBody: { matrix } };
        }
        default:
          return { status: 400, jsonBody: { error: `Unknown action: ${body.action}` } };
      }
    } catch (err) {
      context.error('places error:', err.message);
      return { status: 500, jsonBody: { error: err.message } };
    }
  },
});
