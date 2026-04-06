// views/CampaignView.jsx — Module 3: Campaign Content Generator
import { useState, useEffect } from 'react';
import { callAI } from '../api';
import { CAMPAIGN_SYSTEM_PROMPT, buildCampaignUserPrompt } from '../prompts';
import { saveGeneratedContent, getRecentGeneratedContent, saveProspectStatus } from '../storage';
import Spinner from '../components/Spinner';

const INDUSTRIES = [
  'Distribution / Warehouse', 'Manufacturing', 'Food & Beverage',
  'Automotive', 'Logistics / 3PL', 'E-Commerce Fulfillment', 'Other',
];
const BRANDS = ['ProLogistix', 'ResourceMFG', 'Both / Unsure'];
const TONES  = ['Consultative', 'Direct', 'Casual'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button onClick={copy}
      className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-slate-700/60 border border-slate-600/40 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function ContentBlock({ label, children, text }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-700/60 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60">
        <button onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-widest hover:text-slate-100 transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {label}
        </button>
        <CopyButton text={text} />
      </div>
      {open && <div className="px-4 py-3.5 bg-slate-900/40">{children}</div>}
    </div>
  );
}

function SequenceDisplay({ content, companyName }) {
  function downloadAll() {
    const parts = [
      `OUTREACH SEQUENCE — ${companyName}`,
      `${'='.repeat(50)}`,
      `\nINITIAL EMAIL`,
      `Subject: ${content.email.subject}`,
      `\n${content.email.body}`,
      `\n${'─'.repeat(40)}`,
      `\nVOICEMAIL SCRIPT`,
      content.voicemail,
      `\n${'─'.repeat(40)}`,
      `\nLINKEDIN MESSAGE`,
      content.linkedin,
      `\n${'─'.repeat(40)}`,
      ...(content.followUps || []).flatMap((f) => [
        `\nFOLLOW-UP — DAY ${f.day}`,
        `Subject: ${f.subject}`,
        `\n${f.body}`,
      ]),
    ].join('\n');

    const blob = new Blob([parts], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `campaign-${companyName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3 fade-in-up" style={{ animationDelay: '0ms' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">{companyName}</h3>
        <button onClick={downloadAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download .txt
        </button>
      </div>

      {content.email && (
        <ContentBlock label="Initial Email" text={`Subject: ${content.email.subject}\n\n${content.email.body}`}>
          <p className="text-xs font-semibold text-slate-500 mb-1">Subject</p>
          <p className="text-sm text-slate-200 mb-3">{content.email.subject}</p>
          <p className="text-xs font-semibold text-slate-500 mb-1">Body</p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content.email.body}</p>
        </ContentBlock>
      )}

      {content.voicemail && (
        <ContentBlock label="Voicemail Script" text={content.voicemail}>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content.voicemail}</p>
        </ContentBlock>
      )}

      {content.linkedin && (
        <ContentBlock label="LinkedIn Message" text={content.linkedin}>
          <p className="text-sm text-slate-300 leading-relaxed">{content.linkedin}</p>
          <p className="text-[10px] text-slate-600 mt-2">{content.linkedin.length} / 300 characters</p>
        </ContentBlock>
      )}

      {content.followUps?.map((f) => (
        <ContentBlock key={f.day} label={`Follow-Up — Day ${f.day}`} text={`Subject: ${f.subject}\n\n${f.body}`}>
          <p className="text-xs font-semibold text-slate-500 mb-1">Subject</p>
          <p className="text-sm text-slate-200 mb-3">{f.subject}</p>
          <p className="text-xs font-semibold text-slate-500 mb-1">Body</p>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{f.body}</p>
        </ContentBlock>
      ))}
    </div>
  );
}

export default function CampaignView({ prefill, onClearPrefill }) {
  const [companyName, setCompanyName] = useState('');
  const [industry,    setIndustry]    = useState('Distribution / Warehouse');
  const [brand,       setBrand]       = useState('Both / Unsure');
  const [tone,        setTone]        = useState('Consultative');
  const [context,     setContext]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [sequence,    setSequence]    = useState(null);
  const [activeCompany, setActiveCompany] = useState('');
  const [recent,      setRecent]      = useState([]);

  useEffect(() => {
    getRecentGeneratedContent(10).then(setRecent).catch(() => {});
  }, []);

  useEffect(() => {
    if (!prefill) return;
    setCompanyName(prefill.name || '');
    if (prefill.industry) setIndustry(prefill.industry);
    if (prefill.brand && prefill.brand !== 'Both') setBrand(prefill.brand);
    const contextLines = [];
    if (prefill.heatReason)          contextLines.push(`Why they're a prospect: ${prefill.heatReason}`);
    if (prefill.newsSignal)          contextLines.push(`Recent news: ${prefill.newsSignal}`);
    if (prefill.talkingPoints?.length) contextLines.push(`Key talking points:\n${prefill.talkingPoints.map((t) => `• ${t}`).join('\n')}`);
    if (prefill.jobRoles?.length)    contextLines.push(`Currently hiring: ${prefill.jobRoles.join(', ')}`);
    setContext(contextLines.join('\n\n'));
    setSequence(null);
    setError(null);
    onClearPrefill?.();
  }, [prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    if (!companyName.trim()) return;
    setLoading(true);
    setError(null);
    setSequence(null);

    const prospect = {
      companyName: companyName.trim(),
      industry,
      brand:      brand === 'Both / Unsure' ? undefined : brand,
      tone,
      context:    context.trim() || undefined,
      ...(prefill?.name === companyName.trim() ? {
        jobRoles:    prefill.jobRoles,
        newsSignal:  prefill.newsSignal,
        heatReason:  prefill.heatReason,
      } : {}),
    };

    try {
      const raw    = await callAI(CAMPAIGN_SYSTEM_PROMPT, buildCampaignUserPrompt(prospect));
      const parsed = JSON.parse(raw);
      const record = { ...parsed, id: `${Date.now()}`, companyName: prospect.companyName };

      await saveGeneratedContent(record);
      await saveProspectStatus(prospect.companyName, 'in-campaign').catch(() => {});
      setSequence(parsed);
      setActiveCompany(prospect.companyName);
      getRecentGeneratedContent(10).then(setRecent).catch(() => {});
    } catch (err) {
      console.error(err);
      setError(`Error generating content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">Campaign Generator</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Generate a full outreach sequence — email, voicemail, LinkedIn, and three follow-ups.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Company Name</label>
            <input type="text" value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && companyName.trim() && handleGenerate()}
              placeholder="e.g. Midwest Logistics Group"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none">
              {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Brand</label>
            <select value={brand} onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-emerald-500/60 transition-all cursor-pointer appearance-none">
              {BRANDS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Tone</label>
            <div className="flex gap-2">
              {TONES.map((t) => (
                <button key={t} onClick={() => setTone(t)}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                    tone === t
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              Context <span className="text-slate-600 normal-case font-normal">(optional)</span>
            </label>
            <textarea value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="Job postings, news, or anything specific about this company..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/60 transition-all resize-none"
            />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading || !companyName.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.99] tracking-wide">
          {loading ? 'Generating...' : 'Generate Outreach Sequence'}
        </button>
      </div>

      {recent.length > 0 && !loading && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-1">Recent Sequences</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCompanyName(c.companyName);
                  setSequence(c);
                  setActiveCompany(c.companyName);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeCompany === c.companyName
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {c.companyName}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <Spinner />}

      {error && (
        <div className="px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {sequence && !loading && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/30 p-6">
          <SequenceDisplay content={sequence} companyName={activeCompany} />
        </div>
      )}
    </div>
  );
}
