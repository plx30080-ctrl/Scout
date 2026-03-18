// components/Spinner.jsx
export default function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 spin"
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-t-emerald-300/40 spin-reverse"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-emerald-400/60" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
      <div className="space-y-1 text-center">
        <p className="text-slate-400 text-sm tracking-widest uppercase" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
          Scouting territory
        </p>
        <p className="text-slate-600 text-xs">Analyzing prospects and hiring signals...</p>
      </div>
    </div>
  );
}
