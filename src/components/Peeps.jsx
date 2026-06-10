import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Modal, Field, Input, Select, Btn, EmptyState } from './UI.jsx';
import { FACILITY_TYPES, VENDOR_BRANDS } from '../data/constants.js';

const RESTAURANT_BRANDS = ['Chief Beef','Mexelente','Street Fox Coffee','Lotus Kitchen','Jungle Juice Bar','Polar Pops','Mixed / Other'];
const VENDOR_TYPES = ['Food Stall','Drink Stall','Merchandise'];
const EMPTY_FAC = { type: '', zone: '', notes: '' };
const EMPTY_VEN = { type: '', brand: '', zone: '', proximity: '', quantity: 1, notes: '' };
const EMPTY_RES = { brand: '', zone: '', proximity: '', seats: '', notes: '' };

function ProximitySelect({ zones, value, onChange, placeholder }) {
  const [mode, setMode] = useState(value?.startsWith('Near habitat:') ? 'habitat' : 'zone');
  const [habitatName, setHabitatName] = useState(value?.replace('Near habitat: ', '') || '');

  const update = (m, v) => {
    if (m === 'zone') onChange(v);
    else onChange(`Near habitat: ${v}`);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        {['zone', 'habitat'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, background: mode === m ? '#2a3e20' : '#111a0f', border: `1px solid ${mode === m ? '#58673f' : '#2e4028'}`, borderRadius: 5, padding: '4px', color: mode === m ? '#c8d8a8' : '#5a7050', fontSize: 12, cursor: 'pointer' }}>
            {m === 'zone' ? '📍 Zone' : '🦁 Near Habitat'}
          </button>
        ))}
      </div>
      {mode === 'zone' ? (
        <select value={mode === 'zone' ? value : ''} onChange={e => update('zone', e.target.value)}
          style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: value ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
          <option value="">No zone</option>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      ) : (
        <input value={habitatName} onChange={e => { setHabitatName(e.target.value); update('habitat', e.target.value); }}
          placeholder="e.g. Elephant Habitat, Tiger Territory…"
          style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
      )}
    </div>
  );
}

export default function Peeps({ peeps, setPeeps, theme }) {
  const [subtab, setSubtab] = useState('facilities');
  const [facOpen, setFacOpen] = useState(false);
  const [venOpen, setVenOpen] = useState(false);
  const [resOpen, setResOpen] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [editFac, setEditFac] = useState(null);
  const [editVen, setEditVen] = useState(null);
  const [editRes, setEditRes] = useState(null);
  const [facForm, setFacForm] = useState(EMPTY_FAC);
  const [venForm, setVenForm] = useState(EMPTY_VEN);
  const [resForm, setResForm] = useState(EMPTY_RES);
  const [newZone, setNewZone] = useState('');
  const [filterZone, setFilterZone] = useState('');

  const ff = k => e => setFacForm(p => ({ ...p, [k]: e.target.value }));
  const fv = k => v => setVenForm(p => ({ ...p, [k]: typeof v === 'object' ? v.target.value : v }));
  const fr = k => v => setResForm(p => ({ ...p, [k]: typeof v === 'object' ? v.target.value : v }));

  const saveFac = () => {
    if (!facForm.type) return;
    const row = { ...facForm, id: editFac || Date.now() };
    setPeeps(p => ({ ...p, facilities: editFac ? p.facilities.map(f => f.id === editFac ? row : f) : [...(p.facilities||[]), row] }));
    setFacOpen(false);
  };
  const saveVen = () => {
    if (!venForm.type) return;
    const row = { ...venForm, id: editVen || Date.now(), quantity: +venForm.quantity || 1 };
    setPeeps(p => ({ ...p, vendors: editVen ? p.vendors.map(v => v.id === editVen ? row : v) : [...(p.vendors||[]), row] }));
    setVenOpen(false);
  };
  const saveRes = () => {
    if (!resForm.brand) return;
    const row = { ...resForm, id: editRes || Date.now() };
    setPeeps(p => ({ ...p, restaurants: editRes ? (p.restaurants||[]).map(r => r.id === editRes ? row : r) : [...(p.restaurants||[]), row] }));
    setResOpen(false);
  };
  const addZone = () => {
    if (!newZone.trim()) return;
    setPeeps(p => ({ ...p, zones: [...(p.zones||[]), newZone.trim()] }));
    setNewZone(''); setZoneOpen(false);
  };
  const del = (tab, id) => setPeeps(p => ({ ...p, [tab]: (p[tab]||[]).filter(x => x.id !== id) }));
  const delZone = z => setPeeps(p => ({ ...p, zones: p.zones.filter(x => x !== z) }));

  const zones = peeps.zones || [];
  const facilities = (peeps.facilities || []).filter(f => !filterZone || f.zone === filterZone);
  const vendors = (peeps.vendors || []).filter(v => !filterZone || v.zone === filterZone);
  const restaurants = (peeps.restaurants || []).filter(r => !filterZone || r.zone === filterZone);

  const facTotals = FACILITY_TYPES.reduce((acc, t) => { acc[t] = (peeps.facilities||[]).filter(f => f.type === t).length; return acc; }, {});
  const venTotal = (peeps.vendors||[]).reduce((s, v) => s + (+v.quantity||1), 0);
  const resTotal = (peeps.restaurants||[]).length;

  const venBrands = venForm.type ? (VENDOR_BRANDS[venForm.type] || []) : [];

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
        {[...FACILITY_TYPES.map(t => ({ label: t, value: facTotals[t] || 0 })),
          { label: 'Vendors', value: venTotal }, { label: 'Restaurants', value: resTotal }
        ].map(s => (
          <div key={s.label} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.65rem 0.9rem' }}>
            <div style={{ fontSize: 10, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#c8d8a8' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Zones */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zones:</span>
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
        {[['facilities','🏗️ Facilities'],['vendors','🛍️ Vendors'],['restaurants','🍔 Restaurants']].map(([id, label]) => (
          <button key={id} onClick={() => setSubtab(id)} style={{ background: 'none', border: 'none', borderBottom: subtab === id ? '2px solid var(--accent)' : '2px solid transparent', color: subtab === id ? '#c8d8a8' : '#5a7050', padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: subtab === id ? 600 : 400 }}>{label}</button>
        ))}
      </div>

      {subtab === 'facilities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Btn onClick={() => { setEditFac(null); setFacForm(EMPTY_FAC); setFacOpen(true); }}><Plus size={13} /> Add Facility</Btn>
          </div>
          {facilities.length === 0 ? <EmptyState icon="🏗️" message="No facilities logged" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {facilities.map(f => (
                <div key={f.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#c8d8a8' }}>{f.type}</span>
                    <div>
                      <button onClick={() => { setEditFac(f.id); setFacForm(f); setFacOpen(true); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 2 }}><Pencil size={13} /></button>
                      <button onClick={() => del('facilities', f.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {f.zone && <div style={{ fontSize: 12, color: '#5a7050' }}>📍 {f.zone}</div>}
                  {f.notes && <div style={{ fontSize: 11, color: '#3a5030', marginTop: 3 }}>{f.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subtab === 'vendors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Btn onClick={() => { setEditVen(null); setVenForm(EMPTY_VEN); setVenOpen(true); }}><Plus size={13} /> Add Vendor</Btn>
          </div>
          {vendors.length === 0 ? <EmptyState icon="🛍️" message="No vendors logged" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {vendors.map(v => (
                <div key={v.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontWeight: 700, color: '#c8d8a8' }}>{v.brand || v.type}</span>
                      {v.brand && v.type && <span style={{ color: '#5a7050', fontSize: 11, marginLeft: 6 }}>{v.type}</span>}
                    </div>
                    <div>
                      <button onClick={() => { setEditVen(v.id); setVenForm(v); setVenOpen(true); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 2 }}><Pencil size={13} /></button>
                      <button onClick={() => del('vendors', v.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#7a9460' }}>×{v.quantity || 1}</div>
                  {v.proximity && <div style={{ fontSize: 11, color: '#4a7060', marginTop: 2 }}>{v.proximity.startsWith('Near habitat:') ? '🦁' : '📍'} {v.proximity}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subtab === 'restaurants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <Btn onClick={() => { setEditRes(null); setResForm(EMPTY_RES); setResOpen(true); }}><Plus size={13} /> Add Restaurant</Btn>
          </div>
          {restaurants.length === 0 ? <EmptyState icon="🍔" message="No restaurants logged" /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {restaurants.map(r => (
                <div key={r.id} style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 8, padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#c8d8a8' }}>{r.brand}</span>
                    <div>
                      <button onClick={() => { setEditRes(r.id); setResForm(r); setResOpen(true); }} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 2 }}><Pencil size={13} /></button>
                      <button onClick={() => del('restaurants', r.id)} style={{ background: 'none', border: 'none', color: '#c96060', cursor: 'pointer', padding: 2 }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                  {r.seats && <div style={{ fontSize: 12, color: '#7a9460' }}>{r.seats} seats</div>}
                  {r.proximity && <div style={{ fontSize: 11, color: '#4a7060', marginTop: 2 }}>{r.proximity.startsWith('Near habitat:') ? '🦁' : '📍'} {r.proximity}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={facOpen} onClose={() => setFacOpen(false)} title={editFac ? 'Edit Facility' : 'Add Facility'}>
        <Field label="Type"><Select value={facForm.type} onChange={ff('type')} placeholder="Select type…" options={FACILITY_TYPES} /></Field>
        <Field label="Zone">
          <select value={facForm.zone} onChange={ff('zone')} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: facForm.zone ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}>
            <option value="">No zone</option>
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <Field label="Notes"><Input value={facForm.notes} onChange={ff('notes')} /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setFacOpen(false)}>Cancel</Btn>
          <Btn onClick={saveFac}>Save</Btn>
        </div>
      </Modal>

      <Modal open={venOpen} onClose={() => setVenOpen(false)} title={editVen ? 'Edit Vendor' : 'Add Vendor'}>
        <Field label="Type"><Select value={venForm.type} onChange={e => setVenForm(p => ({ ...p, type: e.target.value, brand: '' }))} placeholder="Select type…" options={VENDOR_TYPES} /></Field>
        {venForm.type && (
          <Field label="Brand">
            <Select value={venForm.brand} onChange={e => setVenForm(p => ({ ...p, brand: e.target.value }))} placeholder="Select brand…" options={VENDOR_BRANDS[venForm.type] || []} />
          </Field>
        )}
        <Field label="Quantity"><Input type="number" min={1} value={venForm.quantity} onChange={e => setVenForm(p => ({ ...p, quantity: e.target.value }))} /></Field>
        <Field label="Location">
          <ProximitySelect zones={zones} value={venForm.proximity} onChange={v => setVenForm(p => ({ ...p, proximity: v }))} />
        </Field>
        <Field label="Notes"><Input value={venForm.notes} onChange={e => setVenForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setVenOpen(false)}>Cancel</Btn>
          <Btn onClick={saveVen}>Save</Btn>
        </div>
      </Modal>

      <Modal open={resOpen} onClose={() => setResOpen(false)} title={editRes ? 'Edit Restaurant' : 'Add Restaurant'}>
        <Field label="Brand"><Select value={resForm.brand} onChange={e => setResForm(p => ({ ...p, brand: e.target.value }))} placeholder="Select brand…" options={RESTAURANT_BRANDS} /></Field>
        <Field label="Seats"><Input type="number" min={0} value={resForm.seats} onChange={e => setResForm(p => ({ ...p, seats: e.target.value }))} placeholder="e.g. 40" /></Field>
        <Field label="Location">
          <ProximitySelect zones={zones} value={resForm.proximity} onChange={v => setResForm(p => ({ ...p, proximity: v }))} />
        </Field>
        <Field label="Notes"><Input value={resForm.notes} onChange={e => setResForm(p => ({ ...p, notes: e.target.value }))} /></Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <Btn variant="ghost" onClick={() => setResOpen(false)}>Cancel</Btn>
          <Btn onClick={saveRes}>Save</Btn>
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
