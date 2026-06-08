import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Modal, Field, Input, Select, Textarea, Btn, Badge, EmptyState } from './UI.jsx';
import { CONSERVATION_STATUSES, SPECIES_LIST } from '../data/constants.js';

const EMPTY = { species: '', habitat: '', males: 0, females: 0, conservationStatus: '', notes: '' };

export default function AnimalInventory({ animals, setAnimals }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const openEdit = row => { setEditing(row.id); setForm({ ...row }); setOpen(true); };

  const save = () => {
    if (!form.species) return;
    if (editing) {
      setAnimals(prev => prev.map(a => a.id === editing ? { ...form, id: editing } : a));
    } else {
      setAnimals(prev => [...prev, { ...form, id: Date.now(), males: +form.males, females: +form.females }]);
    }
    setOpen(false);
  };

  const del = id => setAnimals(prev => prev.filter(a => a.id !== id));

  const filtered = animals.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.species.toLowerCase().includes(q) || a.habitat?.toLowerCase().includes(q);
    const matchS = !filterStatus || a.conservationStatus === filterStatus;
    return matchQ && matchS;
  });

  const totalAnimals = animals.reduce((s, a) => s + (+a.males || 0) + (+a.females || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
        {[
          { label: 'Species', value: animals.length },
          { label: 'Total Animals', value: totalAnimals },
          { label: 'Critical / Endangered', value: animals.filter(a => ['Critically Endangered', 'Endangered'].includes(a.conservationStatus)).length },
          { label: 'Habitats', value: [...new Set(animals.map(a => a.habitat).filter(Boolean))].length },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search species or habitat…" style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 28px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: filterStatus ? '#c8d8a8' : '#5a7050', fontSize: 14, outline: 'none' }}>
          <option value="">All statuses</option>
          {CONSERVATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Btn onClick={openAdd}><Plus size={14} /> Add Species</Btn>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2e4028' }}>
              {['Species', 'Habitat', 'Males', 'Females', 'Total', 'Status', 'Notes', ''].map(h => (
                <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#7a9460', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8}><EmptyState icon="🦁" message="No animals yet — add your first species!" /></td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid #1e2a18' }}>
                <td style={{ padding: '10px 10px', color: '#c8d8a8', fontWeight: 500 }}>{a.species}</td>
                <td style={{ padding: '10px 10px', color: '#9ab880' }}>{a.habitat || '—'}</td>
                <td style={{ padding: '10px 10px', color: '#7a9460', textAlign: 'center' }}>{a.males}</td>
                <td style={{ padding: '10px 10px', color: '#7a9460', textAlign: 'center' }}>{a.females}</td>
                <td style={{ padding: '10px 10px', color: '#c8d8a8', fontWeight: 600, textAlign: 'center' }}>{+a.males + +a.females}</td>
                <td style={{ padding: '10px 10px' }}><Badge status={a.conservationStatus} /></td>
                <td style={{ padding: '10px 10px', color: '#5a7050', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notes || '—'}</td>
                <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                  <button onClick={() => openEdit(a)} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4 }}><Pencil size={14} /></button>
                  <button onClick={() => del(a.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit Species' : 'Add Species'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Species">
              <select value={form.species} onChange={f('species')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: form.species ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
                <option value="">Select species…</option>
                {SPECIES_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Habitat Name"><Input value={form.habitat} onChange={f('habitat')} placeholder="e.g. Tiger Territory" /></Field>
          <Field label="Conservation Status">
            <Select value={form.conservationStatus} onChange={f('conservationStatus')} placeholder="Select status…" options={CONSERVATION_STATUSES} />
          </Field>
          <Field label="Males"><Input type="number" min={0} value={form.males} onChange={f('males')} /></Field>
          <Field label="Females"><Input type="number" min={0} value={form.females} onChange={f('females')} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Notes"><Textarea value={form.notes} onChange={f('notes')} placeholder="Any notes…" /></Field>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
          <Btn onClick={save}>{editing ? 'Save Changes' : 'Add Species'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
