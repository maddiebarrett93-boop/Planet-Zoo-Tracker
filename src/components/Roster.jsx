import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, Badge, ScoreBar, EmptyState, ToggleBadge, Alert } from './UI.jsx';
import { AGE_STAGES, SEXES, DISPOSITION, SOCIAL_STRUCTURES, APPEAL_MAX, JUVENILE_MODIFIER, APPEAL_TIERS } from '../data/constants.js';

const EMPTY = {
  species: '', name: '', sex: '', ageStage: 'Juvenile', fertility: '', immunity: '', size: '',
  longevity: '', appeal: '', mate: '', offspring: '', disposition: 'Keep',
  isAlpha: false, isBonded: false, isOutsider: false, socialStructure: 'Solitary'
};

function getAppealTier(val) {
  const n = +val || 0;
  return APPEAL_TIERS.find(t => n >= t.min && n <= t.max) || APPEAL_TIERS[0];
}

function effectiveAppeal(animal) {
  const base = +animal.appeal || 0;
  return animal.ageStage === "Juvenile" ? Math.round(base * (1 + JUVENILE_MODIFIER)) : base;
}

// ─── Social Warning Engine ──────────────────────────────────────────────────
function getSocialWarnings(animals, structure) {
  const warnings = [];
  if (!structure || !animals.length) return warnings;

  const adults = animals.filter(a => a.ageStage === 'Adult');
  const maleAdults = adults.filter(a => a.sex === 'Male');
  const femaleAdults = adults.filter(a => a.sex === 'Female');
  const alphas = animals.filter(a => a.isAlpha);

  if (alphas.filter(a => a.sex === 'Male').length > 1)
    warnings.push({ type: 'error', msg: '👑 Alpha Overlap: Multiple males flagged as Alpha — this will trigger fights.' });

  if (structure === 'Solitary') {
    if (adults.length > 2)
      warnings.push({ type: 'error', msg: `🚨 Solitary: ${adults.length} adults in habitat — max is 2 (bonded pair). Remove extras.` });
    else if (maleAdults.length > 1)
      warnings.push({ type: 'error', msg: '🚨 Solitary: Multiple adult males will fight. Only 1 male allowed unless bonded pair.' });
    else if (femaleAdults.length > 1)
      warnings.push({ type: 'warn', msg: '⚠️ Solitary: Multiple adult females detected — monitor for stress unless pair-bonded.' });
  }

  if (structure === 'Matrilineal') {
    const unbondedMaleAdults = maleAdults.filter(a => !a.isBonded && !a.isAlpha);
    if (unbondedMaleAdults.length > 0)
      warnings.push({ type: 'error', msg: `🚨 Matrilineal: ${unbondedMaleAdults.map(a => a.name).join(', ')} — Non-alpha male(s) reached Adult age without Bonded flag. Remove or mark as Bonded.` });
  }

  if (structure === 'Patrilineal') {
    const unbondedFemaleAdults = femaleAdults.filter(a => !a.isBonded);
    if (unbondedFemaleAdults.length > 2)
      warnings.push({ type: 'warn', msg: `⚠️ Patrilineal: ${unbondedFemaleAdults.length} unbonded adult females — risk of instability if core line isn't maintained.` });
  }

  return warnings;
}

// ─── Single animal row (inline toggles) ────────────────────────────────────
function AnimalRow({ animal, onToggle, onEdit, onDelete, isMobile }) {
  const [expanded, setExpanded] = useState(false);
  const tier = getAppealTier(effectiveAppeal(animal));
  const AGE_COLOR = { Juvenile: '#4a8aab', Adult: '#6ab87a', Elder: '#c8a030' };
  const ageColor = AGE_COLOR[animal.ageStage];

  const cycleAge = () => {
    const i = AGE_STAGES.indexOf(animal.ageStage);
    onToggle(animal.id, 'ageStage', AGE_STAGES[(i + 1) % AGE_STAGES.length]);
  };

  return (
    <div style={{ background: '#0d1410', border: '1px solid #1e2a18', borderRadius: 9, marginBottom: 7, overflow: 'hidden' }}>
      {/* Main row */}
      <div style={{ padding: '0.65rem 0.9rem', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Sex icon */}
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: animal.sex === 'Male' ? '#0c1e30' : '#20102a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, border: `1px solid ${animal.sex === 'Male' ? '#1a4060' : '#40185a'}` }}>
          {animal.sex === 'Male' ? '♂' : animal.sex === 'Female' ? '♀' : '?'}
        </div>

        {/* Name + species */}
        <div style={{ minWidth: 100, flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#c8d8a8', fontSize: 14 }}>{animal.name || '—'}</div>
          <div style={{ color: '#5a7050', fontSize: 11 }}>{animal.species}</div>
        </div>

        {/* Age cycle button */}
        <button onClick={cycleAge} style={{ background: `${ageColor}18`, border: `1px solid ${ageColor}`, borderRadius: 20, padding: '2px 10px', color: ageColor, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {animal.ageStage === 'Juvenile' ? '🐣' : animal.ageStage === 'Elder' ? '🧓' : '🐾'} {animal.ageStage}
        </button>

        {/* Social toggles */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <ToggleBadge label="Alpha" icon="👑" active={animal.isAlpha} color="#c8a830" onClick={() => onToggle(animal.id, 'isAlpha', !animal.isAlpha)} />
          <ToggleBadge label="Bonded" icon="❤️" active={animal.isBonded} color="#c86080" onClick={() => onToggle(animal.id, 'isBonded', !animal.isBonded)} />
          <ToggleBadge label="Outsider" icon="🔴" active={animal.isOutsider} color="#c84040" onClick={() => onToggle(animal.id, 'isOutsider', !animal.isOutsider)} />
        </div>

        {/* Appeal */}
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <div style={{ fontSize: 12, color: tier.color, fontWeight: 700 }}>{tier.label}</div>
          <div style={{ fontSize: 10, color: '#5a7050' }}>{effectiveAppeal(animal).toLocaleString()}</div>
        </div>

        <Badge status={animal.disposition} />

        {/* Expand / actions */}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', color: '#5a7050', cursor: 'pointer', padding: 4 }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
          <button onClick={() => onEdit(animal)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
          <button onClick={() => onDelete(animal.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Expanded stats */}
      {expanded && (
        <div style={{ padding: '0.75rem 0.9rem', borderTop: '1px solid #1a2218', background: '#0a120a' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '6px 18px', marginBottom: 10 }}>
            {[['Fertility', animal.fertility], ['Immunity', animal.immunity], ['Size', animal.size], ['Longevity', animal.longevity]].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: '#3a5030', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                <ScoreBar value={v} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 12 }}>
            {animal.mate && <span style={{ color: '#5a7050' }}>Mate: <span style={{ color: '#9ab880' }}>{animal.mate}</span></span>}
            {animal.offspring && <span style={{ color: '#5a7050' }}>Offspring: <span style={{ color: '#9ab880' }}>{animal.offspring}</span></span>}
            <span style={{ color: '#5a7050' }}>Appeal (base): <span style={{ color: tier.color }}>{(+animal.appeal || 0).toLocaleString()} / {APPEAL_MAX.toLocaleString()}</span></span>
            {animal.ageStage === 'Juvenile' && <span style={{ color: '#4a8aab' }}>+{JUVENILE_MODIFIER} Juvenile modifier</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function Roster({ roster, setRoster, pzVersion, speciesList }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterDisp, setFilterDisp] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [filterStructure, setFilterStructure] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };
  const save = () => {
    if (!form.name || !form.species) return;
    const row = { ...form, id: editing || Date.now(), fertility: +form.fertility, immunity: +form.immunity, size: +form.size, longevity: +form.longevity, appeal: +form.appeal };
    setRoster(prev => editing ? prev.map(r => r.id === editing ? row : r) : [...prev, row]);
    setOpen(false);
  };
  const del = id => setRoster(prev => prev.filter(r => r.id !== id));
  const toggle = (id, key, val) => setRoster(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r));

  const species = [...new Set(roster.map(r => r.species))].sort();
  const animalNames = roster.map(r => r.name).filter(Boolean);

  // Split active vs archived
  const archived = roster.filter(r => r.disposition === 'Sell' || r.disposition === 'Release');
  const active   = roster.filter(r => r.disposition !== 'Sell' && r.disposition !== 'Release');
  const baseList = showArchive ? archived : active;

  const filtered = baseList.filter(r => {
    const q = search.toLowerCase();
    return (!q || r.name?.toLowerCase().includes(q) || r.species?.toLowerCase().includes(q))
      && (!filterSpecies || r.species === filterSpecies)
      && (!filterDisp || r.disposition === filterDisp)
      && (!filterStructure || r.socialStructure === filterStructure);
  });

  // Group by species for warning engine
  const bySpecies = {};
  roster.forEach(r => { (bySpecies[r.species] = bySpecies[r.species] || []).push(r); });
  const allWarnings = Object.entries(bySpecies).flatMap(([sp, animals]) => {
    const struct = animals[0]?.socialStructure;
    return getSocialWarnings(animals, struct).map(w => ({ ...w, species: sp }));
  });

  return (
    <div>
      {/* Social warnings */}
      {allWarnings.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {allWarnings.map((w, i) => (
            <Alert key={i} type={w.type === 'error' ? 'error' : 'warn'}><strong>{w.species}:</strong> {w.msg}</Alert>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 27px', color: '#c8d8a8', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterSpecies ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All species</option>
          {species.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterStructure} onChange={e => setFilterStructure(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterStructure ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All structures</option>
          {SOCIAL_STRUCTURES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDisp} onChange={e => setFilterDisp(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterDisp ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All dispositions</option>
          {DISPOSITION.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <Btn onClick={openAdd}><Plus size={13} /> Add Animal</Btn>
        <button onClick={() => setShowArchive(v => !v)}
          style={{ background: showArchive ? '#2e2a10' : 'transparent', border: `1px solid ${showArchive ? '#c8a030' : '#2e4028'}`, borderRadius:6, padding:'6px 12px', color: showArchive ? '#c8a030' : '#5a7050', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' }}>
          {showArchive ? '📦 Archive' : '📦'} {archived.length > 0 ? `(${archived.length})` : ''}
        </button>
      </div>

      {/* Roster list */}
      {filtered.length === 0
        ? <EmptyState icon="🐾" message="No animals in roster yet — add your first!" />
        : filtered.map(a => <AnimalRow key={a.id} animal={a} onToggle={toggle} onEdit={openEdit} onDelete={del} />)
      }

      {/* Add/Edit modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Animal' : 'Add to Roster'} wide>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {speciesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Name"><Input value={form.name} onChange={f('name')} placeholder="Animal name" /></Field>
          <Field label="Sex"><Select value={form.sex} onChange={f('sex')} placeholder="Select…" options={SEXES} /></Field>
          <Field label="Age Stage"><Select value={form.ageStage} onChange={f('ageStage')} options={AGE_STAGES} /></Field>
          <Field label="Social Structure"><Select value={form.socialStructure} onChange={f('socialStructure')} options={SOCIAL_STRUCTURES} /></Field>
          <Field label="Disposition"><Select value={form.disposition} onChange={f('disposition')} options={DISPOSITION} /></Field>
          <Field label="Fertility (0–100)"><Input type="number" min={0} max={100} value={form.fertility} onChange={f('fertility')} /></Field>
          <Field label="Immunity (0–100)"><Input type="number" min={0} max={100} value={form.immunity} onChange={f('immunity')} /></Field>
          <Field label="Size (0–100)"><Input type="number" min={0} max={100} value={form.size} onChange={f('size')} /></Field>
          <Field label="Longevity (0–100)"><Input type="number" min={0} max={100} value={form.longevity} onChange={f('longevity')} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label={`Appeal Score (0–${APPEAL_MAX.toLocaleString()})`}>
              <Input type="number" min={0} max={APPEAL_MAX} value={form.appeal} onChange={f('appeal')} />
              {form.ageStage === 'Juvenile' && form.appeal !== '' && (
                <div style={{ fontSize: 11, color: '#4a8aab', marginTop: 4 }}>Effective: {Math.round((+form.appeal || 0) * (1 + JUVENILE_MODIFIER)).toLocaleString()} (+{Math.round((+form.appeal||0) * JUVENILE_MODIFIER)} appeal, 15% modifier)</div>
              )}
            </Field>
          </div>
          <div style={{ gridColumn: '1/-1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {[['isAlpha', '👑 Alpha', '#c8a830'], ['isBonded', '❤️ Bonded', '#c86080'], ['isOutsider', '🔴 Outsider', '#c84040']].map(([k, label, color]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#c8d8a8' }}>
                <input type="checkbox" checked={!!form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.checked }))} style={{ accentColor: color }} />
                {label}
              </label>
            ))}
          </div>
          <Field label="Mate">
            <select value={form.mate} onChange={f('mate')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.mate ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              <option value="">None</option>
              {animalNames.filter(n => n !== form.name).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Offspring (comma-separated)"><Input value={form.offspring} onChange={f('offspring')} placeholder="e.g. Sasha, Nova" /></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Animal'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
