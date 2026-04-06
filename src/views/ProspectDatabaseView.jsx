// views/ProspectDatabaseView.jsx — Prospect / Account Database
import { useState, useEffect, useCallback } from 'react';
import { getAllProspects, saveProspect, deleteProspect } from '../storage';

const STATUSES = ['prospect', 'contacted', 'in-campaign', 'customer', 'non-viable'];
const STATUS_COLORS = {
  prospect:     'bg-slate-700 text-slate-300',
  contacted:    'bg-blue-900/60 text-blue-300',
  'in-campaign':'bg-emerald-900/60 text-emerald-300',
  customer:     'bg-purple-900/60 text-purple-300',
  'non-viable': 'bg-red-900/60 text-red-400',
};
const HEAT_COLORS = {
  Hot:  'bg-red-900/50 text-red-400',
  Warm: 'bg-amber-900/50 text-amber-400',
  Cold: 'bg-sky-900/50 text-sky-400',
};
const INDUSTRIES = [
  'Distribution / Warehouse', 'Manufacturing', 'Food & Beverage',
  'Automotive', 'Logistics / 3PL', 'E-Commerce Fulfillment', 'Other',
];

function uuid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

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

// ─── Contact Row (edit mode) ──────────────────────────────────────────────────
function ContactRow({ contact, onChange, onDelete }) {
  function field(key) {
    return (e) => onChange({ ...contact, [key]: e.target.value });
  }
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-2 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
      <input value={contact.name}    onChange={field('name')}    placeholder="Name"        className="input-sm col-span-2" />
      <input value={contact.title}   onChange={field('title')}   placeholder="Title"       className="input-sm" />
      <input value={contact.phone}   onChange={field('phone')}   placeholder="Phone"       className="input-sm" />
      <input value={contact.email}   onChange={field('email')}   placeholder="Email"       className="input-sm" />
      <input value={contact.linkedin} onChange={field('linkedin')} placeholder="LinkedIn URL" className="input-sm" />
      <button onClick={onDelete}
        className="col-span-2 text-xs text-red-400/70 hover:text-red-400 text-right transition-colors">
        Remove contact
      </button>
    </div>
  );
}

// ─── Edit Form ────────────────────────────────────────────────────────────────
function ProspectForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);

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

  function handleSave() {
    if (!form.companyName.trim()) return;
    onSave(form);
  }

  return (
    <div className="space-y-4">
      {/* Company Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="field-label">Company Name *</label>
          <input value={form.companyName} onChange={field('companyName')}
            placeholder="Acme Corp" className="input-base" />
        </div>
        <div className="col-span-2">
          <label className="field-label">Address</label>
          <input value={form.address} onChange={field('address')}
            placeholder="123 Main St, City, ST 00000" className="input-base" />
        </div>
        <div>
          <label className="field-label">Industry</label>
          <select value={form.industry} onChange={field('industry')} className="input-base">
            <option value="">— Select —</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Heat Score</label>
          <select value={form.heatScore} onChange={field('heatScore')} className="input-base">
            <option value="">— None —</option>
            <option>Hot</option><option>Warm</option><option>Cold</option>
          </select>
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input value={form.phone} onChange={field('phone')}
            placeholder="(618) 555-0100" className="input-base" />
        </div>
        <div>
          <label className="field-label">Website</label>
          <input value={form.website} onChange={field('website')}
            placeholder="acmecorp.com" className="input-base" />
        </div>
        <div>
          <label className="field-label">Status</label>
          <select value={form.status} onChange={field('status')} className="input-base">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="field-label">Notes</label>
        <textarea value={form.notes} onChange={field('notes')} rows={3}
          placeholder="Key notes, context, next steps…"
          className="input-base resize-none" />
      </div>

      {/* Contacts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="field-label mb-0">Contacts</span>
          <button onClick={addContact}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
            + Add contact
          </button>
        </div>
        <div className="space-y-2">
          {form.contacts.map((c, i) => (
            <ContactRow key={c.id} contact={c}
              onChange={(u) => updateContact(i, u)}
              onDelete={() => removeContact(i)} />
          ))}
          {form.contacts.length === 0 && (
            <p className="text-xs text-slate-600 italic">No contacts yet.</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={handleSave}
          className="flex-1 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
          Save
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Prospect Card (read mode) ────────────────────────────────────────────────
function ProspectCard({ prospect, onEdit, onDelete, onPrepForCall, onGenerateCampaign }) {
  const statusCls = STATUS_COLORS[prospect.status] ?? STATUS_COLORS.prospect;
  const heatCls   = prospect.heatScore ? HEAT_COLORS[prospect.heatScore] : null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{prospect.companyName}</h3>
          {prospect.address && (
            <p className="text-xs text-slate-500 truncate mt-0.5">{prospect.address}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {heatCls && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${heatCls}`}>
              {prospect.heatScore}
            </span>
          )}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusCls}`}>
            {prospect.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {prospect.industry && <span>{prospect.industry}</span>}
        {prospect.phone    && <span>{prospect.phone}</span>}
        {prospect.contacts?.length > 0 && (
          <span>{prospect.contacts.length} contact{prospect.contacts.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {prospect.notes && (
        <p className="text-xs text-slate-400 line-clamp-2 border-t border-slate-700/50 pt-2">
          {prospect.notes}
        </p>
      )}

      {/* Contacts list */}
      {prospect.contacts?.length > 0 && (
        <div className="border-t border-slate-700/50 pt-2 space-y-1">
          {prospect.contacts.map((c) => (
            <div key={c.id} className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
              <span className="text-slate-300 font-medium">{c.name}</span>
              {c.title && <span className="text-slate-500">{c.title}</span>}
              {c.email && <span className="text-slate-500">{c.email}</span>}
              {c.phone && <span className="text-slate-500">{c.phone}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50 flex-wrap">
        <button onClick={onEdit}
          className="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors">
          Edit
        </button>
        <button onClick={() => onPrepForCall(prospect)}
          className="text-xs font-medium text-sky-400 hover:text-sky-300 transition-colors">
          Call Prep
        </button>
        <button onClick={() => onGenerateCampaign(prospect)}
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
          Campaign
        </button>
        <button onClick={onDelete}
          className="ml-auto text-xs text-red-400/60 hover:text-red-400 transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function ProspectDatabaseView({ onPrepForCall, onGenerateCampaign }) {
  const [prospects, setProspects] = useState([]);
  const [search,    setSearch]    = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingId, setEditingId] = useState(null); // null = list, 'new' = new form, id = editing existing
  const [editForm,  setEditForm]  = useState(null);

  const load = useCallback(async () => {
    setProspects(await getAllProspects());
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setEditForm(emptyProspect());
    setEditingId('new');
  }

  function startEdit(prospect) {
    setEditForm({ ...prospect, contacts: prospect.contacts ?? [] });
    setEditingId(prospect.id);
  }

  async function handleSave(form) {
    await saveProspect(form);
    await load();
    setEditingId(null);
    setEditForm(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this prospect?')) return;
    await deleteProspect(id);
    await load();
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  // Filter + search
  const visible = prospects.filter((p) => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.companyName?.toLowerCase().includes(q)
      || p.address?.toLowerCase().includes(q)
      || p.industry?.toLowerCase().includes(q)
      || p.notes?.toLowerCase().includes(q)
      || p.contacts?.some(
          (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
        );
    return matchStatus && matchSearch;
  });

  // ── Edit / New form view ────────────────────────────────────────────────────
  if (editingId !== null && editForm !== null) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={cancelEdit}
            className="text-slate-500 hover:text-slate-300 transition-colors">
            ←
          </button>
          <h2 className="text-base font-semibold text-slate-200">
            {editingId === 'new' ? 'Add Prospect' : 'Edit Prospect'}
          </h2>
        </div>
        <ProspectForm initial={editForm} onSave={handleSave} onCancel={cancelEdit} />
      </div>
    );
  }

  // ── List view ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-200">Accounts</h2>
          <p className="text-xs text-slate-500 mt-0.5">{prospects.length} prospect{prospects.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <button onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
          + Add Prospect
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, industry, contact…"
          className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-600/60"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-600/60">
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          {prospects.length === 0
            ? 'No prospects yet. Add one or run a territory search.'
            : 'No prospects match your search.'}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((p) => (
            <ProspectCard
              key={p.id}
              prospect={p}
              onEdit={() => startEdit(p)}
              onDelete={() => handleDelete(p.id)}
              onPrepForCall={onPrepForCall}
              onGenerateCampaign={onGenerateCampaign}
            />
          ))}
        </div>
      )}
    </div>
  );
}
