import { useState, useMemo } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, EmptyState } from './UI.jsx';
import { DISPOSITION } from '../data/constants.js';

const EMPTY = { name: '', father: '', mother: '', species: '', generation: 1, disposition: 'Keep' };
const DISP_COLOR = { Keep: '#6ab87a', Sell: '#c8a030', Release: '#4090c0' };
const DISP_BG    = { Keep: '#0a1e10', Sell: '#1e1800', Release: '#080c1e' };

// ── Kinship calculator ─────────────────────────────────────────────────────
function getKinship(a, b, all) {
  if (a.name === b.name) return null;
  // Direct siblings: same father or same mother
  const sharedParent = (a.father && a.father === b.father) || (a.mother && a.mother === b.mother);
  if (sharedParent) return 'Sibling';
  // First cousins: parent of A is sibling of parent of B
  const aParents = [a.father, a.mother].filter(Boolean);
  const bParents = [b.father, b.mother].filter(Boolean);
  for (const ap of aParents) {
    const aParentEntry = all.find(x => x.name === ap);
    for (const bp of bParents) {
      const bParentEntry = all.find(x => x.name === bp);
      if (aParentEntry && bParentEntry) {
        const parentShared = (aParentEntry.father && aParentEntry.father === bParentEntry.father) ||
                             (aParentEntry.mother && aParentEntry.mother === bParentEntry.mother);
        if (parentShared) return 'First Cousin';
      }
    }
  }
  return null;
}

// ── SVG Node Graph ─────────────────────────────────────────────────────────
const NW = 136, NH = 70;

function Node({ animal, x, y, isSubject, onMark, accent }) {
  const dc = DISP_BG[animal?.disposition] || '#0d1410';
  const tc = DISP_COLOR[animal?.disposition] || '#7a9460';
  if (!animal) {
    return (
      <g>
        <rect x={x} y={y} width={NW} height={NH} rx={8} fill="#0a0d09" stroke="#1a2218" strokeDasharray="4 3" />
        <text x={x + NW/2} y={y + NH/2 + 4} textAnchor="middle" fontSize={11} fill="#2e4028">Unknown</text>
      </g>
    );
  }
  return (
    <g>
      <rect x={x} y={y} width={NW} height={NH} rx={8} fill={dc} stroke={isSubject ? (accent || '#0f9a6d') : '#2e4028'} strokeWidth={isSubject ? 2 : 1} />
      {isSubject && <rect x={x} y={y} width={NW} height={4} rx={2} fill={accent || '#0f9a6d'} />}
      <text x={x + NW/2} y={y + 22} textAnchor="middle" fontSize={13} fontWeight="700" fill="#c8d8a8" fontFamily="sans-serif">{animal.name}</text>
      <text x={x + NW/2} y={y + 37} textAnchor="middle" fontSize={10} fill="#7a9460" fontFamily="sans-serif">
        {animal.species?.length > 17 ? animal.species.slice(0, 16) + '…' : animal.species}
      </text>
      <text x={x + NW/2} y={y + 52} textAnchor="middle" fontSize={10} fill="#5a7050" fontFamily="monospace">G{animal.generation}</text>
      <text x={x + NW/2} y={y + 64} textAnchor="middle" fontSize={10} fontWeight="600" fill={tc}>{animal.disposition}</text>
    </g>
  );
}

function KinshipGraph({ subject, all, onMark, theme }) {
  const accent = theme?.accent || '#0f9a6d';
  if (!subject) return null;

  const father = all.find(a => a.name === subject.father);
  const mother = all.find(a => a.name === subject.mother);
  const children = all.filter(a => a.father === subject.name || a.mother === subject.name);

  // Siblings: share a parent with subject
  const siblings = all.filter(a =>
    a.name !== subject.name &&
    ((subject.father && a.father === subject.father) || (subject.mother && a.mother === subject.mother))
  );

  // First cousins: parent of sibling is sibling of a parent of subject
  const unclesAunts = all.filter(a =>
    a.name !== subject.name && !siblings.find(s => s.name === a.name) &&
    ((father && ((a.father && a.father === father.father) || (a.mother && a.mother === father.mother))) ||
     (mother && ((a.father && a.father === mother.father) || (a.mother && a.mother === mother.mother))))
  );
  const cousins = all.filter(a =>
    a.name !== subject.name &&
    unclesAunts.some(u => a.father === u.name || a.mother === u.name)
  );

  const HGAP = 20, VGAP = 60;
  const maxCols = Math.max(children.length, siblings.length + 1, cousins.length, 2);
  const totalW = Math.max(560, maxCols * (NW + HGAP));
  const cx = totalW / 2 - NW / 2;

  const parentsY = 0;
  const subjectY = parentsY + NH + VGAP;
  const childrenY = subjectY + NH + VGAP;
  const siblingsY = subjectY;
  const cousinsY  = childrenY;

  const sibStartX = 20;
  const childStartX = (totalW - (children.length * (NW + HGAP) - HGAP)) / 2;
  const cousinStartX = 20;

  const svgH = (cousins.length > 0 || children.length > 0) ? cousinsY + NH + 30 : childrenY + 30;

  return (
    <div style={{ overflowX: 'auto', background: '#080d08', border: '1px solid #1e2a18', borderRadius: 10, padding: '1rem' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 11, flexWrap: 'wrap' }}>
        {[['Subject', accent], ['Sibling', '#4a8aab'], ['First Cousin', '#9060a0'], ['Offspring', '#6ab87a']].map(([l, c]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: c, opacity: 0.6 }} />
            <span style={{ color: '#5a7050' }}>{l}</span>
          </div>
        ))}
        <span style={{ color: '#2e4028' }}>· Dashed = sibling/cousin lines</span>
      </div>

      <svg width={totalW} height={svgH} style={{ display: 'block', margin: '0 auto', minWidth: '100%' }}>
        {/* Parent → subject lines */}
        {(father || subject.father) && (
          <path d={`M${cx - NW - HGAP/2 + NW/2},${parentsY + NH} C${cx - NW/2},${subjectY - 20} ${cx + NW/2},${subjectY - 20} ${cx + NW/2},${subjectY}`}
            fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="5 3" />
        )}
        {(mother || subject.mother) && (
          <path d={`M${cx + NW + HGAP/2 + NW/2},${parentsY + NH} C${cx + NW + HGAP},${subjectY - 20} ${cx + NW/2},${subjectY - 20} ${cx + NW/2},${subjectY}`}
            fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="5 3" />
        )}

        {/* Subject → children */}
        {children.map((c, i) => {
          const ox = childStartX + i * (NW + HGAP);
          return <path key={c.id} d={`M${cx + NW/2},${subjectY + NH} C${cx + NW/2},${childrenY - 20} ${ox + NW/2},${childrenY - 20} ${ox + NW/2},${childrenY}`}
            fill="none" stroke="#2a3e20" strokeWidth={1.5} />;
        })}

        {/* Parents */}
        <Node animal={father || (subject.father ? { name: subject.father, species: '', generation: subject.generation - 1, disposition: 'Keep' } : null)}
          x={cx - NW - HGAP} y={parentsY} accent={accent} />
        <Node animal={mother || (subject.mother ? { name: subject.mother, species: '', generation: subject.generation - 1, disposition: 'Keep' } : null)}
          x={cx + NW + HGAP} y={parentsY} accent={accent} />

        {/* Subject */}
        <Node animal={subject} x={cx} y={subjectY} isSubject accent={accent} />

        {/* Siblings (left side) */}
        {siblings.map((s, i) => (
          <g key={s.id}>
            <line x1={sibStartX + i * (NW + HGAP) + NW/2} y1={siblingsY + NH/2}
                  x2={cx} y2={subjectY + NH/2}
                  stroke="#1a3060" strokeWidth={1} strokeDasharray="4 3" />
            <rect x={sibStartX + i * (NW + HGAP)} y={siblingsY} width={NW} height={NH} rx={8}
                  fill="#080c18" stroke="#1a3060" />
            <text x={sibStartX + i * (NW + HGAP) + NW/2} y={siblingsY + 22} textAnchor="middle" fontSize={12} fontWeight="600" fill="#8ab0c8">{s.name}</text>
            <text x={sibStartX + i * (NW + HGAP) + NW/2} y={siblingsY + 36} textAnchor="middle" fontSize={10} fill="#4a6a80">Sibling</text>
            <text x={sibStartX + i * (NW + HGAP) + NW/2} y={siblingsY + 50} textAnchor="middle" fontSize={10} fill={DISP_COLOR[s.disposition]}>{s.disposition}</text>
          </g>
        ))}

        {/* Children */}
        {children.map((c, i) => {
          const ox = childStartX + i * (NW + HGAP);
          return (
            <g key={c.id}>
              <Node animal={c} x={ox} y={childrenY} accent={accent} />
              {c.disposition === 'Keep' && (
                <g onClick={() => onMark(c.id, 'Sell')} style={{ cursor: 'pointer' }}>
                  <rect x={ox} y={childrenY + NH + 6} width={63} height={16} rx={3} fill="#2e2a10" stroke="#c8a030" />
                  <text x={ox + 31} y={childrenY + NH + 18} textAnchor="middle" fontSize={9} fill="#c8a030" fontWeight="600">🏪 Marketplace</text>
                </g>
              )}
              {c.disposition !== 'Release' && (
                <g onClick={() => onMark(c.id, 'Release')} style={{ cursor: 'pointer' }}>
                  <rect x={ox + 67} y={childrenY + NH + 6} width={50} height={16} rx={3} fill="#081828" stroke="#4090c0" />
                  <text x={ox + 92} y={childrenY + NH + 18} textAnchor="middle" fontSize={9} fill="#4090c0" fontWeight="600">🌿 Release</text>
                </g>
              )}
            </g>
          );
        })}

        {/* First cousins */}
        {cousins.map((c, i) => {
          const ox = cousinStartX + i * (NW + HGAP);
          return (
            <g key={c.id}>
              <rect x={ox} y={cousinsY} width={NW} height={NH} rx={8} fill="#100818" stroke="#3a1860" />
              <text x={ox + NW/2} y={cousinsY + 22} textAnchor="middle" fontSize={12} fontWeight="600" fill="#9060a0">{c.name}</text>
              <text x={ox + NW/2} y={cousinsY + 36} textAnchor="middle" fontSize={10} fill="#5a3870">1st Cousin</text>
              <text x={ox + NW/2} y={cousinsY + 50} textAnchor="middle" fontSize={10} fill={DISP_COLOR[c.disposition]}>{c.disposition}</text>
            </g>
          );
        })}
      </svg>

      {(siblings.length > 0 || cousins.length > 0) && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#180808', border: '1px solid #5a2828', borderRadius: 6 }}>
          <span style={{ fontSize: 12, color: '#c84040', fontWeight: 600 }}>⚠ Inbreeding Risk: </span>
          <span style={{ fontSize: 12, color: '#9a6060' }}>
            {siblings.length > 0 && `${siblings.length} sibling(s) detected. `}
            {cousins.length > 0 && `${cousins.length} first cousin(s) detected. `}
            Avoid pairing these animals.
          </span>
        </div>
      )}
    </div>
  );
}

export default function BloodlineTracker({ bloodlines, setBloodlines, roster, speciesList, theme }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('');
  const [selectedName, setSelectedName] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
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
    return (!q || b.name?.toLowerCase().includes(q) || b.species?.toLowerCase().includes(q)) && (!filterSpecies || b.species === filterSpecies);
  });
  const subject = bloodlines.find(b => b.name === selectedName);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bloodlines…"
            style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 27px', color: '#c8d8a8', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterSpecies} onChange={e => setFilterSpecies(e.target.value)}
          style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 10px', color: filterSpecies ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none' }}>
          <option value="">All species</option>
          {species.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={() => { setEditing(null); setForm(EMPTY); setOpen(true); }}><Plus size={13} /> Add Record</Btn>
      </div>

      {/* Animal selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>View Kinship Graph For</label>
        <select value={selectedName} onChange={e => setSelectedName(e.target.value)}
          style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 12px', color: selectedName ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none', minWidth: 220 }}>
          <option value="">Select an animal…</option>
          {filtered.map(b => <option key={b.id} value={b.name}>{b.name} ({b.species}) — G{b.generation}</option>)}
        </select>
      </div>

      {subject
        ? <KinshipGraph subject={subject} all={bloodlines} onMark={markDisposition} theme={theme} />
        : <div style={{ background: '#080d08', border: '1px dashed #1e2a18', borderRadius: 10, padding: '2rem', textAlign: 'center', color: '#2e4028', marginBottom: '1.5rem' }}>Select an animal to view their kinship web (parents, siblings, offspring, first cousins)</div>
      }

      {/* Directory */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>All Records</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2e4028' }}>
                {['Name','Species','Father','Mother','Gen','Kinship Flags','Disposition',''].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#7a9460', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8}><EmptyState icon="🌳" message="No bloodline records yet!" /></td></tr>}
              {filtered.map(b => {
                const kinFlags = filtered.filter(o => o.name !== b.name).map(o => getKinship(b, o, filtered)).filter(Boolean);
                const uniqueFlags = [...new Set(kinFlags)];
                return (
                  <tr key={b.id} onClick={() => setSelectedName(b.name)}
                    style={{ borderBottom: '1px solid #1a2218', cursor: 'pointer', background: selectedName === b.name ? '#0d1a0a' : 'transparent' }}>
                    <td style={{ padding: '8px 10px', color: '#c8d8a8', fontWeight: 600 }}>{b.name}</td>
                    <td style={{ padding: '8px 10px', color: '#9ab880' }}>{b.species}</td>
                    <td style={{ padding: '8px 10px', color: '#7a9460' }}>{b.father || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#7a9460' }}>{b.mother || '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#5a7050', textAlign: 'center' }}>G{b.generation}</td>
                    <td style={{ padding: '8px 10px' }}>
                      {uniqueFlags.map(f => (
                        <span key={f} style={{ background: f === 'Sibling' ? '#0c1e30' : '#180820', color: f === 'Sibling' ? '#4a8aab' : '#9060a0', borderRadius: 4, padding: '1px 6px', fontSize: 10, marginRight: 4 }}>{f}</span>
                      ))}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ color: DISP_COLOR[b.disposition], fontWeight: 600, fontSize: 12 }}>{b.disposition}</span>
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <button onClick={e => { e.stopPropagation(); setEditing(b.id); setForm({...b}); setOpen(true); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 3 }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); del(b.id); }} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 3 }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
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
                {(speciesList || []).map(s => <option key={s} value={s}>{s}</option>)}
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
          <Field label="Generation (1–3)"><Input type="number" min={1} max={3} value={form.generation} onChange={f('generation')} /></Field>
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
