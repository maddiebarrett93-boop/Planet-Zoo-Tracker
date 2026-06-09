import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, EmptyState } from './UI.jsx';
import { FACILITY_TYPES, VENDOR_TYPES } from '../data/constants.js';

const EMPTY_FAC  = { type: '', zone: '', notes: '' };
const EMPTY_VEN  = { type: '', zone: '', quantity: 1, notes: '' };
const EMPTY_ZONE = '';

export default function Peeps({ peeps, setPeeps }) {
  const [tab, setTab] = useState('facilities');
  const [facOpen, setFacOpen]   = useState(false);
  const [venOpen, setVenOpen]   = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [editFac, setEditFac]   = useState(null);
  const [editVen, setEditVen]   = useState(null);
  const [facForm, setFacForm]   = useState(EMPTY_FAC);
  const [venForm, setVenForm]   = useState(EMPTY_VEN);
  const [newZone, setNewZone]   = useState('');
  const [filterZone, setFilterZone] = useState('');

  const ff = k => e => setFacForm(p => ({ ...p, [k]: e.target.value }));
  const fv = k => e => setVenForm(p => ({ ...p, [k]: e.target.value }));

  const saveFac = () => {
    if (!facForm.type) return;
    const row = { ...facForm, id: editFac || Date.now() };
    setPeeps(p => ({ ...p, facilities: editFac ? p.facilities.map(f => f.id === editFac ? row : f) : [...p.facilities, row] }));
    setFacOpen(false);
  };
  const saveVen = () => {
    if (!venForm.type) return;
    const row = { ...venForm, id: editVen || Date.now(), quantity: +venForm.quantity };
    setPeeps(p => ({ ...p, vendors: editVen ? p.vendors.map(v => v.id === editVen ? row : v) : [...p.vendors, row] }));
    setVenOpen(false);
  };
  const addZone = () => {
    if (!newZone.trim()) return;
    setPeeps(p => ({ ...p, zones: [...(p.zones || []), newZone.trim()] }));
    setNewZone(''); setZoneOpen(false);
  };
  const delZone = z => setPeeps(p => ({ ...p, zones: p.zones.filter(x => x !== z) }));
  const delFac  = id => setPeeps(p => ({ ...p, facilities: p.facilities.filter(f => f.id !== id) }));
  const delVen  = id => setPeeps(p => ({ ...p, vendors: p.vendors.filter(v => v.id !== id) }));

  const zones = peeps.zones || [];
  const filtFac = (peeps.facilities || []).filter(f => !filterZone || f.zone === filterZone);
  const filtVen = (peeps.vendors || []).filter(v => !filterZone || v.zone === filterZone);

  // Totals by type
  const facTotals = FACILITY_TYPES.reduce((acc, t) => { acc[t] = (peeps.facilities || []).filter(f => f.type === t).length; return acc; }, {});
  const venTotals = VENDOR_TYPES.reduce((acc, t) => { acc[t] = (peeps.vendors || []).filter(v => v.type === t).reduce((s, v) => s + (+v.quantity || 1), 0); return acc; }, {});

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
        {[...FACILITY_TYPES.map(t => ({ label: t, value: facTotals[t] })), ...VENDOR_TYPES.map(t => ({ label: t, value: venTotals[t] }))].map(s => (
          <div key={s.label} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.65rem 0.9rem' }}>
            <div style={{ fontSize: 10, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#c8d8a8' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Zone pills */}
      <div style={{ marginBottom: '1rem', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Zones:</span>
        <button onClick={() => setFilterZone('')} style={{ background: !filterZone ? '#2a3e20' : '#111a0f', border: `1px solid ${!filterZone ? '#58673f' : '#2e4028'}`, borderRadius: 20, padding: '3px 12px', color: !filterZone ? '#c8d8a8' : '#5a7050', fontSize: 12, cursor: 'pointer' }}>All</button>
        {zones.map(z => (
          <div key={z} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button onClick={() => setFilterZone(z)} style={{ background: filterZone === z ? '#2a3e20' : '#111a0f', border: `1px solid ${filterZone === z ? '#58673f' : '#2e4028'}`, borderRadius: 20, padding: '3px 12px', color: filterZone === z ? '#c8d8a8' : '#5a7050', fontSize: 12, cursor: 'pointer' }}>{z}</button>
            <button onClick={() => delZone(z)} style={{ background: 'none', border: 'none', color: '#3a5030', cursor: 'pointer', fontSize: 12, padding: 0 }}>×</button>
          </div>
        ))}
        <button onClick={() => setZoneOpen(true)} style={{ background: 'none', border: '1px dashed #2e4028', borderRadius: 20, padding: '3px 10px', color: '#3a5030', fontSize: 12, cursor: 'pointer' }}>+ Zone</button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: '1rem', borderBottom: '1px solid #2e4028' }}>
        {[['facilities', '🏗️ Facilities'], ['vendors', '🛍️ Vendors']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: 'none', border: 'none', borderBottom: tab === id ? '2px solid #58673f' : '2px solid transparent', color: tab === id ? '#c8d8a8' : '#5a7050', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400 }}>{label}</button>
        ))}
      </div>

      {tab === 'facilities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Btn onClick={() => { setEditFac(null); setFacForm(EMPTY_FAC); setFacOpen(true); }}><Plus size={13} /> Add Facility</Btn>
          </div>
          {filtFac.length === 0
            ? <EmptyState icon="🏗️" message="No facilities logged yet!" />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {filtFac.map(f => (
                  <div key={f.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#c8d8a8' }}>{f.type}</span>
                      <div>
                        <button onClick={() => { setEditFac(f.id); setFacForm(f); setFacOpen(true); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 2 }}><Pencil size={13} /></button>
                        <button onClick={() => delFac(f.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    {f.zone && <div style={{ fontSize: 12, color: '#5a7050' }}>📍 {f.zone}</div>}
                    {f.notes && <div style={{ fontSize: 11, color: '#3a5030', marginTop: 4 }}>{f.notes}</div>}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {tab === 'vendors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Btn onClick={() => { setEditVen(null); setVenForm(EMPTY_VEN); setVenOpen(true); }}><Plus size={13} /> Add Vendor</Btn>
          </div>
          {filtVen.length === 0
            ? <EmptyState icon="🛍️" message="No vendors logged yet!" />
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {filtVen.map(v => (
                  <div key={v.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: '#c8d8a8' }}>{v.type}</span>
                      <div>
                        <button onClick={() => { setEditVen(v.id); setVenForm(v); setVenOpen(true); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 2 }}><Pencil size={13} /></button>
                        <button onClick={() => delVen(v.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: '#5a7050' }}>Qty: <span style={{ color: '#c8d8a8' }}>{v.quantity}</span></span>
                      {v.zone && <span style={{ color: '#5a7050' }}>📍 {v.zone}</span>}
                    </div>
                    {v.notes && <div style={{ fontSize: 11, color: '#3a5030', marginTop: 4 }}>{v.notes}</div>}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* Modals */}
      <Modal open={facOpen} onClose={() => setFacOpen(false)} title={editFac ? 'Edit Facility' : 'Add Facility'}>
        <Field label="Facility Type"><Select value={facForm.type} onChange={ff('type')} placeholder="Select type…" options={FACILITY_TYPES} /></Field>
        <Field label="Zone">
          <select value={facForm.zone} onChange={ff('zone')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: facForm.zone ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
            <option value="">No zone assigned</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <Field label="Notes"><Input value={facForm.notes} onChange={ff('notes')} placeholder="Optional notes…" /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setFacOpen(false)}>Cancel</Btn>
          <Btn onClick={saveFac}>Save</Btn>
        </div>
      </Modal>

      <Modal open={venOpen} onClose={() => setVenOpen(false)} title={editVen ? 'Edit Vendor' : 'Add Vendor'}>
        <Field label="Vendor Type"><Select value={venForm.type} onChange={fv('type')} placeholder="Select type…" options={VENDOR_TYPES} /></Field>
        <Field label="Quantity"><Input type="number" min={1} value={venForm.quantity} onChange={fv('quantity')} /></Field>
        <Field label="Zone">
          <select value={venForm.zone} onChange={fv('zone')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: venForm.zone ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
            <option value="">No zone assigned</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <Field label="Notes"><Input value={venForm.notes} onChange={fv('notes')} placeholder="Optional notes…" /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setVenOpen(false)}>Cancel</Btn>
          <Btn onClick={saveVen}>Save</Btn>
        </div>
      </Modal>

      <Modal open={zoneOpen} onClose={() => setZoneOpen(false)} title="Add Zone">
        <Field label="Zone Name"><Input value={newZone} onChange={e => setNewZone(e.target.value)} placeholder="e.g. Africa Hub" /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setZoneOpen(false)}>Cancel</Btn>
          <Btn onClick={addZone}>Add Zone</Btn>
        </div>
      </Modal>
    </div>
  );
}
