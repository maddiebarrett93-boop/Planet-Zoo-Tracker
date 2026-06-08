import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Textarea, Btn, Badge, EmptyState } from './UI.jsx';
import { REGIONS, BIOMES, HABITAT_STATUSES, SPECIES_LIST } from '../data/constants.js';

const EMPTY = { region: '', biomes: '', species: '', size: '', guestRating: '', features: '', status: 'Planning' };

const REGION_ICON = { Africa: '🌍', Americas: '🌎', Asia: '🌏', Australia: '🦘', Europe: '🏔️', Polar: '🧊' };

export default function HabitatPlanner({ habitats, setHabitats }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };

  const save = () => {
    if (!form.species || !form.region) return;
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
    const matchQ = !q || h.species?.toLowerCase().includes(q) || h.region?.toLowerCase().includes(q);
    const matchR = !filterRegion || h.region === filterRegion;
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.length === 0 && <div style={{ gridColumn: '1/-1' }}><EmptyState icon="🏕️" message="No habitats yet — add your first!" /></div>}
        {filtered.map(h => (
          <div key={h.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 24 }}>{REGION_ICON[h.region] || '🌐'}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#c8d8a8', fontSize: 15 }}>{h.species}</div>
                  <div style={{ color: '#7a9460', fontSize: 13 }}>{h.region} · {h.biomes}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                <button onClick={() => del(h.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
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
            {h.features && (
              <div style={{ fontSize: 12, color: '#5a7050', borderTop: '1px solid #1e2a18', paddingTop: 8, marginTop: 4 }}>
                {h.features}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Habitat' : 'Add Habitat'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Field label="Region"><Select value={form.region} onChange={f('region')} placeholder="Select region…" options={REGIONS} /></Field>
          <Field label="Biome(s)"><Select value={form.biomes} onChange={f('biomes')} placeholder="Select biome…" options={BIOMES} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Primary Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Size (m²)"><Input type="number" min={0} value={form.size} onChange={f('size')} /></Field>
          <Field label="Guest Rating"><Input type="number" min={0} max={5} step={0.1} value={form.guestRating} onChange={f('guestRating')} /></Field>
          <Field label="Status"><Select value={form.status} onChange={f('status')} options={HABITAT_STATUSES} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Additional Features"><Textarea value={form.features} onChange={f('features')} placeholder="e.g. Water feature, climbing rocks, viewing platform…" /></Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Habitat'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
