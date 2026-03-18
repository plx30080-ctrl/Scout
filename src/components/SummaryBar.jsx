// components/SummaryBar.jsx

export default function SummaryBar({ prospects, selectedCount, onExport }) {
  const hot = prospects.filter((p) => p.heatScore === 'Hot').length;
  const warm = prospects.filter((p) => p.heatScore === 'Warm').length;
  const totalRoles = prospects.reduce((sum, p) => sum + (p.openRoles || 0), 0);

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 bg-slate-800/50 border border-slate-700/60 rounded-xl flex-wrap gap-y-3">
      <div className="flex items-center gap-4 text-sm flex-wrap gap-y-2">
        <span className="text-slate-400 font-medium">{prospects.length} prospects</span>
        <span className="text-slate-700 hidden sm:inline">|</span>
        <span className="text-red-400 font-semibold">{hot} hot</span>
        <span className="text-amber-400 font-semibold">{warm} warm</span>
        {totalRoles > 0 && (
          <span className="text-violet-400 font-semibold">{totalRoles} open roles</span>
        )}
      </div>
      <button
        onClick={onExport}
        disabled={selectedCount === 0}
        title={selectedCount === 0 ? 'Check boxes on cards to select for export' : `Export ${selectedCount} selected`}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {selectedCount > 0 ? `Export ${selectedCount} selected` : 'Export CSV'}
      </button>
    </div>
  );
}
