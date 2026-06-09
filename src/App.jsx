import { useState, useMemo } from 'react';
import Dashboard from './components/Dashboard.jsx';
import AnimalInventory from './components/AnimalInventory.jsx';
import Roster from './components/Roster.jsx';
import ConservationProjects from './components/ConservationProjects.jsx';
import HabitatPlanner from './components/HabitatPlanner.jsx';
import BloodlineTracker from './components/BloodlineTracker.jsx';
import Peeps from './components/Peeps.jsx';
import Zoopedia from './components/Zoopedia.jsx';
import {
  SAMPLE_ANIMALS, SAMPLE_ROSTER, SAMPLE_CONSERVATION,
  SAMPLE_HABITATS, SAMPLE_BLOODLINES, SAMPLE_PEEPS,
  PZ1_ANIMALS, PZ2_ANIMALS
} from './data/constants.js';

// ─── Theme system ───────────────────────────────────────────────────────────
export const THEMES = {
  PZ1: {
    accent:      '#0f9a6d',
    accentDim:   '#0a6b4c',
    accentLight: '#1bc98a',
    accentBg:    '#041a12',
    accentBorder:'#0d5c3a',
    tabActive:   '#071a12',
    name: 'Planet Zoo 1',
  },
  PZ2: {
    accent:      '#616f43',
    accentDim:   '#434e2e',
    accentLight: '#8a9c5e',
    accentBg:    '#0f1209',
    accentBorder:'#3a4428',
    tabActive:   '#111a0f',
    name: 'Planet Zoo 2',
  },
};

const TABS = [
  { id: 'dashboard',    label: '🏠', full: 'Dashboard' },
  { id: 'inventory',    label: '🦁', full: 'Inventory' },
  { id: 'roster',       label: '🐾', full: 'Roster' },
  { id: 'conservation', label: '🌿', full: 'Conservation' },
  { id: 'habitats',     label: '🏕️', full: 'Habitats' },
  { id: 'bloodlines',   label: '🌳', full: 'Bloodlines' },
  { id: 'peeps',        label: '🎪', full: 'Peeps' },
  { id: 'zoopedia',     label: '📖', full: 'Zoopedia' },
];

export default function App() {
  const [tab, setTab]       = useState('dashboard');
  const [pzVersion, setPzVersion] = useState('PZ1');
  const [animals, setAnimals]     = useState(SAMPLE_ANIMALS);
  const [roster, setRoster]       = useState(SAMPLE_ROSTER);
  const [conservation, setConservation] = useState(SAMPLE_CONSERVATION);
  const [habitats, setHabitats]   = useState(SAMPLE_HABITATS);
  const [bloodlines, setBloodlines] = useState(SAMPLE_BLOODLINES);
  const [peeps, setPeeps]         = useState(SAMPLE_PEEPS);
  const [zoopedia, setZoopedia]   = useState({});
  const [zooConfig, setZooConfig] = useState({ zooName: '', customStats: '' });

  const theme = THEMES[pzVersion];
  const animalDb = pzVersion === 'PZ2' ? PZ2_ANIMALS : PZ1_ANIMALS;
  const speciesList = useMemo(() => animalDb.map(a => a.name).sort(), [animalDb]);

  const toggleVersion = () => setPzVersion(v => v === 'PZ1' ? 'PZ2' : 'PZ1');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d09', color: '#c8d8a8', fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif" }}>
      {/* CSS variable injection for theme */}
      <style>{`
        :root {
          --accent: ${theme.accent};
          --accent-dim: ${theme.accentDim};
          --accent-light: ${theme.accentLight};
          --accent-bg: ${theme.accentBg};
          --accent-border: ${theme.accentBorder};
        }
        input:focus, select:focus, textarea:focus {
          outline: 2px solid ${theme.accent} !important;
          outline-offset: 1px;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0d09; }
        ::-webkit-scrollbar-thumb { background: ${theme.accentBorder}; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{ background: '#060908', borderBottom: `1px solid ${theme.accentBorder}`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.6rem 0', flexWrap: 'wrap' }}>

            {/* Logo + name */}
            <div style={{ width: 32, height: 32, background: theme.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🦒</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#e0ecc0', letterSpacing: '-0.01em' }}>
              {zooConfig.zooName || 'Planet Zoo Tracker'}
            </span>

            <div style={{ flex: 1 }} />

            {/* Version toggle */}
            <div onClick={toggleVersion} style={{ display: 'flex', alignItems: 'center', gap: 8, background: theme.accentBg, border: `1px solid ${theme.accentBorder}`, borderRadius: 20, padding: '4px 14px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accentLight }} />
              <span style={{ color: theme.accentLight, fontSize: 12, fontWeight: 700 }}>▶ {theme.name}</span>
              <span style={{ color: theme.accentDim, fontSize: 11 }}>switch</span>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 1, overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? theme.tabActive : 'transparent',
                border: 'none',
                borderBottom: tab === t.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: tab === t.id ? '#d8ecc0' : '#4a6040',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                whiteSpace: 'nowrap', borderRadius: '5px 5px 0 0',
                transition: 'color 0.15s',
              }}>
                <span style={{ marginRight: 5 }}>{t.label}</span>
                <span>{t.full}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.25rem 1rem' }}>
        {tab === 'dashboard'    && <Dashboard animals={animals} roster={roster} habitats={habitats} pzVersion={pzVersion} theme={theme} zooConfig={zooConfig} setZooConfig={setZooConfig} />}
        {tab === 'inventory'    && <AnimalInventory animals={animals} setAnimals={setAnimals} speciesList={speciesList} theme={theme} />}
        {tab === 'roster'       && <Roster roster={roster} setRoster={setRoster} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} />}
        {tab === 'conservation' && <ConservationProjects conservation={conservation} setConservation={setConservation} animals={animals} speciesList={speciesList} theme={theme} />}
        {tab === 'habitats'     && <HabitatPlanner habitats={habitats} setHabitats={setHabitats} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} />}
        {tab === 'bloodlines'   && <BloodlineTracker bloodlines={bloodlines} setBloodlines={setBloodlines} roster={roster} speciesList={speciesList} theme={theme} />}
        {tab === 'peeps'        && <Peeps peeps={peeps} setPeeps={setPeeps} theme={theme} />}
        {tab === 'zoopedia'     && <Zoopedia theme={theme} />}
      </div>
    </div>
  );
}
