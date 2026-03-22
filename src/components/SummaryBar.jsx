// components/SummaryBar.jsx

export default function SummaryBar({ prospects, selectedCount, dismissedCount, onExport, usedMaps }) {
  const hot = prospects.filter((p) => p.heatScore === 'Hot').length;
  const warm = prospects.filter((p) => p.heatScore === 'Warm').length;
  const totalRoles = prospects.reduce((sum, p) => sum + (p.openRoles || 0), 0);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/50 overflow-hidden">
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 flex-wrap gap-y-3">
      <div className="flex items-center gap-4 text-sm flex-wrap gap-y-2">
        <span className="text-slate-400 font-medium">{prospects.length} prospects</span>
        <span className="text-slate-700 hidden sm:inline">|</span>
        <span className="text-red-400 font-semibold">{hot} hot</span>
        <span className="text-amber-400 font-semibold">{warm} warm</span>
        {totalRoles > 0 && (
          <span className="text-violet-400 font-semibold">{totalRoles} open roles</span>
        )}
        {dismissedCount > 0 && (
          <span className="text-slate-600 font-medium">{dismissedCount} dismissed</span>
        )}
      </div>
      <button
        onClick={onExport}
        title={selectedCount > 0 ? `Export ${selectedCount} selected` : `Export all ${prospects.length} prospects`}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {selectedCount > 0 ? `Export ${selectedCount} selected` : `Export all (${prospects.length})`}
      </button>
    </div>
    {usedMaps && (
      <div className="px-5 py-2 border-t border-slate-700/40 flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#34A853"/>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13V2z" fill="#4285F4"/>
          <circle cx="12" cy="9" r="2.5" fill="white"/>
        </svg>
        <span className="text-[10px] text-slate-600">Business locations sourced from Azure Maps · Intelligence from Bing Search</span>
      </div>
    )}
    </div>
  );
}
