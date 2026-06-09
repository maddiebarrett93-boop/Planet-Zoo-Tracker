import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Btn, Badge, EmptyState, Alert, MultiSelectPills } from './UI.jsx';
import { REGIONS, BIOMES, HABITAT_STATUSES, SOCIAL_STRUCTURES } from '../data/constants.js';

const EMPTY = {
  regions: [], biomes: [], species: '', habitatType: 'Habitats',
  size: '', actualLandSpace: '', actualWaterSpace: '',
  baseSpace: '', perAdditionalSpace: '', adultCount: '',
  guestRating: '', features: '', status: 'Planning', socialStructure: ''
};

const REGION_ICON = { Africa: '🌍', Europe: '🏔️', 'North America': '🦅', 'South & Central America': '🌿', Asia: '🌏', Oceania: '🦘', Antarctica: '🧊' };

function spaceCalc(h) {
  const base = +h.baseSpace || 0;
  const adults = +h.adultCount || 1;
  const perAdd = +h.perAdditionalSpace || 0;
  if (!base) return null;
  return base + (adults - 1) * perAdd;
}

function SpaceValidator({ habitat }) {
  const required = spaceCalc(habitat);
  if (!required) return null;
  const actual = +habitat.actualLandSpace || 0;
  const diff = actual - required;
  const ok = diff >= 0;
  return (
    <Alert type={ok ? 'info' : 'error'}>
      Space calculator: Need <strong>{required.toLocaleString()} m²</strong> for {habitat.adultCount} adults
      {' '}({ok ? `✅ ${diff.toLocaleString()} m² surplus` : `❌ ${Math.abs(diff).toLocaleString()} m² short`})
    </Alert>
  );
}

function TagList({ items }) {
  if (!items?.length) return <span style={{ color: '#3a5030', fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map(t => <span key={t} style={{ background: '#1a2a14', border: '1px solid #2e4028', borderRadius: 12, padding: '2px 8px', fontSize: 11, color: '#7a9460' }}>{t}</span>)}
    </div>
  );
}

export default function HabitatPlanner({ habitats, setHabitats, pzVersion, speciesList, animalDb, theme }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const fArr = k => v => setForm(p => ({ ...p, [k]: v }));

  const animalMap = Object.fromEntries((animalDb || []).map(a => [a.name, a]));
  const onSpeciesSelect = species => {
    const data = animalMap[species];
    if (data) {
      setForm(p => ({ ...p, species,
        baseSpace: data.baseSpace || p.baseSpace,
        perAdditionalSpace: data.perAdditionalSpace || p.perAdditionalSpace,
        regions: data.region ? [data.region] : p.regions,
        biomes: data.biomes?.length ? data.biomes : p.biomes,
        socialStructure: data.socialStructure || p.socialStructure,
      }));
    } else {
      setForm(p => ({ ...p, species }));
    }
  };
  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row, regions: row.regions || [], biomes: row.biomes || [] }); setOpen(true); };
  const save = () => {
    if (!form.species || !form.regions.length) return;
    const row = { ...form, id: editing || Date.now(), size: +form.size, actualLandSpace: +form.actualLandSpace, actualWaterSpace: +form.actualWaterSpace, guestRating: +form.guestRating, adultCount: +form.adultCount };
    setHabitats(prev => editing ? prev.map(h => h.id === editing ? row : h) : [...prev, row]);
    setOpen(false);
  };
  const del = id => setHabitats(prev => prev.filter(h => h.id !== id));

  const TYPES = pzVersion === 'PZ2'
    ? ['Habitats', 'Exhibits', 'Aviaries', 'Aquariums']
    : ['Habitats', 'Exhibits'];

  const filtered = habitats.filter(h => {
    const q = search.toLowerCase();
    return (!q || h.species?.toLowerCase().includes(q) || h.regions?.some(r => r.toLowerCase().includes(q)))
      && (!filterRegion || (h.regions || []).includes(filterRegion))
      && (!filterStatus || h.status === filterStatus)
      && (!filterType || h.habitatType === filterType);
  });

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
        {[
          { label: 'Habitats', value: habitats.filter(h => h.habitatType === 'Habitats').length },
          { label: 'Exhibits', value: habitats.filter(h => h.habitatType === 'Exhibits').length },
          ...(pzVersion === 'PZ2' ? [
            { label: 'Aviaries', value: habitats.filter(h => h.habitatType === 'Aviaries').length },
            { label: 'Aquariums', value: habitats.filter(h => h.habitatType === 'Aquariums').length },
          ] : []),
          { label: 'Avg Rating', value: habitats.length ? (habitats.reduce((s, h) => s + (+h.guestRating || 0), 0) / habitats.length).toFixed(1) : '—' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c8d8a8' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 27px', color: '#c8d8a8', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterType ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterRegion ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterStatus ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All statuses</option>
          {HABITAT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={openAdd}><Plus size={13} /> Add</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.length === 0 && <div style={{ gridColumn: '1/-1' }}><EmptyState icon="🏕️" message="No habitats yet!" /></div>}
        {filtered.map(h => {
          const required = spaceCalc(h);
          const spaceOk = !required || (+h.actualLandSpace || 0) >= required;
          return (
            <div key={h.id} style={{ background: '#111a0f', border: `1px solid ${!spaceOk ? '#5a2828' : '#2e4028'}`, borderRadius: 10, padding: '1rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#c8d8a8', fontSize: 14, marginBottom: 4 }}>{h.species}</div>
                  <div style={{ fontSize: 11, color: '#4a8aab', marginBottom: 4, fontWeight: 600 }}>{h.habitatType}</div>
                  <div style={{ marginBottom: 4 }}><TagList items={(h.regions || []).map(r => `${REGION_ICON[r] || ''}${r}`)} /></div>
                  <TagList items={h.biomes || []} />
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => openEdit(h)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 3 }}><Pencil size={13} /></button>
                  <button onClick={() => del(h.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 3 }}><Trash2 size={13} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', borderTop: '1px solid #1a2218', paddingTop: 8, fontSize: 12 }}>
                <span style={{ color: '#5a7050' }}>Land: <span style={{ color: '#c8d8a8' }}>{(+h.actualLandSpace || 0).toLocaleString()} m²</span></span>
                {(+h.actualWaterSpace > 0) && <span style={{ color: '#5a7050' }}>Water: <span style={{ color: '#4a8aab' }}>{(+h.actualWaterSpace).toLocaleString()} m²</span></span>}
                <span style={{ color: '#5a7050' }}>★ <span style={{ color: '#c8d8a8' }}>{h.guestRating || '—'}</span></span>
                {required && <span style={{ color: spaceOk ? '#6ab87a' : '#c84040', fontWeight: 600 }}>{spaceOk ? '✅' : '❌'} {required.toLocaleString()} req.</span>}
                <div style={{ marginLeft: 'auto' }}><Badge status={h.status} /></div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Habitat' : 'Add Habitat'} wide>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Field label="Type">
            <select value={form.habitatType} onChange={f('habitatType')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={f('status')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              {HABITAT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Primary Species">
              <select value={form.species} onChange={e => onSpeciesSelect(e.target.value)} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {speciesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Regions"><MultiSelectPills options={REGIONS} selected={form.regions} onChange={fArr('regions')} icons={REGION_ICON} /></Field>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Biomes"><MultiSelectPills options={BIOMES} selected={form.biomes} onChange={fArr('biomes')} /></Field>
          </div>
          <Field label="Actual Land Space (m²)"><Input type="number" min={0} value={form.actualLandSpace} onChange={f('actualLandSpace')} /></Field>
          <Field label="Actual Water Space (m²)"><Input type="number" min={0} value={form.actualWaterSpace} onChange={f('actualWaterSpace')} /></Field>
          <Field label="Base Space Required"><Input type="number" min={0} value={form.baseSpace} onChange={f('baseSpace')} placeholder="e.g. 3500" /></Field>
          <Field label="Space Per Additional Adult"><Input type="number" min={0} value={form.perAdditionalSpace} onChange={f('perAdditionalSpace')} placeholder="e.g. 500" /></Field>
          <Field label="Adult Count"><Input type="number" min={1} value={form.adultCount} onChange={f('adultCount')} /></Field>
          <Field label="Guest Rating"><Input type="number" min={0} max={5} step={0.1} value={form.guestRating} onChange={f('guestRating')} /></Field>
          <Field label="Social Structure"><select value={form.socialStructure} onChange={f('socialStructure')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.socialStructure ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}><option value="">Select…</option>{SOCIAL_STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>
          <div style={{ gridColumn: '1/-1' }}>
            {(form.baseSpace || form.adultCount) && <SpaceValidator habitat={form} />}
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Additional Features"><textarea value={form.features} onChange={f('features')} placeholder="e.g. Water feature, climbing rocks…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 55 }} /></Field>
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
