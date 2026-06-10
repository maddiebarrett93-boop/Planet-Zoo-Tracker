import { useState } from 'react';
import { Plus, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react';

export default function ZooManager({ zoos, activeZooId, setActiveZooId, addZoo, renameZoo, deleteZoo }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  const active = zoos.find(z => z.id === activeZooId);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#0a1208', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', color: '#c8d8a8' }}>
        <span style={{ fontSize: 16 }}>🏛️</span>
        <span style={{ fontSize: 13, fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {active?.name || 'Select Zoo'}
        </span>
        <ChevronDown size={13} style={{ color: '#5a7050', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 300, background: '#111a0f', border: '1px solid #2e4028', borderRadius: 10, minWidth: 220, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #1e2a18', fontSize: 11, color: '#5a7050', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Zoos</div>
          {zoos.map(zoo => (
            <div key={zoo.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: zoo.id === activeZooId ? '#0a1e10' : 'transparent' }}>
              {editingId === zoo.id ? (
                <>
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') { renameZoo(zoo.id, editName); setEditingId(null); } }}
                    style={{ flex: 1, background: '#0d1410', border: '1px solid #2e4028', borderRadius: 4, padding: '3px 6px', color: '#c8d8a8', fontSize: 13, outline: 'none' }} />
                  <button onClick={() => { renameZoo(zoo.id, editName); setEditingId(null); }} style={{ background: 'none', border: 'none', color: '#6ab87a', cursor: 'pointer', padding: 2 }}><Check size={13} /></button>
                  <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: '#5a7050', cursor: 'pointer', padding: 2 }}><X size={13} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => { setActiveZooId(zoo.id); setOpen(false); }}
                    style={{ flex: 1, background: 'none', border: 'none', color: zoo.id === activeZooId ? '#e0ecc0' : '#c8d8a8', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: zoo.id === activeZooId ? 600 : 400, padding: 0 }}>
                    {zoo.id === activeZooId && <span style={{ color: 'var(--accent)', marginRight: 5 }}>▶</span>}
                    {zoo.name}
                  </button>
                  <button onClick={() => { setEditName(zoo.name); setEditingId(zoo.id); }} style={{ background: 'none', border: 'none', color: '#3a5030', cursor: 'pointer', padding: 2 }}><Pencil size={12} /></button>
                  {zoos.length > 1 && <button onClick={() => { if (confirm(`Delete "${zoo.name}"?`)) deleteZoo(zoo.id); }} style={{ background: 'none', border: 'none', color: '#5a2828', cursor: 'pointer', padding: 2 }}><Trash2 size={12} /></button>}
                </>
              )}
            </div>
          ))}
          <div style={{ borderTop: '1px solid #1e2a18', padding: '6px 10px' }}>
            {showNew ? (
              <div style={{ display: 'flex', gap: 5 }}>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Zoo name…" autoFocus
                  onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) { addZoo(newName.trim()); setNewName(''); setShowNew(false); setOpen(false); } }}
                  style={{ flex: 1, background: '#0d1410', border: '1px solid #2e4028', borderRadius: 4, padding: '4px 7px', color: '#c8d8a8', fontSize: 13, outline: 'none' }} />
                <button onClick={() => { if (newName.trim()) { addZoo(newName.trim()); setNewName(''); setShowNew(false); setOpen(false); } }}
                  style={{ background: 'var(--accent)', border: 'none', borderRadius: 4, padding: '4px 8px', color: '#fff', cursor: 'pointer', fontSize: 12 }}>Add</button>
              </div>
            ) : (
              <button onClick={() => setShowNew(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#5a7050', cursor: 'pointer', fontSize: 13, padding: 0 }}>
                <Plus size={13} /> New Zoo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
