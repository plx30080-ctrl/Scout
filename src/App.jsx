// App.jsx
import { useState } from 'react';
import SearchPanel from './components/SearchPanel';
import ProspectCard from './components/ProspectCard';
import SummaryBar from './components/SummaryBar';
import Spinner from './components/Spinner';
import { callAI } from './api';
import { TERRITORY_SYSTEM_PROMPT, buildTerritoryUserPrompt } from './prompts';

const HEAT_FILTERS = ['All', 'Hot', 'Warm', 'Cold'];

function exportToCSV(prospects, location) {
  const headers = [
    'Company',
    'Industry',
    'Estimated Size',
    'Location',
    'Heat Score',
    'Brand',
    'Open Roles',
    'Hiring For',
    'Heat Reason',
    'News Signal',
    'Talking Point 1',
    'Talking Point 2',
    'Talking Point 3',
  ];

  const rows = prospects.map((p) => [
    p.name,
    p.industry,
    p.estimatedSize,
    p.location,
    p.heatScore,
    p.brand || '',
    p.openRoles || 0,
    (p.jobRoles || []).join('; '),
    p.heatReason || '',
    p.newsSignal || '',
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

export default function App() {
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState('25 miles');
  const [industry, setIndustry] = useState('All Industries');
  const [loading, setLoading] = useState(false);
  const [prospects, setProspects] = useState(null);
  const [error, setError] = useState(null);
  const [filterHeat, setFilterHeat] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [dismissed, setDismissed] = useState(new Set());
  const [lastSearched, setLastSearched] = useState('');

  async function handleSearch() {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    setProspects(null);
    setSelected(new Set());
    setDismissed(new Set());
    setFilterHeat('All');

    try {
      const raw = await callAI(
        TERRITORY_SYSTEM_PROMPT,
        buildTerritoryUserPrompt(location, radius, industry)
      );
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Unexpected response format.');
      setProspects(parsed);
      setLastSearched(location);
    } catch (err) {
      console.error(err);
      setError(
        err.message.includes('API key')
          ? 'API key not configured. Check your .env file and see SETUP.md.'
          : `Error loading prospects: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  function handleToggleSelect(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  function handleDismiss(name) {
    setDismissed((prev) => new Set([...prev, name]));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  function handleExport() {
    if (!visible) return;
    const toExport = selected.size > 0
      ? visible.filter((p) => selected.has(p.name))
      : visible;
    exportToCSV(toExport, lastSearched);
  }

  const visible = prospects ? prospects.filter((p) => !dismissed.has(p.name)) : null;

  const filtered = visible
    ? filterHeat === 'All'
      ? visible
      : visible.filter((p) => p.heatScore === filterHeat)
    : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 tracking-tight leading-tight">Scout</div>
              <div className="text-[11px] text-slate-500 leading-tight">Territory Research</div>
            </div>
          </div>
          <div
            className="text-[10px] text-slate-600 uppercase tracking-widest font-mono"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Employbridge
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-5 py-8 space-y-5">
        <SearchPanel
          location={location}
          setLocation={setLocation}
          radius={radius}
          setRadius={setRadius}
          industry={industry}
          setIndustry={setIndustry}
          onSearch={handleSearch}
          loading={loading}
        />

        {loading && <Spinner />}

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
            />

            {/* Heat filter pills */}
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

            {/* Cards */}
            <div className="space-y-3">
              {filtered.map((company, i) => (
                <ProspectCard
                  key={company.name + i}
                  company={company}
                  index={i}
                  isSelected={selected.has(company.name)}
                  onToggleSelect={handleToggleSelect}
                  onDismiss={handleDismiss}
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
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-5 py-8 mt-4 border-t border-slate-800/60">
        <p className="text-xs text-slate-700 text-center">
          Scout v1.0 — Employbridge Internal Tool — AI-generated research, verify before use
        </p>
      </footer>
    </div>
  );
}
