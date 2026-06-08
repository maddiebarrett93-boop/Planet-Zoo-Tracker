import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, Badge, EmptyState } from './UI.jsx';
import { SPECIES_LIST, DISPOSITION } from '../data/constants.js';

const EMPTY = { name: '', father: '', mother: '', species: '', generation: 1, disposition: 'Keep' };

function TreeNode({ animal, all, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = all.filter(a => a.father === animal.name || a.mother === animal.name);
  const indent = depth * 20;

  return (
    <div style={{ marginLeft: indent }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a2218' }}>
        {children.length > 0 && (
          <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: '1px solid #2e4028', borderRadius: 4, color: '#7a9460', cursor: 'pointer', padding: '1px 5px', fontSize: 12, lineHeight: 1 }}>
            {expanded ? '−' : '+'}
          </button>
        )}
        {children.length === 0 && <div style={{ width: 21 }} />}
        <span style={{ color: '#c8d8a8', fontWeight: 600 }}>{animal.name}</span>
        <span style={{ color: '#5a7050', fontSize: 12 }}>Gen {animal.generation}</span>
        {animal.father && <span style={{ color: '#5a7050', fontSize: 12 }}>· Father: <span style={{ color: '#7a9460' }}>{animal.father}</span></span>}
        {animal.mother && <span style={{ color: '#5a7050', fontSize: 12 }}>· Mother: <span style={{ color: '#7a9460' }}>{animal.mother}</span></span>}
        <Badge status={animal.disposition} />
      </div>
      {expanded && children.map(c => <TreeNode key={c.id} animal={c} all={all} depth={depth + 1} />)}
    </div>
  );
}

export default function BloodlineTracker({ bloodlines, setBloodlines, breeding }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [filterDisp, setFilterDisp] = useState('');
  const [view, setView] = useState('table');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };

  const save = () => {
    if (!form.name || !form.species) return;
    const row = { ...form, id: editing || Date.now(), generation: +form.generation };
    if (editing) {
      setBloodlines(prev => prev.map(b => b.id === editing ? row : b));
    } else {
      setBloodlines(prev => [...prev, row]);
    }
    setOpen(false);
  };

  const del = id => setBloodlines(prev => prev.filter(b => b.id !== id));

  const animalNames = [
    ...breeding.map(b => b.name),
    ...bloodlines.map(b => b.name)
  ].filter(Boolean);

  const species = [...new Set(bloodlines.map(b => b.species))].sort();

  const filtered = bloodlines.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.name?.toLowerCase().includes(q) || b.father?.toLowerCase().includes(q) || b.mother?.toLowerCase().includes(q);
    const matchSp = !filterSpecies || b.species === filterSpecies;
    const matchD = !filterDisp || b.disposition === filterDisp;
    return matchQ && matchSp && matchD;
  });

  const roots = filtered.filter(b => !filtered.find(p => p.name === b.father || p.name === b.mother));

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or parents…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 28px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterSpecies ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All species</option>
          {species.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDisp} onChange={e => setFilterDisp(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterDisp ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All dispositions</option>
          {DISPOSITION.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 0, border: '1px solid #2e4028', borderRadius: 6, overflow: 'hidden' }}>
          {['table', 'tree'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? '#58673f' : 'transparent', border: 'none', color: view === v ? '#e8f0d0' : '#7a9460', padding: '6px 14px', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{v}</button>
          ))}
        </div>
        <Btn onClick={openAdd}><Plus size={14} /> Add Offspring</Btn>
      </div>

      {view === 'table' ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2e4028' }}>
                {['Name', 'Species', 'Father', 'Mother', 'Generation', 'Disposition', ''].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#7a9460', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon="🌳" message="No bloodline records yet — track your first offspring!" /></td></tr>}
              {filtered.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #1e2a18' }}>
                  <td style={{ padding: '10px 10px', color: '#c8d8a8', fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: '10px 10px', color: '#9ab880' }}>{b.species}</td>
                  <td style={{ padding: '10px 10px', color: '#7a9460' }}>{b.father || '—'}</td>
                  <td style={{ padding: '10px 10px', color: '#7a9460' }}>{b.mother || '—'}</td>
                  <td style={{ padding: '10px 10px', color: '#c8d8a8', textAlign: 'center' }}>Gen {b.generation}</td>
                  <td style={{ padding: '10px 10px' }}><Badge status={b.disposition} /></td>
                  <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(b)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                    <button onClick={() => del(b.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 10, padding: '1rem 1.25rem' }}>
          {filtered.length === 0 && <EmptyState icon="🌳" message="No bloodline records yet!" />}
          {roots.map(r => <TreeNode key={r.id} animal={r} all={filtered} />)}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Offspring' : 'Add Offspring'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Field label="Offspring Name"><Input value={form.name} onChange={f('name')} placeholder="Animal name" /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Father">
            <select value={form.father} onChange={f('father')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.father ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              <option value="">Unknown / Wild</option>
              {animalNames.filter(n => n !== form.name).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Mother">
            <select value={form.mother} onChange={f('mother')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.mother ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              <option value="">Unknown / Wild</option>
              {animalNames.filter(n => n !== form.name).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Generation"><Input type="number" min={1} value={form.generation} onChange={f('generation')} /></Field>
          <Field label="Disposition"><Select value={form.disposition} onChange={f('disposition')} options={DISPOSITION} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Offspring'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
