// views/CallPrepView.jsx
import { useState, useEffect } from 'react';
import { callAI } from '../api';
import { CALL_PREP_SYSTEM_PROMPT, buildCallPrepUserPrompt } from '../prompts';
import { saveCallPrepCard, getCallPrepCard, getRecentCallPrepCards } from '../storage';
import CallPrepCard from '../components/CallPrepCard';
import Spinner from '../components/Spinner';

const INDUSTRIES = [
  'Distribution / Warehouse',
  'Manufacturing',
  'Food & Beverage',
  'Automotive',
  'Logistics / 3PL',
  'E-Commerce Fulfillment',
  'Other',
];

const BRANDS = ['ProLogistix', 'ResourceMFG', 'Both / Unsure'];

export default function CallPrepView({ prefill, onClearPrefill }) {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Distribution / Warehouse');
  const [brand, setBrand] = useState('Both / Unsure');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [card, setCard] = useState(null);
  const [activeCompany, setActiveCompany] = useState('');
  const [recentCards, setRecentCards] = useState([]);

  // Load recent cards on mount
  useEffect(() => {
    getRecentCallPrepCards(10).then(setRecentCards).catch(() => {});
  }, []);

  // Apply prefill from Territory Research "Prep for Call" button
  useEffect(() => {
    if (!prefill) return;
    setCompanyName(prefill.name || '');
    if (prefill.industry) setIndustry(prefill.industry);
    if (prefill.brand && prefill.brand !== 'Both') setBrand(prefill.brand);
    setNotes('');
    setCard(null);
    setError(null);
    onClearPrefill?.();
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    if (!companyName.trim()) return;
    setLoading(true);
    setError(null);
    setCard(null);

    const company = {
      name: companyName.trim(),
      industry,
      brand: brand === 'Both / Unsure' ? undefined : brand,
      notes: notes.trim() || undefined,
      // If prefill had richer data, it was already set and we pass it along
      ...(prefill?.name === companyName.trim() ? prefill : {}),
    };

    try {
      const raw = await callAI(CALL_PREP_SYSTEM_PROMPT, buildCallPrepUserPrompt(company));
      const parsed = JSON.parse(raw);
      const cardData = { ...parsed, prospectName: company.name };

      await saveCallPrepCard(cardData);
      setCard(cardData);
      setActiveCompany(company.name);
      // Refresh recent list
      getRecentCallPrepCards(10).then(setRecentCards).catch(() => {});
    } catch (err) {
      console.error(err);
      setError(`Error generating card: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadRecent(prospectName) {
    const existing = await getCallPrepCard(prospectName);
    if (existing) {
      setCard(existing);
      setActiveCompany(prospectName);
      setCompanyName(prospectName);
      setError(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-5">
      {/* Input form */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">Call Prep</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Generate a one-pager before any call — pain points, talking points, discovery questions, and objection handling.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Company name */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Company Name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && companyName.trim() && handleGenerate()}
              placeholder="e.g. Acme Distribution LLC"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Industry */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Industry
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none"
            >
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>

          {/* Brand */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Brand
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none"
            >
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          {/* Optional context */}
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Additional Context <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste a job posting, news snippet, or any intel you have on this company..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !companyName.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] tracking-wide"
        >
          {loading ? 'Generating...' : 'Generate Call Prep Card'}
        </button>
      </div>

      {/* Recent cards */}
      {recentCards.length > 0 && !loading && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1">
            Recent Cards
          </p>
          <div className="flex flex-wrap gap-2">
            {recentCards.map((c) => (
              <button
                key={c.prospectName}
                onClick={() => handleLoadRecent(c.prospectName)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeCompany === c.prospectName
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                {c.prospectName}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner />}

      {error && (
        <div className="px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm leading-relaxed">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {card && !loading && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6">
          <CallPrepCard
            card={card}
            companyName={activeCompany}
            onPrint={handlePrint}
          />
        </div>
      )}
    </div>
  );
}
