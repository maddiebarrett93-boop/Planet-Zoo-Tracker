import { useState } from 'react';
import Dashboard from './components/Dashboard.jsx';
import AnimalInventory from './components/AnimalInventory.jsx';
import Roster from './components/Roster.jsx';
import ConservationProjects from './components/ConservationProjects.jsx';
import HabitatPlanner from './components/HabitatPlanner.jsx';
import BloodlineTracker from './components/BloodlineTracker.jsx';
import Peeps from './components/Peeps.jsx';
import {
  SAMPLE_ANIMALS, SAMPLE_ROSTER, SAMPLE_CONSERVATION,
  SAMPLE_HABITATS, SAMPLE_BLOODLINES, SAMPLE_PEEPS,
  PZ1_SPECIES, PZ2_SPECIES
} from './data/constants.js';

const TABS = [
  { id: 'dashboard',     label: '🏠 Dashboard' },
  { id: 'inventory',     label: '🦁 Inventory' },
  { id: 'roster',        label: '🐾 Roster' },
  { id: 'conservation',  label: '🌿 Conservation' },
  { id: 'habitats',      label: '🏕️ Habitats' },
  { id: 'bloodlines',    label: '🌳 Bloodlines' },
  { id: 'peeps',         label: '🎪 Peeps' },
];

export default function App() {
  const [tab, setTab]             = useState('dashboard');
  const [pzVersion, setPzVersion] = useState('PZ1');
  const [animals, setAnimals]     = useState(SAMPLE_ANIMALS);
  const [roster, setRoster]       = useState(SAMPLE_ROSTER);
  const [conservation, setConservation] = useState(SAMPLE_CONSERVATION);
  const [habitats, setHabitats]   = useState(SAMPLE_HABITATS);
  const [bloodlines, setBloodlines] = useState(SAMPLE_BLOODLINES);
  const [peeps, setPeeps]         = useState(SAMPLE_PEEPS);
  const [zooConfig, setZooConfig] = useState({ zooName: '', customStats: '' });

  const speciesList = pzVersion === 'PZ2' ? PZ2_SPECIES : PZ1_SPECIES;

  return (
    <div style={{ minHeight: '100vh', background: '#0d1410', color: '#c8d8a8', fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#080e07', borderBottom: '1px solid #1e2e18', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.65rem 0', flexWrap: 'wrap' }}>
            {/* Logo */}
            <div style={{ width: 34, height: 34, background: '#58673f', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🦒</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#e0ecc0', letterSpacing: '-0.01em', marginRight: 4 }}>
              {zooConfig.zooName || 'Planet Zoo Tracker'}
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* PZ Version Toggle */}
            <div style={{ display: 'flex', border: '1px solid #2e4028', borderRadius: 20, overflow: 'hidden', flexShrink: 0 }}>
              {['PZ1', 'PZ2'].map(v => (
                <button key={v} onClick={() => setPzVersion(v)} style={{
                  background: pzVersion === v ? '#58673f' : 'transparent',
                  border: 'none', color: pzVersion === v ? '#e8f0d0' : '#5a7050',
                  padding: '5px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  transition: 'all 0.2s'
                }}>
                  {pzVersion === v ? '▶ ' : ''}{v === 'PZ1' ? 'Planet Zoo 1' : 'Planet Zoo 2'}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 1, overflowX: 'auto', paddingBottom: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? '#111a0f' : 'transparent',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid #58673f' : '2px solid transparent',
                color: tab === t.id ? '#c8d8a8' : '#4a6040',
                padding: '7px 14px', cursor: 'pointer', fontSize: 13,
                fontWeight: tab === t.id ? 600 : 400,
                whiteSpace: 'nowrap', borderRadius: '5px 5px 0 0',
                transition: 'color 0.15s'
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.25rem 1rem' }}>
        {tab === 'dashboard'    && <Dashboard animals={animals} roster={roster} habitats={habitats} pzVersion={pzVersion} zooConfig={zooConfig} setZooConfig={setZooConfig} />}
        {tab === 'inventory'    && <AnimalInventory animals={animals} setAnimals={setAnimals} speciesList={speciesList} />}
        {tab === 'roster'       && <Roster roster={roster} setRoster={setRoster} pzVersion={pzVersion} speciesList={speciesList} />}
        {tab === 'conservation' && <ConservationProjects conservation={conservation} setConservation={setConservation} animals={animals} speciesList={speciesList} />}
        {tab === 'habitats'     && <HabitatPlanner habitats={habitats} setHabitats={setHabitats} pzVersion={pzVersion} speciesList={speciesList} />}
        {tab === 'bloodlines'   && <BloodlineTracker bloodlines={bloodlines} setBloodlines={setBloodlines} roster={roster} speciesList={speciesList} />}
        {tab === 'peeps'        && <Peeps peeps={peeps} setPeeps={setPeeps} />}
      </div>
    </div>
  );
}
