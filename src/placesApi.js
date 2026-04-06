// placesApi.js
// Client-side wrapper for the /api/places Azure Function.
// All Azure Maps API keys stay server-side.

const MAX_PLACES_RADIUS_METERS = 50000; // Azure Maps fuzzy search cap (~31 mi)

export const MAPS_AVAILABLE = true; // Always available — key lives in Function config

const INDUSTRY_QUERIES = {
  'All Industries': [
    'warehouse distribution center',
    'manufacturing plant factory',
    'food processing food manufacturing',
    'fulfillment center logistics 3PL',
    'industrial production facility',
  ],
  'Distribution / Warehouse': [
    'warehouse distribution center',
    'fulfillment center',
    'freight terminal receiving dock',
  ],
  'Manufacturing': [
    'manufacturing plant factory',
    'industrial production facility',
    'fabrication stamping assembly plant',
  ],
  'Food & Beverage': [
    'food processing plant',
    'food manufacturing beverage production',
    'bakery plant food distribution',
  ],
  'Automotive': [
    'automotive parts manufacturing',
    'auto supplier stamping assembly',
    'tier 1 tier 2 automotive plant',
  ],
  'Logistics / 3PL': [
    'logistics 3PL freight carrier',
    'distribution center transportation hub',
    'intermodal freight terminal',
  ],
  'E-Commerce Fulfillment': [
    'fulfillment center ecommerce',
    'order fulfillment warehouse',
    'returns processing distribution',
  ],
};

async function callPlaces(body) {
  const res = await fetch('/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Places API error ${res.status}`);
  }
  return res.json();
}

export async function geocodeLocation(locationStr) {
  return callPlaces({ action: 'geocode', query: locationStr });
  // Returns { lat, lng, formattedAddress }
}

export async function getRouteMatrix(origins, destinations) {
  return callPlaces({ action: 'routeMatrix', origins, destinations });
  // Returns { matrix }
}

/**
 * Run all industry-relevant POI searches, deduplicate, and filter.
 * Returns { places: Place[], geocodedLocation: string }
 */
export async function findProspectsViaPlaces(locationStr, radiusOption, industry, stateRestriction) {
  const miles        = parseInt(radiusOption, 10) || 25;
  const radiusMeters = Math.min(miles * 1609.34, MAX_PLACES_RADIUS_METERS);

  const { lat, lng, formattedAddress } = await geocodeLocation(locationStr);

  const queries = INDUSTRY_QUERIES[industry] || INDUSTRY_QUERIES['All Industries'];

  const seen   = new Set();
  const places = [];

  for (const query of queries) {
    let data;
    try {
      data = await callPlaces({ action: 'search', query, lat, lng, radiusMeters });
    } catch {
      continue; // one failed query shouldn't abort the whole search
    }

    for (const place of data.results ?? []) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      places.push(place);
    }
  }

  // Belt-and-suspenders state filter on top of the AI prompt instruction.
  // Match ", IL" followed by a space, comma, or end-of-string to handle addresses with or without zip.
  const filtered = stateRestriction
    ? places.filter((p) => new RegExp(`, ${stateRestriction}(\\s|,|$)`).test(p.address))
    : places;

  return { places: filtered, geocodedLocation: formattedAddress };
}
