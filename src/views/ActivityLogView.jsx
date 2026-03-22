// views/ActivityLogView.jsx — Module 5: Activity Log + Coaching Nudges
import { useState, useEffect, useCallback } from 'react';
import { callAI } from '../api';
import { COACHING_SYSTEM_PROMPT, buildCoachingUserPrompt } from '../prompts';
import {
  logActivity,
  getActivities,
  getActivitySummaryForCoaching,
  getPinnedStops,
} from '../storage';

const ACTIVITY_TYPES = ['Visit', 'Call', 'Email', 'Demo'];
const OUTCOMES       = ['Interested', 'Follow-Up Set', 'Not Now', 'Dead', 'Left Message', 'No Answer'];

const NUDGE_COLORS = {
  gap:         'border-amber-500/30 bg-amber-500/8',
  pattern:     'border-sky-500/30 bg-sky-500/8',
  opportunity: 'border-emerald-500/30 bg-emerald-500/8',
  win:         'border-violet-500/30 bg-violet-500/8',
};
const NUDGE_ICON_COLORS = {
  gap: 'text-amber-400', pattern: 'text-sky-400',
  opportunity: 'text-emerald-400', win: 'text-violet-400',
};
const NUDGE_URGENCY_DOTS = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-slate-500' };

const COACHING_CACHE_KEY  = 'scout_coaching_nudges';
const COACHING_CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 hours

function groupByDate(activities) {
  const groups = {};
  for (const a of activities) {
    const day = new Date(a.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groups[day]) groups[day] = [];
    groups[day].push(a);
  }
  return groups;
}

function NudgeCard({ nudge, onDismiss }) {
  return (
    <div className={`rounded-xl border p-4 space-y-1.5 fade-in-up ${NUDGE_COLORS[nudge.type] || 'border-slate-700/60 bg-slate-800/30'}`}
      style={{ animationDelay: '0ms' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${NUDGE_URGENCY_DOTS[nudge.urgency] || 'bg-slate-500'}`} />
          <p className={`text-xs font-semibold uppercase tracking-wide ${NUDGE_ICON_COLORS[nudge.type] || 'text-slate-400'}`}>
            {nudge.type}
          </p>
        </div>
        <button onClick={onDismiss}
          className="text-slate-600 hover:text-slate-400 transition-colors shrink-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-sm font-semibold text-slate-200">{nudge.title}</p>
      <p className="text-xs text-slate-400 leading-relaxed">{nudge.body}</p>
    </div>
  );
}

function ActivityRow({ activity }) {
  const typeColors = {
    Visit: 'text-emerald-400 bg-emerald-500/10',
    Call:  'text-sky-400 bg-sky-500/10',
    Email: 'text-violet-400 bg-violet-500/10',
    Demo:  'text-amber-400 bg-amber-500/10',
  };
  const outcomeColors = {
    'Interested':    'text-emerald-400',
    'Follow-Up Set': 'text-sky-400',
    'Not Now':       'text-slate-400',
    'Dead':          'text-red-400',
    'Left Message':  'text-amber-400',
    'No Answer':     'text-slate-500',
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-0">
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 mt-0.5 ${typeColors[activity.type] || 'text-slate-400 bg-slate-700/40'}`}>
        {activity.type}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{activity.prospectName}</p>
        {activity.notes && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{activity.notes}</p>}
      </div>
      <span className={`text-xs shrink-0 font-medium ${outcomeColors[activity.outcome] || 'text-slate-500'}`}>
        {activity.outcome}
      </span>
    </div>
  );
}

export default function ActivityLogView() {
  const [type,        setType]        = useState('Visit');
  const [prospect,    setProspect]    = useState('');
  const [outcome,     setOutcome]     = useState('Interested');
  const [notes,       setNotes]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [activities,  setActivities]  = useState([]);
  const [nudges,      setNudges]      = useState([]);
  const [dismissedNudges, setDismissedNudges] = useState(new Set());
  const [loadingNudges, setLoadingNudges] = useState(false);

  const loadActivities = useCallback(async () => {
    const data = await getActivities(90).catch(() => []);
    setActivities(data);
  }, []);

  // Load activities on mount
  useEffect(() => { loadActivities(); }, [loadActivities]);

  // Load or generate coaching nudges on mount
  useEffect(() => {
    async function loadNudges() {
      // Check cache first
      try {
        const cached = JSON.parse(localStorage.getItem(COACHING_CACHE_KEY) || 'null');
        if (cached && (Date.now() - cached.timestamp) < COACHING_CACHE_TTL) {
          setNudges(cached.nudges);
          return;
        }
      } catch {}

      // Need fresh nudges — check if there's enough activity data
      const summary = await getActivitySummaryForCoaching().catch(() => []);
      if (summary.length === 0) return;

      setLoadingNudges(true);
      try {
        const stops = await getPinnedStops().catch(() => []);
        const raw   = await callAI(COACHING_SYSTEM_PROMPT, buildCoachingUserPrompt(summary, stops));
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setNudges(parsed);
          localStorage.setItem(COACHING_CACHE_KEY, JSON.stringify({ nudges: parsed, timestamp: Date.now() }));
        }
      } catch (err) {
        console.warn('Coaching nudges failed:', err.message);
      } finally {
        setLoadingNudges(false);
      }
    }
    loadNudges();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLog() {
    if (!prospect.trim()) return;
    setSaving(true);
    try {
      await logActivity({ prospectName: prospect.trim(), type, outcome, notes: notes.trim() || undefined });
      setProspect('');
      setNotes('');
      await loadActivities();
    } catch (err) {
      console.error('Failed to log activity:', err);
    } finally {
      setSaving(false);
    }
  }

  const visibleNudges = nudges.filter((_, i) => !dismissedNudges.has(i));
  const grouped       = groupByDate(activities);

  return (
    <div className="space-y-5">
      {/* Coaching nudges */}
      {loadingNudges && (
        <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
          <div className="w-3 h-3 rounded-full border border-slate-600 border-t-emerald-400 spin" />
          Generating coaching insights...
        </div>
      )}

      {visibleNudges.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1">Coaching Insights</p>
          {visibleNudges.map((nudge, i) => (
            <NudgeCard key={i} nudge={nudge}
              onDismiss={() => setDismissedNudges((prev) => new Set([...prev, nudges.indexOf(nudge)]))} />
          ))}
        </div>
      )}

      {/* Log form */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">Log Activity</h2>
          <p className="text-sm text-slate-400">Quick-log a visit, call, or email to keep your pipeline up to date.</p>
        </div>

        {/* Activity type pills */}
        <div className="flex gap-2">
          {ACTIVITY_TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                type === t
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Prospect / Account</label>
            <input type="text" value={prospect}
              onChange={(e) => setProspect(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !saving && prospect.trim() && handleLog()}
              placeholder="Company name"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Outcome</label>
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none">
              {OUTCOMES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Notes <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Quick note on the conversation..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 transition-all"
            />
          </div>
        </div>

        <button onClick={handleLog} disabled={saving || !prospect.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99]">
          {saving ? 'Saving...' : `Log ${type}`}
        </button>
      </div>

      {/* Activity history */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1">Recent Activity</p>
          {Object.entries(grouped).map(([day, dayActivities]) => (
            <div key={day} className="rounded-xl border border-slate-700/60 bg-slate-800/30 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{day}</p>
              </div>
              <div className="px-4">
                {dayActivities.map((a) => <ActivityRow key={a.id} activity={a} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loadingNudges && (
          <div className="text-center text-slate-600 py-10 text-sm">
            No activity logged yet. Start logging visits and calls to track your pipeline.
          </div>
        )
      )}
    </div>
  );
}
