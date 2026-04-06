// views/RoutePlannerView.jsx — Module 2: Route Planner + Week Scheduler
import { useState, useEffect, useCallback } from 'react';
import { callAI } from '../api';
import { ROUTE_SYSTEM_PROMPT, buildRouteUserPrompt } from '../prompts';
import { geocodeLocation } from '../placesApi';
import { savePinnedStop, getPinnedStops, deletePinnedStop, getLatestSearch } from '../storage';
import { exportScheduleToICS } from '../utils/icalExport';
import RouteMap from '../components/RouteMap';
import WeekSchedule from '../components/WeekSchedule';
import Spinner from '../components/Spinner';

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function RoutePlannerView() {
  const [stops,     setStops]     = useState([]);
  const [schedule,  setSchedule]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error,     setError]     = useState(null);

  // Add-stop form
  const [addName,    setAddName]    = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addType,    setAddType]    = useState('prospect');

  // Home base (starting location for route)
  const [homeAddress, setHomeAddress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scout_home_base') || 'null')?.address || ''; } catch { return ''; }
  });
  const [homeBase, setHomeBase] = useState(() => {
    try { return JSON.parse(localStorage.getItem('scout_home_base') || 'null'); } catch { return null; }
  });
  const [savingHome, setSavingHome] = useState(false);

  // Import from territory
  const [showImport, setShowImport]         = useState(false);
  const [importProspects, setImportProspects] = useState([]);
  const [importSelected, setImportSelected]   = useState(new Set());
  const [importing, setImporting]             = useState(false);

  const loadStops = useCallback(async () => {
    const data = await getPinnedStops().catch(() => []);
    setStops(data);
  }, []);

  useEffect(() => { loadStops(); }, [loadStops]);

  async function handleAddStop(e) {
    e.preventDefault();
    if (!addName.trim() || !addAddress.trim()) return;
    setGeocoding(true);
    setError(null);

    try {
      const geo  = await geocodeLocation(addAddress.trim());
      const stop = {
        id:      uuid(),
        name:    addName.trim(),
        address: geo.formattedAddress || addAddress.trim(),
        lat:     geo.lat,
        lng:     geo.lng,
        type:    addType,
      };
      await savePinnedStop(stop);
      setAddName('');
      setAddAddress('');
      await loadStops();
    } catch (err) {
      setError(`Could not locate "${addAddress}". Try a full street address.`);
    } finally {
      setGeocoding(false);
    }
  }

  async function handleRemoveStop(id) {
    await deletePinnedStop(id).catch(() => {});
    await loadStops();
    setSchedule(null);
  }

  async function handleSaveHomeBase() {
    if (!homeAddress.trim()) {
      localStorage.removeItem('scout_home_base');
      setHomeBase(null);
      return;
    }
    setSavingHome(true);
    setError(null);
    try {
      const geo = await geocodeLocation(homeAddress.trim());
      const hb  = { address: geo.formattedAddress || homeAddress.trim(), lat: geo.lat, lng: geo.lng };
      setHomeBase(hb);
      setHomeAddress(hb.address);
      localStorage.setItem('scout_home_base', JSON.stringify(hb));
    } catch {
      setError('Could not locate that starting address. Try a full street address.');
    } finally {
      setSavingHome(false);
    }
  }

  async function handleShowImport() {
    const latest = await getLatestSearch().catch(() => null);
    if (!latest?.data?.length) {
      setError('No territory search found. Run a territory search first.');
      return;
    }
    setImportProspects(latest.data);
    setImportSelected(new Set());
    setShowImport(true);
  }

  function toggleImport(name) {
    setImportSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  async function handleImportSelected() {
    if (importSelected.size === 0) return;
    setImporting(true);
    setError(null);
    const existingNames = new Set(stops.map((s) => s.name));
    const toAdd = importProspects.filter((p) => importSelected.has(p.name) && !existingNames.has(p.name));

    const failed = [];
    for (const p of toAdd) {
      try {
        const geo  = await geocodeLocation(p.address);
        const stop = {
          id:      uuid(),
          name:    p.name,
          address: geo.formattedAddress || p.address,
          lat:     geo.lat,
          lng:     geo.lng,
          type:    'prospect',
        };
        await savePinnedStop(stop);
      } catch {
        failed.push(p.name);
      }
    }
    await loadStops();
    setShowImport(false);
    setImporting(false);
    if (failed.length > 0) {
      setError(`Could not locate ${failed.length} stop${failed.length > 1 ? 's' : ''}: ${failed.join(', ')}. Try adding them manually with a full street address.`);
    }
  }

  async function handleGenerateRoute() {
    if (stops.length < 2) return;
    setLoading(true);
    setError(null);
    setSchedule(null);

    try {
      const raw    = await callAI(ROUTE_SYSTEM_PROMPT, buildRouteUserPrompt(stops, homeBase));
      const parsed = JSON.parse(raw);
      if (!parsed.week) throw new Error('Unexpected response format.');

      // Re-attach full stop data to each scheduled stop
      const stopMap = Object.fromEntries(stops.map((s) => [s.id, s]));
      const enriched = {
        ...parsed,
        week: parsed.week.map((day) => ({
          ...day,
          stops: day.stops.map((s) => ({ ...stopMap[s.id], ...s })).filter((s) => s.name),
        })),
      };
      setSchedule(enriched);
    } catch (err) {
      setError(`Route generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Stop management */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">Route Planner</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Pin prospects and clients, then generate an AI-optimized weekly schedule.
          </p>
        </div>

        {/* Add stop form */}
        <form onSubmit={handleAddStop} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Name</label>
              <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                placeholder="Acme Distribution"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Address</label>
              <input type="text" value={addAddress} onChange={(e) => setAddAddress(e.target.value)}
                placeholder="123 Main St, Granite City, IL"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 transition-all" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Type</label>
              <div className="flex gap-2 h-full items-end">
                {['prospect', 'client'].map((t) => (
                  <button type="button" key={t} onClick={() => setAddType(t)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      addType === t
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}>{t}</button>
                ))}
                <button type="submit" disabled={geocoding || !addName.trim() || !addAddress.trim()}
                  className="flex-none px-4 py-2.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {geocoding ? '...' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Home base / starting location */}
        <div className="pt-3 border-t border-slate-700/40 space-y-2">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Starting Location <span className="text-slate-600 normal-case font-normal">(optional — used to anchor each day's route)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={homeAddress}
              onChange={(e) => setHomeAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveHomeBase()}
              placeholder="e.g. 123 Office Pkwy, St. Louis, MO"
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 transition-all"
            />
            <button
              type="button"
              onClick={handleSaveHomeBase}
              disabled={savingHome}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 disabled:opacity-40 transition-all"
            >
              {savingHome ? '...' : homeBase ? 'Update' : 'Set'}
            </button>
          </div>
          {homeBase && (
            <p className="text-[11px] text-emerald-400/70">Starting from: {homeBase.address}</p>
          )}
        </div>

        {/* Import from territory list */}
        <div className="pt-3 border-t border-slate-700/40">
          {!showImport ? (
            <button
              type="button"
              onClick={handleShowImport}
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import from Territory List
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-300">
                  Select prospects to add ({importSelected.size} selected)
                </p>
                <button
                  type="button"
                  onClick={() => setShowImport(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {importProspects.map((p) => {
                  const alreadyAdded = stops.some((s) => s.name === p.name);
                  return (
                    <label
                      key={p.name}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        alreadyAdded
                          ? 'opacity-40 cursor-not-allowed'
                          : importSelected.has(p.name)
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-slate-800/40 border border-transparent hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={alreadyAdded}
                        checked={importSelected.has(p.name)}
                        onChange={() => !alreadyAdded && toggleImport(p.name)}
                        className="accent-emerald-500 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 truncate">{p.address || p.location}</p>
                      </div>
                      <span className={`text-[10px] font-semibold shrink-0 ${
                        p.heatScore === 'Hot' ? 'text-rose-400' :
                        p.heatScore === 'Warm' ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {alreadyAdded ? 'Added' : p.heatScore}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportSelected(new Set(
                    importProspects.filter((p) => !stops.some((s) => s.name === p.name)).map((p) => p.name)
                  ))}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={handleImportSelected}
                  disabled={importing || importSelected.size === 0}
                  className="ml-auto px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {importing ? 'Adding...' : `Add ${importSelected.size} Stop${importSelected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Map */}
      {stops.length > 0 && (
        <div className="relative">
          <RouteMap stops={stops} />
        </div>
      )}

      {/* Pinned stops list */}
      {stops.length > 0 && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
          <div className="px-5 py-3 bg-slate-800/60 border-b border-slate-700/40 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400">{stops.length} pinned stops</p>
            <button
              onClick={handleGenerateRoute}
              disabled={loading || stops.length < 2}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Generating...' : 'Generate Weekly Route'}
            </button>
          </div>
          <div className="divide-y divide-slate-800/60">
            {stops.map((stop) => (
              <div key={stop.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${stop.type === 'client' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{stop.name}</p>
                  <p className="text-xs text-slate-500 truncate">{stop.address}</p>
                </div>
                <span className="text-[10px] text-slate-600 capitalize shrink-0">{stop.type}</span>
                <button onClick={() => handleRemoveStop(stop.id)}
                  className="text-slate-600 hover:text-slate-300 transition-colors shrink-0 ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {stops.length === 0 && (
        <div className="text-center text-slate-600 py-10 text-sm">
          Add at least two stops above to generate a route.
        </div>
      )}

      {loading && <Spinner />}

      {/* Weekly schedule */}
      {schedule && !loading && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Weekly Schedule</h3>
            <button
              onClick={() => exportScheduleToICS(schedule)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Export to Calendar
            </button>
          </div>
          <WeekSchedule schedule={schedule} onScheduleChange={setSchedule} />
        </div>
      )}
    </div>
  );
}
