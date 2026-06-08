import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { Modal, Field, Input, Btn, Badge, EmptyState } from './UI.jsx';
import { REGIONS, BIOMES, HABITAT_STATUSES, SPECIES_LIST } from '../data/constants.js';

const EMPTY = { regions: [], biomes: [], species: '', size: '', guestRating: '', features: '', status: 'Planning' };

const REGION_ICON = { Africa: '🌍', Americas: '🌎', Asia: '🌏', Australia: '🦘', Europe: '🏔️', Polar: '🧊' };

function MultiSelect({ label, options, selected, onChange, icons }) {
  const toggle = val => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };
  return (
    <Field label={label}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button key={opt} onClick={() => toggle(opt)} style={{ background: active ? '#2a3e20' : '#111a0f', border: `1px solid ${active ? '#58673f' : '#2e4028'}`, borderRadius: 20, padding: '4px 12px', color: active ? '#c8d8a8' : '#5a7050', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
              {icons && icons[opt] ? `${icons[opt]} ` : ''}{opt}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && <div style={{ fontSize: 12, color: '#3a4e30', marginTop: 4 }}>None selected</div>}
    </Field>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) return <span style={{ color: '#3a5030', fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map(t => (
        <span key={t} style={{ background: '#1a2a14', border: '1px solid #2e4028', borderRadius: 12, padding: '2px 8px', fontSize: 11, color: '#7a9460' }}>{t}</span>
      ))}
    </div>
  );
}

export default function HabitatPlanner({ habitats, setHabitats }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const fArr = k => val => setForm(p => ({ ...p, [k]: val }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row, regions: row.regions || [], biomes: row.biomes || [] }); setOpen(true); };

  const save = () => {
    if (!form.species || form.regions.length === 0) return;
    const row = { ...form, id: editing || Date.now(), size: +form.size, guestRating: +form.guestRating };
    if (editing) {
      setHabitats(prev => prev.map(h => h.id === editing ? row : h));
    } else {
      setHabitats(prev => [...prev, row]);
    }
    setOpen(false);
  };

  const del = id => setHabitats(prev => prev.filter(h => h.id !== id));

  const filtered = habitats.filter(h => {
    const q = search.toLowerCase();
    const matchQ = !q || h.species?.toLowerCase().includes(q) || h.regions?.some(r => r.toLowerCase().includes(q));
    const matchR = !filterRegion || (h.regions || []).includes(filterRegion);
    const matchS = !filterStatus || h.status === filterStatus;
    return matchQ && matchR && matchS;
  });

  const totalSize = habitats.reduce((s, h) => s + (+h.size || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        {[
          { label: 'Habitats', value: habitats.length },
          { label: 'Total Size (m²)', value: totalSize.toLocaleString() },
          { label: 'Active', value: habitats.filter(h => h.status === 'Active').length },
          { label: 'Avg Rating', value: habitats.length ? (habitats.reduce((s, h) => s + (+h.guestRating || 0), 0) / habitats.length).toFixed(1) : '—' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c8d8a8' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search species or region…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 28px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterRegion ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterStatus ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All statuses</option>
          {HABITAT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={openAdd}><Plus size={14} /> Add Habitat</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
        {filtered.length === 0 && <div style={{ gridColumn: '1/-1' }}><EmptyState icon="🏕️" message="No habitats yet — add your first!" /></div>}
        {filtered.map(h => (
          <div key={h.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, color: '#c8d8a8', fontSize: 15, marginBottom: 6 }}>{h.species}</div>
                <div style={{ marginBottom: 4 }}>
                  <TagList items={(h.regions || []).map(r => `${REGION_ICON[r] || ''} ${r}`)} />
                </div>
                <TagList items={h.biomes || []} />
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 8 }}>
                <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                <button onClick={() => del(h.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap', borderTop: '1px solid #1a2218', paddingTop: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Size</div>
                <div style={{ color: '#c8d8a8', fontWeight: 600 }}>{(+h.size || 0).toLocaleString()} m²</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Guest Rating</div>
                <div style={{ color: '#c8d8a8', fontWeight: 600 }}>★ {h.guestRating || '—'}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Badge status={h.status} />
              </div>
            </div>
            {h.features && <div style={{ fontSize: 12, color: '#5a7050' }}>{h.features}</div>}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Habitat' : 'Add Habitat'}>
        <MultiSelect label="Regions" options={REGIONS} selected={form.regions} onChange={fArr('regions')} icons={REGION_ICON} />
        <MultiSelect label="Biomes" options={BIOMES} selected={form.biomes} onChange={fArr('biomes')} />
        <Field label="Primary Species">
          <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
            <option value="">Select species…</option>
            {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
          <Field label="Size (m²)"><Input type="number" min={0} value={form.size} onChange={f('size')} /></Field>
          <Field label="Guest Rating"><Input type="number" min={0} max={5} step={0.1} value={form.guestRating} onChange={f('guestRating')} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={f('status')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              {HABITAT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Additional Features">
          <textarea value={form.features} onChange={f('features')} placeholder="e.g. Water feature, climbing rocks, viewing platform…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 60 }} />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Habitat'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
