// components/ProspectCard.jsx
import { useState } from 'react';
import { HeatBadge, BrandBadge, JobBadge } from './Badges';

const STATUS_CONFIG = {
  'contacted':   { label: 'Contacted',   color: 'text-sky-400   border-sky-500/40   bg-sky-500/10'   },
  'in-campaign': { label: 'In Campaign', color: 'text-violet-400 border-violet-500/40 bg-violet-500/10' },
  'non-viable':  { label: 'Non-Viable',  color: 'text-slate-500  border-slate-600/40  bg-slate-700/20'  },
};

export default function ProspectCard({ company, index, isSelected, status, onToggleSelect, onSetStatus, onPrepForCall, onGenerateCampaign }) {
  const [expanded, setExpanded] = useState(false);
  const isNonViable = status === 'non-viable';

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden fade-in-up ${
        isNonViable
          ? 'border-slate-700/40 bg-slate-800/20 opacity-50'
          : isSelected
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
              {status && STATUS_CONFIG[status] && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_CONFIG[status].color}`}>
                  {STATUS_CONFIG[status].label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span>{company.industry}</span>
              <span className="text-slate-700">·</span>
              <span>{company.estimatedSize}</span>
              <span className="text-slate-700">·</span>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${company.name} ${company.address || company.location}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Verify on Google"
                className="hover:text-emerald-400 transition-colors underline decoration-dotted underline-offset-2"
                onClick={(e) => e.stopPropagation()}
              >
                {company.address || company.location}
              </a>
            </div>
          </div>

          {/* Right: job badge + checkbox + non-viable */}
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
              onClick={() => onSetStatus(company.name, 'non-viable')}
              title={isNonViable ? 'Clear non-viable status' : 'Mark as non-viable'}
              className={`w-5 h-5 rounded flex items-center justify-center transition-all shrink-0 ${
                isNonViable
                  ? 'text-slate-400 bg-slate-700/60'
                  : 'text-slate-600 hover:text-slate-300 hover:bg-slate-700/60'
              }`}
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

        {/* Status buttons */}
        <div className="mt-3 flex items-center gap-2">
          {['contacted', 'in-campaign'].map((s) => (
            <button
              key={s}
              onClick={() => onSetStatus(company.name, s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                status === s
                  ? STATUS_CONFIG[s].color
                  : 'border-slate-700 text-slate-600 hover:border-slate-500 hover:text-slate-400'
              }`}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>

        {/* Action row */}
        <div className="mt-2 flex items-center gap-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors"
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
        {onPrepForCall && (
          <button onClick={() => onPrepForCall(company)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Prep for call
          </button>
        )}
        {onGenerateCampaign && (
          <button onClick={() => onGenerateCampaign(company)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Generate campaign
          </button>
        )}
        </div>

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
