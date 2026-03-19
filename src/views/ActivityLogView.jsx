// views/ActivityLogView.jsx

export default function ActivityLogView() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-8 text-center space-y-3">
      <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center mx-auto">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h2 className="text-slate-200 font-semibold text-base">Activity Log</h2>
      <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
        Log visits, calls, and emails. AI surfaces coaching nudges based on your activity patterns and account coverage.
      </p>
      <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">Coming soon</p>
    </div>
  );
}
