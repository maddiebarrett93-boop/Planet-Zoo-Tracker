import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, Badge, EmptyState } from './UI.jsx';
import { SPECIES_LIST, DISPOSITION } from '../data/constants.js';

const EMPTY = { name: '', father: '', mother: '', species: '', generation: 1, disposition: 'Keep' };

const DISP_COLOR = { Keep: '#1a3020', Sell: '#2e2a10', Release: '#102030' };
const DISP_TEXT = { Keep: '#6ab87a', Sell: '#c8a030', Release: '#4090c0' };

function buildTree(nodes) {
  const byName = {};
  nodes.forEach(n => { byName[n.name] = { ...n, children: [] }; });
  const roots = [];
  nodes.forEach(n => {
    const fatherNode = byName[n.father];
    const motherNode = byName[n.mother];
    if (fatherNode) fatherNode.children.push(byName[n.name]);
    else if (motherNode) motherNode.children.push(byName[n.name]);
    else if (!n.father && !n.mother) roots.push(byName[n.name]);
    else roots.push(byName[n.name]);
  });
  // deduplicate children
  Object.values(byName).forEach(n => {
    const seen = new Set();
    n.children = n.children.filter(c => { if (seen.has(c.name)) return false; seen.add(c.name); return true; });
  });
  return roots.filter((r, i, a) => a.findIndex(x => x.name === r.name) === i);
}

const NODE_W = 130;
const NODE_H = 68;
const H_GAP = 40;
const V_GAP = 50;

function measureTree(node) {
  if (!node.children || node.children.length === 0) {
    node._w = NODE_W;
    return NODE_W;
  }
  const childrenW = node.children.reduce((sum, c) => sum + measureTree(c) + H_GAP, -H_GAP);
  node._w = Math.max(NODE_W, childrenW);
  return node._w;
}

function positionTree(node, x, y) {
  node._x = x + (node._w - NODE_W) / 2;
  node._y = y;
  if (!node.children || node.children.length === 0) return;
  let cx = x;
  node.children.forEach(child => {
    positionTree(child, cx, y + NODE_H + V_GAP);
    cx += child._w + H_GAP;
  });
}

function collectNodes(node, out = []) {
  out.push(node);
  (node.children || []).forEach(c => collectNodes(c, out));
  return out;
}

function collectEdges(node, out = []) {
  (node.children || []).forEach(c => {
    out.push({ from: node, to: c });
    collectEdges(c, out);
  });
  return out;
}

function FamilyTree({ nodes, onEdit, onDelete }) {
  const [selected, setSelected] = useState(null);

  const roots = buildTree(nodes);
  roots.forEach(r => { measureTree(r); positionTree(r, 0, 0); });

  const allNodes = roots.flatMap(r => collectNodes(r));
  const allEdges = roots.flatMap(r => collectEdges(r));

  if (allNodes.length === 0) return <EmptyState icon="🌳" message="No bloodline records yet!" />;

  const xs = allNodes.map(n => n._x);
  const ys = allNodes.map(n => n._y);
  const minX = Math.min(...xs) - 20;
  const minY = Math.min(...ys) - 20;
  const maxX = Math.max(...xs) + NODE_W + 20;
  const maxY = Math.max(...ys) + NODE_H + 20;
  const svgW = maxX - minX;
  const svgH = maxY - minY;

  return (
    <div style={{ overflowX: 'auto', overflowY: 'auto', background: '#0d1410', borderRadius: 10, border: '1px solid #2e4028', padding: '1rem' }}>
      <svg width={svgW} height={svgH} style={{ display: 'block', minWidth: '100%' }}>
        {/* Edges */}
        {allEdges.map((e, i) => {
          const x1 = e.from._x - minX + NODE_W / 2;
          const y1 = e.from._y - minY + NODE_H;
          const x2 = e.to._x - minX + NODE_W / 2;
          const y2 = e.to._y - minY;
          const my = (y1 + y2) / 2;
          return (
            <path key={i} d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
              fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="4 3" />
          );
        })}

        {/* Nodes */}
        {allNodes.map(n => {
          const nx = n._x - minX;
          const ny = n._y - minY;
          const isSelected = selected === n.name;
          const dc = DISP_COLOR[n.disposition] || '#1a2818';
          const dt = DISP_TEXT[n.disposition] || '#7a9460';
          return (
            <g key={n.name} onClick={() => setSelected(isSelected ? null : n.name)} style={{ cursor: 'pointer' }}>
              <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8}
                fill={dc} stroke={isSelected ? '#58673f' : '#2e4028'} strokeWidth={isSelected ? 2 : 1} />
              {/* Gen badge */}
              <rect x={nx + NODE_W - 30} y={ny + 6} width={24} height={16} rx={4} fill="#0d1410" />
              <text x={nx + NODE_W - 18} y={ny + 18} textAnchor="middle" fontSize={10} fill="#5a7050" fontFamily="monospace">G{n.generation}</text>
              {/* Name */}
              <text x={nx + NODE_W / 2} y={ny + 26} textAnchor="middle" fontSize={13} fontWeight="700" fill="#c8d8a8" fontFamily="'Trebuchet MS', sans-serif">{n.name}</text>
              {/* Species (truncated) */}
              <text x={nx + NODE_W / 2} y={ny + 40} textAnchor="middle" fontSize={10} fill="#7a9460" fontFamily="'Trebuchet MS', sans-serif">
                {n.species && n.species.length > 16 ? n.species.slice(0, 15) + '…' : n.species}
              </text>
              {/* Disposition */}
              <text x={nx + NODE_W / 2} y={ny + 56} textAnchor="middle" fontSize={10} fontWeight="600" fill={dt} fontFamily="'Trebuchet MS', sans-serif">{n.disposition}</text>

              {/* Edit/delete on hover via selected state */}
              {isSelected && (
                <>
                  <rect x={nx} y={ny} width={NODE_W} height={NODE_H} rx={8} fill="rgba(0,0,0,0.4)" />
                  <text x={nx + NODE_W / 2 - 14} y={ny + NODE_H / 2 + 5} textAnchor="middle" fontSize={13} fill="#7a9460" fontFamily="monospace"
                    onClick={ev => { ev.stopPropagation(); onEdit(nodes.find(x => x.name === n.name)); setSelected(null); }} style={{ cursor: 'pointer' }}>✏️</text>
                  <text x={nx + NODE_W / 2 + 14} y={ny + NODE_H / 2 + 5} textAnchor="middle" fontSize={13} fill="#c96060" fontFamily="monospace"
                    onClick={ev => { ev.stopPropagation(); onDelete(nodes.find(x => x.name === n.name).id); setSelected(null); }} style={{ cursor: 'pointer' }}>🗑️</text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <p style={{ textAlign: 'center', color: '#3a5030', fontSize: 12, marginTop: 8 }}>Click a node to edit or delete</p>
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
  const [view, setView] = useState('tree');

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

  const animalNames = [...new Set([...breeding.map(b => b.name), ...bloodlines.map(b => b.name)].filter(Boolean))];
  const species = [...new Set(bloodlines.map(b => b.species))].sort();

  const filtered = bloodlines.filter(b => {
    const q = search.toLowerCase();
    const matchQ = !q || b.name?.toLowerCase().includes(q) || b.father?.toLowerCase().includes(q) || b.mother?.toLowerCase().includes(q);
    const matchSp = !filterSpecies || b.species === filterSpecies;
    const matchD = !filterDisp || b.disposition === filterDisp;
    return matchQ && matchSp && matchD;
  });

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
          {['tree', 'table'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? '#58673f' : 'transparent', border: 'none', color: view === v ? '#e8f0d0' : '#7a9460', padding: '6px 14px', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{v === 'tree' ? '🌳 Tree' : '📋 Table'}</button>
          ))}
        </div>
        <Btn onClick={openAdd}><Plus size={14} /> Add Offspring</Btn>
      </div>

      {/* Legend */}
      {view === 'tree' && (
        <div style={{ display: 'flex', gap: 16, marginBottom: '1rem', flexWrap: 'wrap' }}>
          {DISPOSITION.map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: DISP_COLOR[d] || '#1a2818', border: `1px solid ${DISP_TEXT[d] || '#7a9460'}` }} />
              <span style={{ color: '#5a7050' }}>{d}</span>
            </div>
          ))}
          <span style={{ color: '#3a5030', fontSize: 12 }}>· Dashed lines = parent → offspring</span>
        </div>
      )}

      {view === 'tree' ? (
        <FamilyTree nodes={filtered} onEdit={openEdit} onDelete={del} />
      ) : (
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
              {filtered.length === 0 && <tr><td colSpan={7}><EmptyState icon="🌳" message="No bloodline records yet!" /></td></tr>}
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
