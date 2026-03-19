// components/ProspectCard.jsx
import { useState } from 'react';
import { HeatBadge, BrandBadge, JobBadge } from './Badges';

export default function ProspectCard({ company, index, isSelected, onToggleSelect, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden fade-in-up ${
        isSelected
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600/70 hover:bg-slate-800/60'
      }`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <h3 className="text-slate-100 font-semibold text-[15px] leading-tight">{company.name}</h3>
              <HeatBadge score={company.heatScore} />
              {company.brand && <BrandBadge brand={company.brand} />}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>{company.industry}</span>
              <span className="text-slate-700">·</span>
              <span>{company.estimatedSize}</span>
              <span className="text-slate-700">·</span>
              <span>{company.address || company.location}</span>
            </div>
          </div>

          {/* Right: job badge + checkbox + dismiss */}
          <div className="flex items-center gap-2.5 shrink-0">
            <JobBadge count={company.openRoles} />
            <button
              onClick={() => onToggleSelect(company.name)}
              title={isSelected ? 'Remove from export' : 'Add to export'}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                isSelected
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              onClick={() => onDismiss(company.name)}
              title="Dismiss — not a viable prospect"
              className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 transition-all shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Heat reason */}
        {company.heatReason && (
          <p className="mt-2.5 text-xs text-slate-500 leading-relaxed">{company.heatReason}</p>
        )}

        {/* News signal */}
        {company.newsSignal && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <svg className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-amber-300/90 leading-relaxed">{company.newsSignal}</p>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? 'Hide details' : 'View talking points & open roles'}
        </button>

        {/* Talking points + job roles */}
        {expanded && (
          <div className="mt-3.5 space-y-2 fade-in-up" style={{ animationDelay: '0ms' }}>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Talking Points
            </p>
            {company.talkingPoints?.map((pt, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-relaxed">
                <span className="text-emerald-500 mt-0.5 shrink-0 font-semibold">→</span>
                <span>{pt}</span>
              </div>
            ))}

            {company.jobRoles?.length > 0 && (
              <div className="mt-3.5 pt-3.5 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Actively Hiring For
                  </p>
                  {company.hiringRecency && (
                    <span className="text-[10px] text-slate-500 italic">{company.hiringRecency}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {company.jobRoles.map((role, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300 border border-slate-600/40"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
