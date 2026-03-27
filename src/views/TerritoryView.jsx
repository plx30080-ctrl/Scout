// views/TerritoryView.jsx
import { useState } from 'react';
import SearchPanel from '../components/SearchPanel';
import ProspectCard from '../components/ProspectCard';
import SummaryBar from '../components/SummaryBar';
import { callAI } from '../api';
import {
  TERRITORY_SYSTEM_PROMPT, buildTerritoryUserPrompt,
  TERRITORY_ENRICHMENT_SYSTEM_PROMPT, buildEnrichmentUserPrompt,
} from '../prompts';
import { findProspectsViaPlaces } from '../placesApi';
import { bingSearch, buildTerritorySearchQueries } from '../searchApi';

const HEAT_FILTERS = ['All', 'Hot', 'Warm', 'Cold'];

// Phase label shown under the search button during loading
const PHASE_LABELS = {
  locating:  'Locating area...',
  searching: 'Gathering territory intelligence...',
  analyzing: 'Analyzing prospects with AI...',
};

function exportToCSV(prospects, location) {
  const headers = [
    'Company', 'Industry', 'Estimated Size', 'Address', 'Heat Score',
    'Brand', 'Open Roles', 'Hiring For', 'Hiring Recency',
    'Heat Reason', 'News Signal',
    'Talking Point 1', 'Talking Point 2', 'Talking Point 3',
  ];
  const rows = prospects.map((p) => [
    p.name, p.industry, p.estimatedSize,
    p.address || p.location,
    p.heatScore, p.brand || '',
    p.openRoles || 0, (p.jobRoles || []).join('; '),
    p.hiringRecency || '',
    p.heatReason || '', p.newsSignal || '',
    p.talkingPoints?.[0] || '',
    p.talkingPoints?.[1] || '',
    p.talkingPoints?.[2] || '',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scout-${location.replace(/[\s,]+/g, '-').toLowerCase()}-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function TerritoryView({ onPrepForCall, onGenerateCampaign }) {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('25 miles');
  const [industry, setIndustry] = useState('All Industries');
  const [stateRestriction, setStateRestriction] = useState('');
  const [searchPhase, setSearchPhase] = useState(null); // null | 'locating' | 'finding' | 'analyzing'
  const [prospects, setProspects] = useState(null);
  const [error, setError] = useState(null);
  const [filterHeat, setFilterHeat] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());
  const [lastSearched, setLastSearched] = useState('');
  const [usedMaps, setUsedMaps] = useState(false);

  const loading = searchPhase !== null;

  async function handleSearch() {
    if (!location.trim()) return;
    setError(null);
    setProspects(null);
    setSelected(new Set());
    setDismissed(new Set());
    setFilterHeat('All');
    setUsedMaps(false);

    const state = stateRestriction.trim() || null;

    try {
      // Always use the Maps+Bing path — APIs are server-side via Azure Functions
      if (true) {
        // ── Phase 1: Geocode + Places search ──────────────────────────────
        setSearchPhase('locating');
        let places, geocodedLocation;
        try {
          ({ places, geocodedLocation } = await findProspectsViaPlaces(location, radius, industry, state));
        } catch (mapsErr) {
          console.warn('Maps search failed, falling back to AI-only:', mapsErr.message);
          // Fall through to AI-only below
          places = null;
        }

        if (places && places.length >= 5) {
          // ── Phase 2: Bing Search for territory intel ───────────────────
          setSearchPhase('searching');
          const queries  = buildTerritorySearchQueries(geocodedLocation || location, industry);
          const snippets = (await Promise.all(queries.map((q) => bingSearch(q, 8)))).flat();

          // ── Phase 3: AI enrichment of real Places data + Bing intel ────
          setSearchPhase('analyzing');
          const raw = await callAI(
            TERRITORY_ENRICHMENT_SYSTEM_PROMPT,
            buildEnrichmentUserPrompt(places, geocodedLocation || location, radius, industry, state, snippets)
          );
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) throw new Error('Unexpected response format.');
          setProspects(parsed);
          setLastSearched(location);
          setUsedMaps(true);
          return;
        }
        // Not enough Places results — fall through to AI-only
      }

      // ── AI-only path (no Maps key, or Maps returned too few results) ───
      setSearchPhase('analyzing');
      const raw = await callAI(
        TERRITORY_SYSTEM_PROMPT,
        buildTerritoryUserPrompt(location, radius, industry, state)
      );
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Unexpected response format.');
      setProspects(parsed);
      setLastSearched(location);
    } catch (err) {
      console.error(err);
      setError(
        err.message.includes('not configured')
          ? 'A backend API key is not configured. Check the application settings on your Static Web App (or api/local.settings.json for local dev) and see SETUP.md.'
          : `Search error: ${err.message}`
      );
    } finally {
      setSearchPhase(null);
    }
  }

  function handleToggleSelect(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleDismiss(name) {
    setDismissed((prev) => new Set([...prev, name]));
    setSelected((prev) => { const n = new Set(prev); n.delete(name); return n; });
  }

  function handleExport() {
    if (!visible) return;
    const toExport = selected.size > 0 ? visible.filter((p) => selected.has(p.name)) : visible;
    exportToCSV(toExport, lastSearched);
  }

  const visible = prospects ? prospects.filter((p) => !dismissed.has(p.name)) : null;
  const filtered = visible
    ? filterHeat === 'All' ? visible : visible.filter((p) => p.heatScore === filterHeat)
    : null;

  return (
    <div className="space-y-5">
      <SearchPanel
        location={location} setLocation={setLocation}
        radius={radius} setRadius={setRadius}
        industry={industry} setIndustry={setIndustry}
        stateRestriction={stateRestriction} setStateRestriction={setStateRestriction}
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Loading state with phase label */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 spin" />
            <div className="absolute inset-0 rounded-full border-t-2 border-emerald-400 spin" />
          </div>
          <p className="text-sm text-slate-400">{PHASE_LABELS[searchPhase]}</p>
        </div>
      )}

      {error && (
        <div className="px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm leading-relaxed">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {filtered && !loading && (
        <div className="space-y-4">
          <SummaryBar
            prospects={visible}
            selectedCount={selected.size}
            dismissedCount={dismissed.size}
            onExport={handleExport}
            usedMaps={usedMaps}
          />

          <div className="flex items-center gap-2 flex-wrap">
            {HEAT_FILTERS.map((h) => (
              <button
                key={h}
                onClick={() => setFilterHeat(h)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterHeat === h
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {h}
              </button>
            ))}
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filtered.map((company, i) => (
              <ProspectCard
                key={company.name + i}
                company={company}
                index={i}
                isSelected={selected.has(company.name)}
                onToggleSelect={handleToggleSelect}
                onDismiss={handleDismiss}
                onPrepForCall={onPrepForCall}
                onGenerateCampaign={onGenerateCampaign}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center text-slate-500 py-12 text-sm">
              No prospects match that filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
