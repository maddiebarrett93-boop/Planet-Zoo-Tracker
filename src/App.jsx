import { useState, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard.jsx';
import AnimalInventory from './components/AnimalInventory.jsx';
import Roster from './components/Roster.jsx';
import ConservationProjects from './components/ConservationProjects.jsx';
import HabitatPlanner from './components/HabitatPlanner.jsx';
import BloodlineTracker from './components/BloodlineTracker.jsx';
import Peeps from './components/Peeps.jsx';
import Zoopedia from './components/Zoopedia.jsx';
import ZooManager from './components/ZooManager.jsx';
import HabitatBuilder from './components/HabitatBuilder.jsx';
import { DEFAULT_ZOO, PZ1_ANIMALS, PZ2_ANIMALS } from './data/constants.js';

export const THEMES = {
  PZ1: { accent:'#0f9a6d', accentDim:'#0a6b4c', accentLight:'#1bc98a', accentBg:'#041a12', accentBorder:'#0d5c3a', tabActive:'#071a12', name:'Planet Zoo 1' },
  PZ2: { accent:'#616f43', accentDim:'#434e2e', accentLight:'#8a9c5e', accentBg:'#0f1209', accentBorder:'#3a4428', tabActive:'#111a0f', name:'Planet Zoo 2' },
};

const TABS = [
  { id:'dashboard',    label:'🏠', full:'Dashboard'    },
  { id:'inventory',    label:'🦁', full:'Inventory'    },
  { id:'roster',       label:'🐾', full:'Roster'       },
  { id:'conservation', label:'🌿', full:'Conservation' },
  { id:'habitats',     label:'🏕️', full:'Habitats'     },
  { id:'bloodlines',   label:'🌳', full:'Bloodlines'   },
  { id:'peeps',        label:'🎪', full:'Peeps'        },
];

const SEED = DEFAULT_ZOO(); SEED.name = 'My First Zoo';
SEED.animals = [
  { id:1, species:'African Savannah Elephant', habitat:'Savanna Flats', males:1, females:3, conservationStatus:'Endangered', notes:'' },
  { id:2, species:'Amur Leopard', habitat:'Taiga Enclosure', males:1, females:1, conservationStatus:'Critically Endangered', notes:'' },
];

export default function App() {
  const [zoos, setZoos]               = useState([SEED]);
  const [activeZooId, setActiveZooId] = useState(SEED.id);
  const [tab, setTab]                 = useState('dashboard');
  const [pzVersion, setPzVersion]     = useState('PZ1');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderSpecies, setBuilderSpecies] = useState('');
  const [zoopediaOpen, setZoopediaOpen] = useState(false);

  const theme      = THEMES[pzVersion];
  const animalDb   = pzVersion === 'PZ2' ? PZ2_ANIMALS : PZ1_ANIMALS;
  const speciesList = useMemo(() => animalDb.map(a=>a.name).sort(), [animalDb]);

  const zoo       = zoos.find(z=>z.id===activeZooId) || zoos[0];
  const updateZoo = useCallback((patch) => {
    setZoos(prev => prev.map(z => z.id===activeZooId ? { ...z, ...(typeof patch==='function' ? patch(z) : patch) } : z));
  }, [activeZooId]);
  const setter = (key) => (val) => updateZoo(z => ({ [key]: typeof val==='function' ? val(z[key]) : val }));

  const addZoo    = (name) => { const nz=DEFAULT_ZOO(); nz.name=name; setZoos(p=>[...p,nz]); setActiveZooId(nz.id); };
  const renameZoo = (id, name) => setZoos(p=>p.map(z=>z.id===id?{...z,name}:z));
  const deleteZoo = (id) => { setZoos(p=>{ const n=p.filter(z=>z.id!==id); if(activeZooId===id) setActiveZooId(n[0]?.id); return n; }); };

  const handleBuilderCommit = ({ habitat, rosterEntries, hasConservationGoal, species }) => {
    updateZoo(z => {
      const newHabitats    = [...(z.habitats||[]), habitat];
      const newRoster      = [...(z.roster||[]), ...rosterEntries];
      let   newConservation = z.conservation || [];
      if (hasConservationGoal && !newConservation.find(c=>c.species===species))
        newConservation = [...newConservation, { id:Date.now(), species, goalPop:rosterEntries.length, currentPop:rosterEntries.length, releaseGoal:0, released:0 }];
      return { habitats:newHabitats, roster:newRoster, conservation:newConservation };
    });
  };

  const openBuilder = (sp='') => { setBuilderSpecies(sp); setBuilderOpen(true); };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0d09', color:'#c8d8a8', fontFamily:"'Trebuchet MS', 'Gill Sans', sans-serif" }}>
      <style>{`
        :root { --accent:${theme.accent}; --accent-dim:${theme.accentDim}; --accent-light:${theme.accentLight}; --accent-bg:${theme.accentBg}; --accent-border:${theme.accentBorder}; }
        input:focus,select:focus,textarea:focus { outline:2px solid ${theme.accent} !important; outline-offset:1px; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#0a0d09; }
        ::-webkit-scrollbar-thumb { background:${theme.accentBorder}; border-radius:3px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:'#060908', borderBottom:`1px solid ${theme.accentBorder}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', flexWrap:'wrap' }}>
            <div style={{ width:30, height:30, background:theme.accent, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🦒</div>
            <ZooManager zoos={zoos} activeZooId={activeZooId} setActiveZooId={setActiveZooId} addZoo={addZoo} renameZoo={renameZoo} deleteZoo={deleteZoo} />
            <div style={{ flex:1 }} />
            {/* Habitat Builder */}
            <button onClick={() => openBuilder()} style={{ display:'flex', alignItems:'center', gap:5, background:theme.accentBg, border:`1px solid ${theme.accentBorder}`, borderRadius:8, padding:'5px 11px', color:theme.accentLight, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              🏗️ Builder
            </button>
            {/* Zoopedia — persistent on every screen */}
            <button onClick={() => setZoopediaOpen(true)} style={{ display:'flex', alignItems:'center', gap:5, background:'#1a1028', border:'1px solid #3a2848', borderRadius:8, padding:'5px 11px', color:'#9a70c8', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              📖 Zoopedia
            </button>
            {/* PZ version */}
            <div onClick={() => setPzVersion(v=>v==='PZ1'?'PZ2':'PZ1')}
              style={{ display:'flex', alignItems:'center', gap:6, background:theme.accentBg, border:`1px solid ${theme.accentBorder}`, borderRadius:20, padding:'4px 12px', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:theme.accentLight }} />
              <span style={{ color:theme.accentLight, fontSize:12, fontWeight:700 }}>▶ {theme.name}</span>
            </div>
          </div>

          {/* Tab bar — operational tabs only, no Zoopedia */}
          <div style={{ display:'flex', gap:1, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab===t.id ? theme.tabActive : 'transparent',
                border:'none', borderBottom: tab===t.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                color: tab===t.id ? '#d8ecc0' : '#4a6040',
                padding:'7px 13px', cursor:'pointer', fontSize:13, fontWeight:tab===t.id?600:400,
                whiteSpace:'nowrap', borderRadius:'5px 5px 0 0', transition:'color 0.15s',
              }}>
                {t.label} {t.full}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'1.25rem 1rem' }}>
        {tab==='dashboard'    && <Dashboard animals={zoo.animals||[]} roster={zoo.roster||[]} habitats={zoo.habitats||[]} pzVersion={pzVersion} theme={theme} zooConfig={{ zooName:zoo.name, customStats:zoo.customStats }} setZooConfig={cfg=>updateZoo({ name:cfg.zooName, customStats:cfg.customStats })} onOpenBuilder={openBuilder} />}
        {tab==='inventory'    && <AnimalInventory animals={zoo.animals||[]} setAnimals={setter('animals')} speciesList={speciesList} theme={theme} />}
        {tab==='roster'       && <Roster roster={zoo.roster||[]} setRoster={setter('roster')} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} />}
        {tab==='conservation' && <ConservationProjects conservation={zoo.conservation||[]} setConservation={setter('conservation')} animals={zoo.animals||[]} speciesList={speciesList} theme={theme} />}
        {tab==='habitats'     && <HabitatPlanner habitats={zoo.habitats||[]} setHabitats={setter('habitats')} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} onOpenBuilder={openBuilder} />}
        {tab==='bloodlines'   && <BloodlineTracker bloodlines={zoo.bloodlines||[]} setBloodlines={setter('bloodlines')} roster={zoo.roster||[]} speciesList={speciesList} theme={theme} />}
        {tab==='peeps'        && <Peeps peeps={zoo.peeps||{zones:[],facilities:[],vendors:[],restaurants:[]}} setPeeps={setter('peeps')} theme={theme} habitats={zoo.habitats||[]} />}
      </div>

      {/* ── Zoopedia overlay (full-screen modal) ── */}
      {zoopediaOpen && (
        <Zoopedia theme={theme} onOpenBuilder={(sp) => { setZoopediaOpen(false); openBuilder(sp); }} isModal onClose={() => setZoopediaOpen(false)} />
      )}

      {/* ── Habitat Builder modal ── */}
      {builderOpen && (
        <HabitatBuilder onClose={() => setBuilderOpen(false)} initialSpecies={builderSpecies} onCommit={handleBuilderCommit} theme={theme} />
      )}
    </div>
  );
}
