// views/ProspectDatabaseView.jsx — Accounts / Prospect Database
import { useState, useEffect, useCallback } from 'react';
import { getAllProspects, saveProspect, deleteProspect } from '../storage';
import Spinner from '../components/Spinner';

const STATUSES = ['prospect', 'contacted', 'in-campaign', 'customer', 'non-viable'];

const STATUS_COLORS = {
  prospect:      'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  contacted:     'text-sky-400 border-sky-500/40 bg-sky-500/10',
  'in-campaign': 'text-violet-400 border-violet-500/40 bg-violet-500/10',
  customer:      'text-green-400 border-green-500/40 bg-green-500/10',
  'non-viable':  'text-slate-500 border-slate-600/40 bg-slate-700/20',
};

const HEAT_COLORS = {
  Hot:  'text-red-400 border-red-500/40 bg-red-500/10',
  Warm: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
  Cold: 'text-slate-400 border-slate-600/40 bg-slate-700/20',
};

const INDUSTRIES = [
  'Distribution / Warehouse',
  'Manufacturing',
  'Food & Beverage',
  'Automotive',
  'Logistics / 3PL',
  'E-Commerce Fulfillment',
  'Other',
];

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emptyProspect() {
  return {
    id: '',
    companyName: '',
    address: '',
    industry: '',
    phone: '',
    website: '',
    status: 'prospect',
    heatScore: '',
    notes: '',
    contacts: [],
  };
}

function emptyContact() {
  return { id: uuid(), name: '', title: '', phone: '', email: '', linkedin: '' };
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── ProspectModal ─────────────────────────────────────────────────────────────
function ProspectModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(() => ({
    ...emptyProspect(),
    ...initial,
    contacts: initial?.contacts ? [...initial.contacts] : [],
  }));
  const [saving, setSaving] = useState(false);

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function updateContact(idx, updated) {
    setForm((f) => {
      const contacts = [...f.contacts];
      contacts[idx] = updated;
      return { ...f, contacts };
    });
  }

  function addContact() {
    setForm((f) => ({ ...f, contacts: [...f.contacts, emptyContact()] }));
  }

  function removeContact(idx) {
    setForm((f) => ({ ...f, contacts: f.contacts.filter((_, i) => i !== idx) }));
  }

  function contactField(idx, key) {
    return (e) => {
      updateContact(idx, { ...form.contacts[idx], [key]: e.target.value });
    };
  }

  async function handleSave() {
    if (!form.companyName.trim() || saving) return;
    setSaving(true);
    try {
      const saved = await saveProspect(form);
      onSave(saved);
    } finally {
      setSaving(false);
    }
  }

  const isNew = !initial?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-slate-900 border-b border-slate-700/50 rounded-t-2xl">
          <h2 className="text-sm font-semibold text-slate-100">
            {isNew ? 'New Account' : 'Edit Account'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Company Name */}
          <div>
            <label className="field-label">Company Name <span className="text-red-400">*</span></label>
            <input
              value={form.companyName}
              onChange={field('companyName')}
              placeholder="Acme Distribution Co."
              className="input-base"
              autoFocus
            />
          </div>

          {/* Status + Heat Score */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Status</label>
              <select value={form.status} onChange={field('status')} className="input-base">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Heat Score</label>
              <select value={form.heatScore} onChange={field('heatScore')} className="input-base">
                <option value="">— None —</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="field-label">Address</label>
            <input
              value={form.address}
              onChange={field('address')}
              placeholder="123 Main St, City, ST 00000"
              className="input-base"
            />
          </div>

          {/* Industry + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Industry</label>
              <select value={form.industry} onChange={field('industry')} className="input-base">
                <option value="">— Select —</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input
                value={form.phone}
                onChange={field('phone')}
                placeholder="(618) 555-0100"
                className="input-base"
              />
            </div>
          </div>

          {/* Website */}
          <div>
            <label className="field-label">Website</label>
            <input
              value={form.website}
              onChange={field('website')}
              placeholder="acmedistribution.com"
              className="input-base"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="field-label">Notes</label>
            <textarea
              value={form.notes}
              onChange={field('notes')}
              placeholder="Key notes, context, next steps…"
              className="input-base min-h-[80px] resize-y"
            />
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="field-label mb-0">Contacts</span>
              <button
                onClick={addContact}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                + Add Contact
              </button>
            </div>

            <div className="space-y-2">
              {form.contacts.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-2"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={c.name}
                      onChange={contactField(i, 'name')}
                      placeholder="Name"
                      className="input-sm"
                    />
                    <input
                      value={c.title}
                      onChange={contactField(i, 'title')}
                      placeholder="Title"
                      className="input-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={c.phone}
                      onChange={contactField(i, 'phone')}
                      placeholder="Phone"
                      className="input-sm"
                    />
                    <input
                      value={c.email}
                      onChange={contactField(i, 'email')}
                      placeholder="Email"
                      className="input-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={c.linkedin}
                      onChange={contactField(i, 'linkedin')}
                      placeholder="LinkedIn URL"
                      className="input-sm flex-1"
                    />
                    <button
                      onClick={() => removeContact(i)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded"
                      title="Remove contact"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {form.contacts.length === 0 && (
                <p className="text-xs text-slate-600 italic">No contacts yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 px-5 py-4 bg-slate-900 border-t border-slate-700/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.companyName.trim()}
            className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AccountCard ───────────────────────────────────────────────────────────────
function AccountCard({ prospect, onEdit, onDelete, onPrepForCall, onGenerateCampaign }) {
  const [expanded, setExpanded] = useState(false);

  const statusCls = STATUS_COLORS[prospect.status] ?? STATUS_COLORS.prospect;
  const heatCls   = prospect.heatScore ? HEAT_COLORS[prospect.heatScore] : null;

  const metaParts = [
    prospect.industry,
    prospect.address,
    prospect.contacts?.length
      ? `${prospect.contacts.length} contact${prospect.contacts.length !== 1 ? 's' : ''}`
      : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 hover:border-slate-600/70 transition-colors">
      {/* Header row */}
      <div className="px-4 pt-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          {/* Left: name + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-100 truncate">{prospect.companyName}</span>
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${statusCls}`}>
                {prospect.status}
              </span>
              {heatCls && (
                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${heatCls}`}>
                  {prospect.heatScore}
                </span>
              )}
            </div>

            {/* Meta line */}
            {metaParts.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {metaParts.join(' · ')}
              </p>
            )}

            {/* Notes preview when collapsed */}
            {!expanded && prospect.notes && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{prospect.notes}</p>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Edit */}
            <button
              onClick={onEdit}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-700/50"
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {/* Delete */}
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/50"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {/* Chevron toggle */}
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-700/50"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-slate-700/40 px-4 pb-4 pt-3 space-y-3">

          {/* Notes */}
          {prospect.notes && (
            <div>
              <p className="field-label mb-1">Notes</p>
              <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{prospect.notes}</p>
            </div>
          )}

          {/* Contacts */}
          <div>
            <p className="field-label mb-1">Contacts</p>
            {prospect.contacts?.length > 0 ? (
              <div className="space-y-2">
                {prospect.contacts.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    {/* Avatar circle */}
                    <div className="w-7 h-7 rounded-full bg-slate-700 border border-slate-600/60 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-slate-300 uppercase">
                        {c.name ? c.name[0] : '?'}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.name && <span className="text-xs font-semibold text-slate-200">{c.name}</span>}
                        {c.title && <span className="text-xs text-slate-500">{c.title}</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {c.phone && (
                          <a href={`tel:${c.phone}`}
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                            {c.phone}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`}
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                            {c.email}
                          </a>
                        )}
                        {c.linkedin && (
                          <a href={c.linkedin} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                No contacts.{' '}
                <button
                  onClick={onEdit}
                  className="text-emerald-500 hover:text-emerald-400 transition-colors underline underline-offset-2"
                >
                  Add one
                </button>
              </p>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onPrepForCall(prospect)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-violet-300 bg-slate-800 hover:bg-violet-500/10 border border-slate-700/60 hover:border-violet-500/40 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Prep for call
            </button>
            <button
              onClick={() => onGenerateCampaign(prospect)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-sky-300 bg-slate-800 hover:bg-sky-500/10 border border-slate-700/60 hover:border-sky-500/40 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Generate campaign
            </button>
            <span className="ml-auto text-[10px] text-slate-700">
              Updated {formatDate(prospect.updatedAt)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ProspectDatabaseView (main export) ───────────────────────────────────────
export default function ProspectDatabaseView({ onPrepForCall, onGenerateCampaign }) {
  const [prospects,    setProspects]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [query,        setQuery]        = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal,        setModal]        = useState(null); // null | { prospect: {} }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProspects(await getAllProspects());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setModal({ prospect: emptyProspect() });
  }

  function openEdit(prospect) {
    setModal({ prospect: { ...prospect, contacts: prospect.contacts ?? [] } });
  }

  function closeModal() {
    setModal(null);
  }

  async function handleSave(savedRecord) {
    closeModal();
    await load();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this account? This cannot be undone.')) return;
    await deleteProspect(id);
    setProspects((prev) => prev.filter((p) => p.id !== id));
  }

  // Filter + search
  const filtered = prospects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.companyName?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.industry?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q) ||
      p.contacts?.some(
        (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
      )
    );
  });

  // Status chip counts
  const countByStatus = {};
  for (const p of prospects) {
    countByStatus[p.status] = (countByStatus[p.status] ?? 0) + 1;
  }

  const noFiltersActive = statusFilter === 'all' && !query.trim();

  return (
    <div className="space-y-5">
      {/* Header: search + New Account button */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, contacts, notes…"
            className="input-base pl-9"
          />
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Account
        </button>
      </div>

      {/* Status filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
            statusFilter === 'all'
              ? 'bg-emerald-600 border-emerald-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
        >
          All ({prospects.length})
        </button>
        {STATUSES.map((s) => {
          const count = countByStatus[s] ?? 0;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors capitalize ${
                isActive
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {s} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {noFiltersActive ? (
            <>
              <p className="text-sm font-medium text-slate-500">No accounts yet.</p>
              <button
                onClick={openNew}
                className="text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                Add your first account →
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-600">No accounts match your search.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <AccountCard
              key={p.id}
              prospect={p}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p.id)}
              onPrepForCall={onPrepForCall}
              onGenerateCampaign={onGenerateCampaign}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <ProspectModal
          initial={modal.prospect}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
