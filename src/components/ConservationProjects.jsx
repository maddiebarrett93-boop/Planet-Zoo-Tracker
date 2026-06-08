import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, Badge, ProgressBar, EmptyState } from './UI.jsx';
import { SPECIES_LIST } from '../data/constants.js';

const EMPTY = { species: '', goalPop: '', currentPop: '', releaseGoal: '', released: '' };

export default function ConservationProjects({ conservation, setConservation, animals }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };

  const save = () => {
    if (!form.species) return;
    const row = { ...form, id: editing || Date.now(), goalPop: +form.goalPop, currentPop: +form.currentPop, releaseGoal: +form.releaseGoal, released: +form.released };
    if (editing) {
      setConservation(prev => prev.map(c => c.id === editing ? row : c));
    } else {
      setConservation(prev => [...prev, row]);
    }
    setOpen(false);
  };

  const del = id => setConservation(prev => prev.filter(c => c.id !== id));

  const getAnimalStatus = species => {
    const found = animals.find(a => a.species === species);
    return found?.conservationStatus || null;
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        {[
          { label: 'Active Projects', value: conservation.length },
          { label: 'Total Released', value: conservation.reduce((s, c) => s + (+c.released || 0), 0) },
          { label: 'Goals Met', value: conservation.filter(c => +c.currentPop >= +c.goalPop).length },
        ].map(s => (
          <div key={s.label} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
            <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#c8d8a8' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <Btn onClick={openAdd}><Plus size={14} /> Add Project</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {conservation.length === 0 && <div style={{ gridColumn: '1/-1' }}><EmptyState icon="🌿" message="No conservation projects yet — add your first!" /></div>}
        {conservation.map(c => {
          const status = getAnimalStatus(c.species);
          return (
            <div key={c.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 10, padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#c8d8a8', fontSize: 15 }}>{c.species}</div>
                  {status && <div style={{ marginTop: 4 }}><Badge status={status} /></div>}
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                  <button onClick={() => del(c.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#5a7050', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Population Goal</div>
                <ProgressBar value={c.currentPop} max={c.goalPop} />
              </div>

              {c.releaseGoal > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#5a7050', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Release Goal</div>
                  <ProgressBar value={c.released} max={c.releaseGoal} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Project' : 'Add Conservation Project'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Goal Population"><Input type="number" min={0} value={form.goalPop} onChange={f('goalPop')} /></Field>
          <Field label="Current Population"><Input type="number" min={0} value={form.currentPop} onChange={f('currentPop')} /></Field>
          <Field label="Release Goal"><Input type="number" min={0} value={form.releaseGoal} onChange={f('releaseGoal')} /></Field>
          <Field label="Total Released"><Input type="number" min={0} value={form.released} onChange={f('released')} /></Field>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Project'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
