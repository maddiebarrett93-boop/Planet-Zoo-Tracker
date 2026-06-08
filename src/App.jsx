import { useState } from 'react';
import AnimalInventory from './components/AnimalInventory.jsx';
import BreedingManagement from './components/BreedingManagement.jsx';
import ConservationProjects from './components/ConservationProjects.jsx';
import HabitatPlanner from './components/HabitatPlanner.jsx';
import BloodlineTracker from './components/BloodlineTracker.jsx';
import { SAMPLE_ANIMALS, SAMPLE_BREEDING, SAMPLE_CONSERVATION, SAMPLE_HABITATS, SAMPLE_BLOODLINES } from './data/constants.js';

const TABS = [
  { id: 'animals', label: '🦁 Inventory' },
  { id: 'breeding', label: '🐣 Breeding' },
  { id: 'conservation', label: '🌿 Conservation' },
  { id: 'habitats', label: '🏕️ Habitats' },
  { id: 'bloodlines', label: '🌳 Bloodlines' },
];

export default function App() {
  const [tab, setTab] = useState('animals');
  const [animals, setAnimals] = useState(SAMPLE_ANIMALS);
  const [breeding, setBreeding] = useState(SAMPLE_BREEDING);
  const [conservation, setConservation] = useState(SAMPLE_CONSERVATION);
  const [habitats, setHabitats] = useState(SAMPLE_HABITATS);
  const [bloodlines, setBloodlines] = useState(SAMPLE_BLOODLINES);

  return (
    <div style={{ minHeight: '100vh', background: '#0d1410', color: '#c8d8a8', fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif" }}>
      <div style={{ background: '#0a110d', borderBottom: '1px solid #1e2e18', padding: '0 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1rem 0 0' }}>
            <div style={{ width: 40, height: 40, background: '#58673f', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🦒</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20, color: '#e0ecc0', letterSpacing: '-0.01em' }}>Planet Zoo Tracker</div>
              <div style={{ fontSize: 12, color: '#5a7050' }}>Zoo management & breeding records</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2, marginTop: '0.75rem', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: tab === t.id ? '#1a2818' : 'transparent', border: 'none', borderBottom: tab === t.id ? '2px solid #58673f' : '2px solid transparent', color: tab === t.id ? '#c8d8a8' : '#5a7050', padding: '8px 18px', cursor: 'pointer', fontSize: 14, fontWeight: tab === t.id ? 600 : 400, whiteSpace: 'nowrap', borderRadius: '6px 6px 0 0' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem' }}>
        {tab === 'animals' && <AnimalInventory animals={animals} setAnimals={setAnimals} />}
        {tab === 'breeding' && <BreedingManagement breeding={breeding} setBreeding={setBreeding} />}
        {tab === 'conservation' && <ConservationProjects conservation={conservation} setConservation={setConservation} animals={animals} />}
        {tab === 'habitats' && <HabitatPlanner habitats={habitats} setHabitats={setHabitats} />}
        {tab === 'bloodlines' && <BloodlineTracker bloodlines={bloodlines} setBloodlines={setBloodlines} breeding={breeding} />}
      </div>
    </div>
  );
}
