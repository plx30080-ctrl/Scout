// components/SearchPanel.jsx

const INDUSTRIES = [
  'All Industries',
  'Distribution / Warehouse',
  'Manufacturing',
  'Food & Beverage',
  'Automotive',
  'Logistics / 3PL',
  'E-Commerce Fulfillment',
];

const RADIUS_OPTIONS = ['10 miles', '25 miles', '50 miles', '100 miles'];

export default function SearchPanel({ location, setLocation, radius, setRadius, industry, setIndustry, onSearch, loading }) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">Territory Research</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Enter a market area to surface prospects, active hiring signals, and ready-to-use talking points.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Location */}
        <div className="sm:col-span-1 flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && location.trim() && onSearch()}
            placeholder="City, state or zip"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Radius */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Radius
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Industry */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Industry
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none"
          >
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onSearch}
        disabled={loading || !location.trim()}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] tracking-wide"
      >
        {loading ? 'Scouting...' : 'Scout This Territory'}
      </button>
    </div>
  );
}
