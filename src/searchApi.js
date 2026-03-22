// searchApi.js
// Client-side wrapper for the /api/search Azure Function (Bing Web Search).
// Used to ground territory research in live news and company intel.

/**
 * Search Bing for recent news and intel about a territory.
 * Returns an array of { title, url, snippet } objects, or [] on failure.
 */
export async function bingSearch(query, count = 10) {
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, count }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.snippets ?? [];
  } catch {
    return []; // Search is an enhancement, not required — fail silently
  }
}

/**
 * Build territory-level search queries from the user's location and industry.
 * Returns 2-3 Bing search strings targeting hiring signals, expansion news,
 * and industrial activity in the area.
 */
export function buildTerritorySearchQueries(location, industry) {
  const base = industry === 'All Industries'
    ? 'warehouse manufacturing distribution logistics'
    : industry.toLowerCase();

  return [
    `${location} ${base} new facility hiring expansion 2024 2025`,
    `${location} industrial park distribution center opening`,
  ];
}
