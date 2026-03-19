// components/CallPrepCard.jsx
// Displays a generated call prep card with collapsible sections.
import { useState } from 'react';

const SECTIONS = [
  { key: 'likelyPainPoints',       label: 'Pain Points',       icon: '⚡' },
  { key: 'suggestedTalkingPoints', label: 'Talking Points',    icon: '💬' },
  { key: 'questionsToAsk',         label: 'Questions to Ask',  icon: '❓' },
  { key: 'objectionHandling',      label: 'Objection Handling',icon: '🛡' },
  { key: 'brandFit',               label: 'Brand Fit',         icon: '🎯' },
  { key: 'iceBreakers',            label: 'Ice Breakers',      icon: '🤝' },
];

function Section({ label, icon, children, open, onToggle }) {
  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden print-section">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800/80 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-widest">
          <span className="text-base leading-none">{icon}</span>
          {label}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3.5 bg-slate-900/40 space-y-2 fade-in-up" style={{ animationDelay: '0ms' }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function CallPrepCard({ card, companyName, onPrint }) {
  const allKeys = SECTIONS.map((s) => s.key);
  const [openSections, setOpenSections] = useState(new Set(allKeys));

  function toggle(key) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setOpenSections((prev) => prev.size === allKeys.length ? new Set() : new Set(allKeys));
  }

  return (
    <div className="space-y-4 fade-in-up" style={{ animationDelay: '0ms' }}>
      {/* Card header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 leading-tight">{companyName}</h2>
          {card.companySnapshot && (
            <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{card.companySnapshot}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleAll}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
          >
            {openSections.size === allKeys.length ? 'Collapse all' : 'Expand all'}
          </button>
          <button
            onClick={onPrint}
            title="Print / Save as PDF"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="space-y-2">
        {SECTIONS.map((s) => (
          <Section
            key={s.key}
            label={s.label}
            icon={s.icon}
            open={openSections.has(s.key)}
            onToggle={() => toggle(s.key)}
          >
            {/* Pain Points, Talking Points, Questions, Ice Breakers — string arrays */}
            {['likelyPainPoints', 'suggestedTalkingPoints', 'questionsToAsk', 'iceBreakers'].includes(s.key) &&
              Array.isArray(card[s.key]) &&
              card[s.key].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                  <span className="text-emerald-500 shrink-0 mt-0.5 font-bold">→</span>
                  <span>{item}</span>
                </div>
              ))
            }

            {/* Objection Handling — array of {objection, response} */}
            {s.key === 'objectionHandling' &&
              Array.isArray(card.objectionHandling) &&
              card.objectionHandling.map((item, i) => (
                <div key={i} className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-400">"{item.objection}"</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.response}</p>
                </div>
              ))
            }

            {/* Brand Fit — single string */}
            {s.key === 'brandFit' && typeof card.brandFit === 'string' && (
              <p className="text-sm text-slate-300 leading-relaxed">{card.brandFit}</p>
            )}
          </Section>
        ))}
      </div>
    </div>
  );
}
