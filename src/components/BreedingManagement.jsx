import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, Badge, ScoreBar, EmptyState } from './UI.jsx';
import { SPECIES_LIST, SEXES, DISPOSITION, AGE_STAGES, APPEAL_TIERS } from '../data/constants.js';

const EMPTY = { species: '', name: '', sex: '', ageStage: 'Adult', fertility: '', immunity: '', size: '', longevity: '', appeal: '', mate: '', offspring: '', disposition: 'Keep' };

function getAppealTier(val) {
  const n = +val;
  return APPEAL_TIERS.find(t => n >= t.min && n <= t.max) || APPEAL_TIERS[0];
}

function AppealDisplay({ value }) {
  const tier = getAppealTier(value);
  const pct = Math.min(100, ((+value || 0) / 5000) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#5a7050', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Appeal</span>
        <span style={{ fontSize: 12, color: tier.color, fontWeight: 600 }}>{tier.label} · {(+value || 0).toLocaleString()}</span>
      </div>
      <div style={{ height: 5, background: '#1e2a18', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: tier.color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export default function BreedingManagement({ breeding, setBreeding }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterDisp, setFilterDisp] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };

  const save = () => {
    if (!form.name || !form.species) return;
    const row = { ...form, id: editing || Date.now(), fertility: +form.fertility, immunity: +form.immunity, size: +form.size, longevity: +form.longevity, appeal: +form.appeal };
    if (editing) {
      setBreeding(prev => prev.map(b => b.id === editing ? row : b));
    } else {
      setBreeding(prev => [...prev, row]);
    }
    setOpen(false);
  };

  const del = id => setBreeding(prev => prev.filter(b => b.id !== id));

  const species = [...new Set(breeding.map(b => b.species))].sort();
  const names = breeding.map(b => b.name).filter(Boolean);

  const filtered = breeding.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.name?.toLowerCase().includes(q) || b.species?.toLowerCase().includes(q);
    const matchSp = !filterSpecies || b.species === filterSpecies;
    const matchD = !filterDisp || b.disposition === filterDisp;
    return matchQ && matchSp && matchD;
  });

  const AGE_ICON = { Juvenile: '🐣', Adult: '🐾', Elder: '👴' };
  const AGE_COLOR = { Juvenile: '#4a8aab', Adult: '#6ab87a', Elder: '#c8a030' };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or species…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 28px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterSpecies ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All species</option>
          {species.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDisp} onChange={e => setFilterDisp(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterDisp ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All dispositions</option>
          {DISPOSITION.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <Btn onClick={openAdd}><Plus size={14} /> Add Animal</Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && <EmptyState icon="🐾" message="No breeding records yet — add your first animal!" />}
        {filtered.map(b => (
          <div key={b.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: b.sex === 'Male' ? '#0c1e30' : '#20102a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: `1px solid ${b.sex === 'Male' ? '#1a4060' : '#40185a'}` }}>
                  {b.sex === 'Male' ? '♂' : '♀'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#c8d8a8', fontSize: 16 }}>{b.name}</div>
                  <div style={{ color: '#7a9460', fontSize: 13 }}>{b.species}</div>
                </div>
                <span style={{ background: '#1a2818', border: `1px solid ${AGE_COLOR[b.ageStage] || '#2e4028'}`, borderRadius: 20, padding: '2px 10px', fontSize: 12, color: AGE_COLOR[b.ageStage] || '#7a9460', fontWeight: 500 }}>
                  {AGE_ICON[b.ageStage]} {b.ageStage}
                </span>
                <Badge status={b.disposition} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => openEdit(b)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                <button onClick={() => del(b.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px 20px', marginBottom: 12 }}>
              {[['Fertility', b.fertility], ['Immunity', b.immunity], ['Size', b.size], ['Longevity', b.longevity]].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <ScoreBar value={val} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <AppealDisplay value={b.appeal} />
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13, borderTop: '1px solid #1a2218', paddingTop: 10 }}>
              {b.mate && <span style={{ color: '#5a7050' }}>Mate: <span style={{ color: '#9ab880' }}>{b.mate}</span></span>}
              {b.offspring && <span style={{ color: '#5a7050' }}>Offspring: <span style={{ color: '#9ab880' }}>{b.offspring}</span></span>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Animal' : 'Add Animal'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Name"><Input value={form.name} onChange={f('name')} placeholder="Animal name" /></Field>
          <Field label="Sex"><Select value={form.sex} onChange={f('sex')} placeholder="Select…" options={SEXES} /></Field>
          <Field label="Age Stage"><Select value={form.ageStage} onChange={f('ageStage')} options={AGE_STAGES} /></Field>
          <Field label="Disposition"><Select value={form.disposition} onChange={f('disposition')} options={DISPOSITION} /></Field>
          <Field label="Fertility (0–100)"><Input type="number" min={0} max={100} value={form.fertility} onChange={f('fertility')} /></Field>
          <Field label="Immunity (0–100)"><Input type="number" min={0} max={100} value={form.immunity} onChange={f('immunity')} /></Field>
          <Field label="Size (0–100)"><Input type="number" min={0} max={100} value={form.size} onChange={f('size')} /></Field>
          <Field label="Longevity (0–100)"><Input type="number" min={0} max={100} value={form.longevity} onChange={f('longevity')} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Appeal Score (0–5000)">
              <Input type="number" min={0} max={5000} value={form.appeal} onChange={f('appeal')} />
              {form.appeal !== '' && (
                <div style={{ marginTop: 6 }}>
                  <AppealDisplay value={form.appeal} />
                </div>
              )}
            </Field>
          </div>
          <Field label="Mate">
            <select value={form.mate} onChange={f('mate')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.mate ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              <option value="">None</option>
              {names.filter(n => n !== form.name).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Offspring (comma-separated)"><Input value={form.offspring} onChange={f('offspring')} placeholder="e.g. Sasha, Nova" /></Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Animal'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
