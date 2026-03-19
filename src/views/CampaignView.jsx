// views/CampaignView.jsx

export default function CampaignView() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-8 text-center space-y-3">
      <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center mx-auto">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h2 className="text-slate-200 font-semibold text-base">Campaign Content Generator</h2>
      <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
        Generate personalized outreach emails, voicemail scripts, LinkedIn messages, and follow-up sequences for any prospect type.
      </p>
      <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold">Coming soon</p>
    </div>
  );
}
