import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, EmptyState } from './UI.jsx';
import { DISPOSITION } from '../data/constants.js';

const EMPTY = { name: '', father: '', mother: '', species: '', generation: 1, disposition: 'Keep' };

const DISP_COLOR = { Keep: '#6ab87a', Sell: '#c8a030', Release: '#4090c0' };
const DISP_BG    = { Keep: '#0a1e10', Sell: '#1e1800', Release: '#080c1e' };

// ─── Immediate Family Node Graph ───────────────────────────────────────────
function FamilyGraph({ subject, all, onMark }) {
  if (!subject) return null;

  const father = all.find(a => a.name === subject.father);
  const mother = all.find(a => a.name === subject.mother);
  const offspring = all.filter(a => a.father === subject.name || a.mother === subject.name);

  const NODE_W = 140, NODE_H = 72;

  function Node({ animal, role, x, y, isSubject }) {
    if (!animal) {
      return (
        <g>
          <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={8} fill="#0a120a" stroke="#1e2a18" strokeDasharray="4 3" />
          <text x={x + NODE_W / 2} y={y + NODE_H / 2 + 5} textAnchor="middle" fontSize={11} fill="#2e4028">{role}</text>
        </g>
      );
    }
    const dc = DISP_BG[animal.disposition] || '#0d1410';
    const tc = DISP_COLOR[animal.disposition] || '#7a9460';
    return (
      <g>
        <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={8} fill={isSubject ? '#1a2e14' : dc} stroke={isSubject ? '#58673f' : '#2e4028'} strokeWidth={isSubject ? 2 : 1} />
        {isSubject && <rect x={x} y={y} width={NODE_W} height={4} rx={2} fill="#58673f" />}
        <text x={x + NODE_W / 2} y={y + 22} textAnchor="middle" fontSize={13} fontWeight="700" fill="#c8d8a8" fontFamily="'Trebuchet MS', sans-serif">{animal.name}</text>
        <text x={x + NODE_W / 2} y={y + 37} textAnchor="middle" fontSize={10} fill="#7a9460" fontFamily="sans-serif">
          {animal.species?.length > 17 ? animal.species.slice(0, 16) + '…' : animal.species}
        </text>
        <text x={x + NODE_W / 2} y={y + 52} textAnchor="middle" fontSize={10} fill="#5a7050" fontFamily="monospace">Gen {animal.generation}</text>
        <text x={x + NODE_W / 2} y={y + 64} textAnchor="middle" fontSize={10} fontWeight="600" fill={tc}>{animal.disposition}</text>
      </g>
    );
  }

  // Layout: parents row, subject center, offspring row
  const COLS = Math.max(offspring.length, 2);
  const totalW = Math.max(500, COLS * (NODE_W + 30));
  const cx = totalW / 2 - NODE_W / 2;
  const fatherX = cx - NODE_W - 40;
  const motherX = cx + NODE_W + 40;
  const subjectY = 110;
  const parentsY = 0;
  const offspringY = subjectY + NODE_H + 70;

  const offspringStartX = (totalW - (offspring.length * (NODE_W + 20) - 20)) / 2;
  const svgH = offspring.length > 0 ? offspringY + NODE_H + 20 : subjectY + NODE_H + 20;

  return (
    <div style={{ overflowX: 'auto', background: '#0a120a', borderRadius: 10, border: '1px solid #2e4028', padding: '1.25rem' }}>
      <svg width={totalW} height={svgH} style={{ display: 'block', margin: '0 auto' }}>
        {/* Parent → Subject lines */}
        {(father || subject.father) && (
          <path d={`M${fatherX + NODE_W / 2},${parentsY + NODE_H} C${fatherX + NODE_W / 2},${subjectY - 20} ${cx + NODE_W / 2},${parentsY + NODE_H} ${cx + NODE_W / 2},${subjectY}`}
            fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="5 3" />
        )}
        {(mother || subject.mother) && (
          <path d={`M${motherX + NODE_W / 2},${parentsY + NODE_H} C${motherX + NODE_W / 2},${subjectY - 20} ${cx + NODE_W / 2},${parentsY + NODE_H} ${cx + NODE_W / 2},${subjectY}`}
            fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="5 3" />
        )}

        {/* Subject → Offspring lines */}
        {offspring.map((o, i) => {
          const ox = offspringStartX + i * (NODE_W + 20);
          return <path key={o.id}
            d={`M${cx + NODE_W / 2},${subjectY + NODE_H} C${cx + NODE_W / 2},${offspringY - 20} ${ox + NODE_W / 2},${offspringY - 20} ${ox + NODE_W / 2},${offspringY}`}
            fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="5 3" />;
        })}

        {/* Parent nodes */}
        <Node animal={father} role="Father" x={fatherX} y={parentsY} />
        <Node animal={mother} role="Mother" x={motherX} y={parentsY} />

        {/* Subject node */}
        <Node animal={subject} x={cx} y={subjectY} isSubject />

        {/* Offspring nodes + action buttons */}
        {offspring.map((o, i) => {
          const ox = offspringStartX + i * (NODE_W + 20);
          return (
            <g key={o.id}>
              <Node animal={o} x={ox} y={offspringY} />
              {/* Mark for Marketplace button */}
              {o.disposition === 'Keep' && (
                <g onClick={() => onMark(o.id, 'Sell')} style={{ cursor: 'pointer' }}>
                  <rect x={ox + 2} y={offspringY + NODE_H + 6} width={65} height={18} rx={4} fill="#2e2a10" stroke="#c8a030" />
                  <text x={ox + 35} y={offspringY + NODE_H + 19} textAnchor="middle" fontSize={9} fill="#c8a030" fontWeight="600">🏪 Marketplace</text>
                </g>
              )}
              {o.disposition !== 'Release' && (
                <g onClick={() => onMark(o.id, 'Release')} style={{ cursor: 'pointer' }}>
                  <rect x={ox + 73} y={offspringY + NODE_H + 6} width={55} height={18} rx={4} fill="#081828" stroke="#4090c0" />
                  <text x={ox + 100} y={offspringY + NODE_H + 19} textAnchor="middle" fontSize={9} fill="#4090c0" fontWeight="600">🌿 Release</text>
                </g>
              )}
            </g>
          );
        })}

        {offspring.length === 0 && (
          <text x={totalW / 2} y={offspringY + 20} textAnchor="middle" fontSize={12} fill="#2e4028">No offspring recorded</text>
        )}
      </svg>
    </div>
  );
}

export default function BloodlineTracker({ bloodlines, setBloodlines, roster, speciesList }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selectedName, setSelectedName] = useState('');
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };
  const save = () => {
    if (!form.name || !form.species) return;
    const row = { ...form, id: editing || Date.now(), generation: +form.generation };
    setBloodlines(prev => editing ? prev.map(b => b.id === editing ? row : b) : [...prev, row]);
    setOpen(false);
  };
  const del = id => setBloodlines(prev => prev.filter(b => b.id !== id));
  const markDisposition = (id, val) => setBloodlines(prev => prev.map(b => b.id === id ? { ...b, disposition: val } : b));

  const allNames = [...new Set([...roster.map(r => r.name), ...bloodlines.map(b => b.name)].filter(Boolean))];
  const species = [...new Set(bloodlines.map(b => b.species))].sort();

  const filtered = bloodlines.filter(b => {
    const q = search.toLowerCase();
    return (!q || b.name?.toLowerCase().includes(q) || b.species?.toLowerCase().includes(q))
      && (!filterSpecies || b.species === filterSpecies);
  });

  const subject = bloodlines.find(b => b.name === selectedName);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bloodlines…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 27px', color: '#c8d8a8', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterSpecies ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All species</option>
          {species.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={openAdd}><Plus size={13} /> Add Record</Btn>
      </div>

      {/* Animal selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>View Family Graph For</label>
        <select value={selectedName} onChange={e => setSelectedName(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 12px', color: selectedName ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none', minWidth: 220 }}>
          <option value="">Select an animal…</option>
          {filtered.map(b => <option key={b.id} value={b.name}>{b.name} ({b.species})</option>)}
        </select>
      </div>

      {/* Family graph */}
      {subject
        ? <FamilyGraph subject={subject} all={bloodlines} onMark={markDisposition} />
        : <div style={{ background: '#0a120a', border: '1px dashed #1e2a18', borderRadius: 10, padding: '2rem', textAlign: 'center', color: '#2e4028', marginBottom: '1.5rem' }}>Select an animal above to view its immediate family graph</div>
      }

      {/* Directory table */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>All Records</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2e4028' }}>
                {['Name', 'Species', 'Father', 'Mother', 'Gen', 'Disposition', ''].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#7a9460', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon="🌳" message="No bloodline records yet!" /></td></tr>}
              {filtered.map(b => (
                <tr key={b.id} onClick={() => setSelectedName(b.name)} style={{ borderBottom: '1px solid #1a2218', cursor: 'pointer', background: selectedName === b.name ? '#0d1a0a' : 'transparent' }}>
                  <td style={{ padding: '8px 10px', color: '#c8d8a8', fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: '8px 10px', color: '#9ab880' }}>{b.species}</td>
                  <td style={{ padding: '8px 10px', color: '#7a9460' }}>{b.father || '—'}</td>
                  <td style={{ padding: '8px 10px', color: '#7a9460' }}>{b.mother || '—'}</td>
                  <td style={{ padding: '8px 10px', color: '#5a7050', textAlign: 'center' }}>G{b.generation}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: DISP_COLOR[b.disposition], fontWeight: 600, fontSize: 12 }}>{b.disposition}</span>
                  </td>
                  <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                    <button onClick={e => { e.stopPropagation(); openEdit(b); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 3 }}>✏️</button>
                    <button onClick={e => { e.stopPropagation(); del(b.id); }} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 3 }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Record' : 'Add Bloodline Record'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Field label="Offspring Name"><Input value={form.name} onChange={f('name')} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {speciesList.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Father">
            <select value={form.father} onChange={f('father')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.father ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              <option value="">Unknown / Wild</option>
              {allNames.filter(n => n !== form.name).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Mother">
            <select value={form.mother} onChange={f('mother')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.mother ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
              <option value="">Unknown / Wild</option>
              {allNames.filter(n => n !== form.name).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Generation"><Input type="number" min={1} max={3} value={form.generation} onChange={f('generation')} /></Field>
          <Field label="Disposition"><Select value={form.disposition} onChange={f('disposition')} options={DISPOSITION} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save' : 'Add Record'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
