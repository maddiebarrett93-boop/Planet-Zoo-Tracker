import { useState } from 'react';
import { KpiCard, Input, Field, Btn } from './UI.jsx';


export default function Dashboard({ animals, roster, habitats, pzVersion, zooConfig, setZooConfig }) {
  const [editingStats, setEditingStats] = useState(false);
  const [statsInput, setStatsInput] = useState(zooConfig.customStats || '');

  const totalAnimals = animals.reduce((s, a) => s + (+a.males || 0) + (+a.females || 0), 0);
  const speciesCount = animals.length;
  const critEndangered = animals.filter(a => a.conservationStatus === 'Critically Endangered').length;
  const endangered = animals.filter(a => a.conservationStatus === 'Endangered').length;

  const habitatCount = habitats.filter(h => h.habitatType === 'Habitats').length;
  const exhibitCount = habitats.filter(h => h.habitatType === 'Exhibits').length;
  const aviaryCount  = habitats.filter(h => h.habitatType === 'Aviaries').length;
  const aquariumCount= habitats.filter(h => h.habitatType === 'Aquariums').length;

  const saveStats = () => {
    setZooConfig(c => ({ ...c, customStats: statsInput }));
    setEditingStats(false);
  };

  const ACCENT_GREEN  = '#6ab87a';
  const ACCENT_ORANGE = '#c87030';
  const ACCENT_RED    = '#c84040';
  const ACCENT_BLUE   = '#4090c0';

  return (
    <div>
      {/* Zoo header */}
      <div style={{ background: '#0d1a0a', border: '1px solid #2e4028', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Zoo Name</label>
          <input
            value={zooConfig.zooName || ''}
            onChange={e => setZooConfig(c => ({ ...c, zooName: e.target.value }))}
            placeholder="My Zoo"
            style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #2e4028', color: '#e0ecc0', fontSize: 22, fontWeight: 700, width: '100%', outline: 'none', padding: '2px 0' }}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Custom Stats (cash, rating…)</label>
          {editingStats ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={statsInput} onChange={e => setStatsInput(e.target.value)} placeholder="e.g. £2.4M | ★ 4.8" style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '5px 8px', color: '#c8d8a8', fontSize: 14, flex: 1, outline: 'none' }} />
              <Btn size="sm" onClick={saveStats}>Save</Btn>
            </div>
          ) : (
            <div onClick={() => { setStatsInput(zooConfig.customStats || ''); setEditingStats(true); }} style={{ color: zooConfig.customStats ? '#c8d8a8' : '#3a5030', fontSize: 14, cursor: 'pointer', borderBottom: '1px dashed #2e4028', padding: '2px 0', minWidth: 80 }}>
              {zooConfig.customStats || 'Click to add…'}
            </div>
          )}
        </div>
      </div>

      {/* Main KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
        <KpiCard label="Species" value={speciesCount} sub="in inventory" />
        <KpiCard label="Total Animals" value={totalAnimals} />
        <KpiCard label="Critically Endangered" value={critEndangered} accent={critEndangered > 0 ? ACCENT_RED : undefined} sub="species" />
        <KpiCard label="Endangered" value={endangered} accent={endangered > 0 ? ACCENT_ORANGE : undefined} sub="species" />
      </div>

      {/* Infrastructure */}
      <div style={{ marginBottom: '0.5rem', fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Infrastructure</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        <KpiCard label="Habitats" value={habitatCount} />
        <KpiCard label="Exhibits" value={exhibitCount} />
        {pzVersion === 'PZ2' && <KpiCard label="Aviaries" value={aviaryCount} accent={ACCENT_BLUE} sub="PZ2" />}
        {pzVersion === 'PZ2' && <KpiCard label="Aquariums" value={aquariumCount} accent={ACCENT_BLUE} sub="PZ2" />}
      </div>

      {/* Species breakdown */}
      {animals.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Species at a Glance</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {animals.map(a => {
              const total = (+a.males || 0) + (+a.females || 0);
              const statusColors = {
                'Critically Endangered': '#c84040',
                'Endangered': '#c87030',
                'Vulnerable': '#c8a030',
              };
              const sc = statusColors[a.conservationStatus];
              return (
                <div key={a.id} style={{ background: '#0d1410', border: `1px solid ${sc || '#1e2a18'}`, borderRadius: 8, padding: '0.65rem 0.9rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#c8d8a8', fontWeight: 600, fontSize: 13 }}>{a.species}</div>
                    <div style={{ color: '#5a7050', fontSize: 11 }}>{a.habitat || 'No habitat'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: sc || '#7a9460', fontSize: 18, fontWeight: 800 }}>{total}</div>
                    <div style={{ color: '#3a5030', fontSize: 10 }}>♂{a.males} ♀{a.females}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
