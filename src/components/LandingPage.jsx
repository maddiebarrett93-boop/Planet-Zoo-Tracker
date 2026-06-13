import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEFAULT_ZOO } from '../data/constants.js';

const IUCN_COLORS = {
  'Critically Endangered':'#c84040','Endangered':'#c87030','Vulnerable':'#c8a030',
  'Near Threatened':'#9ab84a','Least Concern':'#6ab87a',
};

function ZooCard({ zoo, onSelect, onDelete, isOnly }) {
  const totalAnimals = (zoo.animals||[]).reduce((s,a) => s + (+a.males||0) + (+a.females||0), 0);
  const speciesCount = (zoo.animals||[]).length;
  const critCount    = (zoo.animals||[]).filter(a => a.conservationStatus === 'Critically Endangered').length;
  const habitatCount = (zoo.habitats||[]).length;
  const rosterCount  = (zoo.roster||[]).length;

  return (
    <div
      onClick={() => onSelect(zoo.id)}
      style={{ background:'#111a0f', border:'1px solid #2e4028', borderRadius:14, padding:'1.5rem', cursor:'pointer', position:'relative', transition:'border-color 0.2s, transform 0.15s', userSelect:'none' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a6030'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e4028'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Delete button */}
      {!isOnly && (
        <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${zoo.name}"?`)) onDelete(zoo.id); }}
          style={{ position:'absolute', top:12, right:12, background:'none', border:'none', color:'#3a5030', cursor:'pointer', padding:4, fontSize:14 }}>
          <Trash2 size={14} />
        </button>
      )}

      {/* Zoo name */}
      <div style={{ fontSize:22, fontWeight:800, color:'#e0ecc0', marginBottom:4, paddingRight:28 }}>{zoo.name}</div>
      <div style={{ fontSize:11, color:'#5a7050', marginBottom:'1.25rem', fontFamily:"'Inter',system-ui,sans-serif" }}>{zoo.id}</div>

      {/* Stats grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:'1rem' }}>
        {[
          { label:'Species', value:speciesCount, icon:'🦁' },
          { label:'Animals', value:totalAnimals, icon:'🐾' },
          { label:'Habitats', value:habitatCount, icon:'🏕️' },
          { label:'Roster', value:rosterCount, icon:'📋' },
        ].map(s => (
          <div key={s.label} style={{ background:'#0a1208', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#c8d8a8', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:10, color:'#5a7050' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Conservation alert */}
      {critCount > 0 && (
        <div style={{ background:'#180808', border:'1px solid #5a2828', borderRadius:6, padding:'6px 10px', fontSize:12, color:'#c84040', marginBottom:'0.75rem' }}>
          ⚠ {critCount} Critically Endangered species
        </div>
      )}

      {/* Enter button */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:12, color:'#5a7050' }}>
          Last updated: {zoo.createdAt ? new Date(zoo.createdAt).toLocaleDateString() : '—'}
        </div>
        <div style={{ fontSize:12, color:'#7a9460', fontWeight:600 }}>Enter →</div>
      </div>
    </div>
  );
}

export default function LandingPage({ zoos, onSelect, onAdd, onDelete, theme }) {
  const accent = theme?.accent || '#0f9a6d';
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim());
    setNewName('');
    setShowNew(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#080d08', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem 1rem' }}>

      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🦒</div>
        <div style={{ fontSize:28, fontWeight:800, color:'#e0ecc0', letterSpacing:'-0.02em', marginBottom:8 }}>
          Planet Zoo Tracker
        </div>
        <div style={{ fontSize:15, color:'#5a7050' }}>What are we working with today?</div>
      </div>

      {/* Zoo grid */}
      <div style={{ width:'100%', maxWidth:780 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14, marginBottom:14 }}>
          {zoos.map(zoo => (
            <ZooCard key={zoo.id} zoo={zoo} onSelect={onSelect} onDelete={onDelete} isOnly={zoos.length === 1} />
          ))}

          {/* New zoo card */}
          {!showNew ? (
            <button onClick={() => setShowNew(true)}
              style={{ background:'transparent', border:`2px dashed #2e4028`, borderRadius:14, padding:'1.5rem', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minHeight:160, transition:'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3a6030'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2e4028'}
            >
              <div style={{ width:44, height:44, background:`${accent}22`, border:`1px solid ${accent}`, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Plus size={22} color={accent} />
              </div>
              <div style={{ fontSize:14, color:'#5a7050', fontWeight:600 }}>New Zoo</div>
            </button>
          ) : (
            <div style={{ background:'#111a0f', border:`1px solid ${accent}`, borderRadius:14, padding:'1.5rem', display:'flex', flexDirection:'column', gap:10, justifyContent:'center' }}>
              <div style={{ fontSize:14, color:'#c8d8a8', fontWeight:600 }}>Name your zoo</div>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowNew(false); }}
                placeholder="e.g. My Safari Park"
                autoFocus
                style={{ background:'#0a120a', border:'1px solid #2e4028', borderRadius:7, padding:'8px 12px', color:'#c8d8a8', fontSize:15, outline:'none', fontWeight:600 }}
              />
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleAdd}
                  style={{ flex:1, background:accent, border:'none', borderRadius:7, padding:'8px', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                  Create Zoo
                </button>
                <button onClick={() => { setShowNew(false); setNewName(''); }}
                  style={{ background:'transparent', border:'1px solid #2e4028', borderRadius:7, padding:'8px 12px', color:'#5a7050', fontSize:13, cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ textAlign:'center', fontSize:12, color:'#2e4028' }}>
          {zoos.length} zoo{zoos.length !== 1 ? 's' : ''} saved · data syncs to Google Sheets
        </div>
      </div>
    </div>
  );
}
