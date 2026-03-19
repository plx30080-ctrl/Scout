// views/RoutePlannerView.jsx

export default function RoutePlannerView() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-8 text-center space-y-3">
      <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center mx-auto">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-slate-200 font-semibold text-base">Route Planner</h2>
      <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
        Pin prospects and clients on a map, cluster them into day routes, and export a weekly schedule to your calendar.
      </p>
      <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">Coming soon</p>
    </div>
  );
}
