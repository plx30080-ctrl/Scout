// components/Badges.jsx

const HEAT_CONFIG = {
  Hot: {
    bg: 'bg-red-500/15',
    border: 'border-red-500/35',
    text: 'text-red-400',
    dot: 'bg-red-400',
  },
  Warm: {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/35',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  Cold: {
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/35',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
  },
};

const BRAND_CONFIG = {
  ProLogistix: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300' },
  ResourceMFG: { bg: 'bg-orange-500/15', border: 'border-orange-500/30', text: 'text-orange-300' },
  Both: { bg: 'bg-violet-500/15', border: 'border-violet-500/30', text: 'text-violet-300' },
};

export function HeatBadge({ score }) {
  const cfg = HEAT_CONFIG[score] || HEAT_CONFIG.Cold;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`}
        style={{ animation: 'pulse 2s ease-in-out infinite' }}
      />
      {score}
    </span>
  );
}

export function BrandBadge({ brand }) {
  if (!brand) return null;
  const cfg = BRAND_CONFIG[brand] || BRAND_CONFIG.Both;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      {brand}
    </span>
  );
}

export function JobBadge({ count }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-500/15 border border-violet-500/30 text-violet-300">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      {count} open {count === 1 ? 'role' : 'roles'}
    </span>
  );
}
