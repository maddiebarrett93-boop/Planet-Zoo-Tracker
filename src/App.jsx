import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import HabitatQuiz from './components/HabitatQuiz.jsx';
import { DEFAULT_ZOO, PZ1_ANIMALS, PZ2_ANIMALS } from './data/constants.js';
import { readTab, writeTab, readCache, readCacheAny, readZoos, writeZoos, debouncedWrite } from './lib/sheetsSync.js';

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
  { id:'quiz',          label:'🎯', full:'Finder'       },
];

// Tab → Sheet tab name mapping
const TAB_SHEET = {
  inventory:    'Animals',
  roster:       'Roster',
  conservation: 'Conservation',
  habitats:     'Habitats',
  bloodlines:   'Bloodlines',
  peeps:        'Peeps',
};

// Always try Sheets sync — the API itself will return an error if not configured,
// and we gracefully fall back to local state. No build-time flag needed.
const SHEETS_ENABLED = true;

const SEED = DEFAULT_ZOO(); SEED.name = 'My First Zoo';
// No sample animals — start empty so Sheets data loads cleanly

export default function App() {
  const [zoos, setZoos]               = useState([SEED]);
  const [activeZooId, setActiveZooId] = useState(SEED.id);
  const [tab, setTab]                 = useState('dashboard');
  const [pzVersion, setPzVersion]     = useState('PZ1');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderSpecies, setBuilderSpecies] = useState('');
  const [zoopediaOpen, setZoopediaOpen]     = useState(false);
  const [syncStatus, setSyncStatus]   = useState('idle'); // 'idle'|'loading'|'saving'|'error'|'ok'
  const [syncMsg, setSyncMsg]         = useState('');
  const isInitialized                 = useRef(false);

  const theme      = THEMES[pzVersion];
  const animalDb   = pzVersion === 'PZ2' ? PZ2_ANIMALS : PZ1_ANIMALS;
  const speciesList = useMemo(() => animalDb.map(a=>a.name).sort(), [animalDb]);

  const zoo       = zoos.find(z=>z.id===activeZooId) || zoos[0];
  const updateZoo = useCallback((patch) => {
    setZoos(prev => prev.map(z => z.id===activeZooId ? { ...z, ...(typeof patch==='function' ? patch(z) : patch) } : z));
  }, [activeZooId]);

  // ── Sheets sync helpers ─────────────────────────────────────────────────
  const showSync = (status, msg='') => { setSyncStatus(status); setSyncMsg(msg); };

  // Load a tab's data from Sheets (or cache) when switching tabs
  const loadTab = useCallback(async (tabId) => {
    if (!SHEETS_ENABLED) return;
    const sheetTab = TAB_SHEET[tabId];
    if (!sheetTab || !activeZooId) return;

    // Show cached data immediately (stale-ok for instant display)
    const cached = readCacheAny(sheetTab, activeZooId);
    if (cached) {
      applySheetData(sheetTab, cached);
    }

    // Then fetch fresh
    try {
      showSync('loading');
      const rows = await readTab(sheetTab, activeZooId);
      applySheetData(sheetTab, rows);
      showSync('ok', `${sheetTab} synced`);
      setTimeout(() => showSync('idle'), 2000);
    } catch (e) {
      showSync('error', 'Sync failed — working offline');
    }
  }, [activeZooId]);

  function applySheetData(sheetTab, rows) {
    const parsed = rows.map(r => {
      const out = { ...r };
      ['regions','biomes','companions'].forEach(k => {
        if (typeof out[k] === 'string' && (out[k].startsWith('[') || out[k].startsWith('{'))) {
          try { out[k] = JSON.parse(out[k]); } catch {}
        }
      });
      ['isAlpha','isBonded','isOutsider'].forEach(k => {
        if (out[k] === 'true') out[k] = true;
        if (out[k] === 'false') out[k] = false;
      });
      ['males','females','id','fertility','immunity','size','longevity','appeal',
       'goalPop','currentPop','releaseGoal','released','generation','actualLandSpace',
       'actualWaterSpace','baseSpace','perAdditionalSpace','adultCount','guestRating'].forEach(k => {
        if (out[k] !== '' && out[k] !== null && out[k] !== undefined && !isNaN(out[k])) out[k] = +out[k];
      });
      // Remove zoo_id from data objects
      delete out.zoo_id;
      return out;
    });

    const map = { Animals:'animals', Roster:'roster', Conservation:'conservation', Habitats:'habitats', Bloodlines:'bloodlines' };
    if (map[sheetTab]) {
      setZoos(prev => prev.map(z =>
        z.id === activeZooId ? { ...z, [map[sheetTab]]: parsed } : z
      ));
    }
    if (sheetTab === 'Peeps' && parsed[0]?.data) {
      try {
        const peepsData = JSON.parse(parsed[0].data);
        setZoos(prev => prev.map(z =>
          z.id === activeZooId ? { ...z, peeps: peepsData } : z
        ));
      } catch {}
    }
  }

  // Save a tab's data to Sheets (debounced)
  const saveTab = useCallback((sheetTab, rows) => {
    if (!SHEETS_ENABLED) return;
    showSync('saving');
    debouncedWrite(sheetTab, activeZooId, rows, 1500);
    setTimeout(() => showSync('idle'), 1800);
  }, [activeZooId]);

  // Load on tab switch
  useEffect(() => { loadTab(tab); }, [tab, activeZooId]);

  // Initial load — fetch zoo list then all tabs for the active zoo
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    (async () => {
      try {
        showSync('loading', 'Loading…');

        // Load zoo list
        const zooRows = await readZoos();
        let activeId = activeZooId;
        if (zooRows.length > 0) {
          const loaded = zooRows.map(r => ({ ...DEFAULT_ZOO(), ...r, id: r.id || r.zoo_id }));
          setZoos(loaded);
          activeId = loaded[0].id;
          setActiveZooId(activeId);
        }

        // Load all tabs for the active zoo in parallel
        const tabsToLoad = Object.entries(TAB_SHEET);
        const results = await Promise.allSettled(
          tabsToLoad.map(([, sheetTab]) => readTab(sheetTab, activeId))
        );
        results.forEach((result, i) => {
          if (result.status === 'fulfilled') {
            applySheetData(tabsToLoad[i][1], result.value);
          }
        });

        showSync('ok', 'Connected');
        setTimeout(() => showSync('idle'), 2500);
      } catch (e) {
        console.error('Initial load failed:', e);
        showSync('error', 'Offline — changes save locally');
        setTimeout(() => showSync('idle'), 4000);
      }
    })();
  }, []);

  // ── Setters that auto-save ──────────────────────────────────────────────
  const makeSetter = (key, sheetTab) => (val) => {
    updateZoo(z => ({ [key]: typeof val === 'function' ? val(z[key]) : val }));
    const rows = typeof val === 'function' ? val(zoo[key]||[]) : val;
    if (sheetTab === 'Peeps') {
      saveTab('Peeps', [{ data: JSON.stringify(rows) }]);
    } else {
      saveTab(sheetTab, Array.isArray(rows) ? rows : []);
    }
  };

  const addZoo    = (name) => {
    const nz = DEFAULT_ZOO(); nz.name = name;
    setZoos(p => { const next = [...p, nz]; if (SHEETS_ENABLED) writeZoos(next.map(z=>({id:z.id,name:z.name,customStats:z.customStats,createdAt:z.createdAt}))).catch(()=>{}); return next; });
    setActiveZooId(nz.id);
  };
  const renameZoo = (id, name) => {
    setZoos(p => { const next = p.map(z=>z.id===id?{...z,name}:z); if (SHEETS_ENABLED) writeZoos(next.map(z=>({id:z.id,name:z.name,customStats:z.customStats,createdAt:z.createdAt}))).catch(()=>{}); return next; });
  };
  const deleteZoo = (id) => {
    setZoos(p => { const next = p.filter(z=>z.id!==id); if (activeZooId===id) setActiveZooId(next[0]?.id); if (SHEETS_ENABLED) writeZoos(next.map(z=>({id:z.id,name:z.name,customStats:z.customStats,createdAt:z.createdAt}))).catch(()=>{}); return next; });
  };

  const handleBuilderCommit = ({ habitat, rosterEntries, hasConservationGoal, species }) => {
    updateZoo(z => {
      const newHabitats    = [...(z.habitats||[]), habitat];
      const newRoster      = [...(z.roster||[]), ...rosterEntries];
      let   newConservation = z.conservation||[];
      if (hasConservationGoal && !newConservation.find(c=>c.species===species))
        newConservation = [...newConservation, { id:Date.now(), species, goalPop:rosterEntries.length, currentPop:rosterEntries.length, releaseGoal:0, released:0 }];
      if (SHEETS_ENABLED) {
        saveTab('Habitats', newHabitats);
        saveTab('Roster', newRoster);
        if (hasConservationGoal) saveTab('Conservation', newConservation);
      }
      return { habitats:newHabitats, roster:newRoster, conservation:newConservation };
    });
  };

  const openBuilder = (sp='') => { setBuilderSpecies(sp); setBuilderOpen(true); };

  // Sync status indicator
  const syncColors = { idle:'transparent', loading:'#c8a030', saving:'#4a8aab', ok:'#6ab87a', error:'#c84040' };
  const syncLabels = { idle:'', loading:'⟳ Syncing…', saving:'⟳ Saving…', ok:'✓ Synced', error:'⚠ Offline' };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0d09', color:'#c8d8a8', fontFamily:"'Trebuchet MS','Gill Sans',sans-serif" }}>
      <style>{`
        :root{--accent:${theme.accent};--accent-dim:${theme.accentDim};--accent-light:${theme.accentLight};--accent-bg:${theme.accentBg};--accent-border:${theme.accentBorder};}
        input:focus,select:focus,textarea:focus{outline:2px solid ${theme.accent} !important;outline-offset:1px;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:#0a0d09;}
        ::-webkit-scrollbar-thumb{background:${theme.accentBorder};border-radius:3px;}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:'#060908', borderBottom:`1px solid ${theme.accentBorder}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', flexWrap:'wrap' }}>
            <div style={{ width:30, height:30, background:theme.accent, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🦒</div>
            <ZooManager zoos={zoos} activeZooId={activeZooId} setActiveZooId={setActiveZooId} addZoo={addZoo} renameZoo={renameZoo} deleteZoo={deleteZoo} />

            {/* Sync status */}
            {syncStatus !== 'idle' && (
              <div style={{ fontSize:11, color:syncColors[syncStatus], padding:'3px 8px', background:`${syncColors[syncStatus]}18`, borderRadius:20, border:`1px solid ${syncColors[syncStatus]}44`, whiteSpace:'nowrap' }}>
                {syncLabels[syncStatus]}{syncMsg ? ` · ${syncMsg}` : ''}
              </div>
            )}

            <div style={{ flex:1 }} />
            <button onClick={() => openBuilder()} style={{ display:'flex', alignItems:'center', gap:5, background:theme.accentBg, border:`1px solid ${theme.accentBorder}`, borderRadius:8, padding:'5px 11px', color:theme.accentLight, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>🏗️ Builder</button>
            <button onClick={() => setZoopediaOpen(true)} style={{ display:'flex', alignItems:'center', gap:5, background:'#1a1028', border:'1px solid #3a2848', borderRadius:8, padding:'5px 11px', color:'#9a70c8', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>📖 Zoopedia</button>
            <div onClick={() => setPzVersion(v=>v==='PZ1'?'PZ2':'PZ1')} style={{ display:'flex', alignItems:'center', gap:6, background:theme.accentBg, border:`1px solid ${theme.accentBorder}`, borderRadius:20, padding:'4px 12px', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:theme.accentLight }} />
              <span style={{ color:theme.accentLight, fontSize:12, fontWeight:700 }}>▶ {theme.name}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:1, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background:tab===t.id?theme.tabActive:'transparent', border:'none', borderBottom:tab===t.id?`2px solid ${theme.accent}`:'2px solid transparent', color:tab===t.id?'#d8ecc0':'#4a6040', padding:'7px 13px', cursor:'pointer', fontSize:13, fontWeight:tab===t.id?600:400, whiteSpace:'nowrap', borderRadius:'5px 5px 0 0', transition:'color 0.15s' }}>
                {t.label} {t.full}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'1.25rem 1rem' }}>
        {tab==='dashboard'    && <Dashboard animals={zoo.animals||[]} roster={zoo.roster||[]} habitats={zoo.habitats||[]} pzVersion={pzVersion} theme={theme} zooConfig={{ zooName:zoo.name, customStats:zoo.customStats }} setZooConfig={cfg=>updateZoo({ name:cfg.zooName, customStats:cfg.customStats })} onOpenBuilder={openBuilder} />}
        {tab==='inventory'    && <AnimalInventory animals={zoo.animals||[]} setAnimals={makeSetter('animals','Animals')} speciesList={speciesList} theme={theme} />}
        {tab==='roster'       && <Roster roster={zoo.roster||[]} setRoster={makeSetter('roster','Roster')} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} />}
        {tab==='conservation' && <ConservationProjects conservation={zoo.conservation||[]} setConservation={makeSetter('conservation','Conservation')} animals={zoo.animals||[]} speciesList={speciesList} theme={theme} />}
        {tab==='habitats'     && <HabitatPlanner habitats={zoo.habitats||[]} setHabitats={makeSetter('habitats','Habitats')} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} onOpenBuilder={openBuilder} />}
        {tab==='bloodlines'   && <BloodlineTracker
          bloodlines={zoo.bloodlines||[]}
          setBloodlines={(val) => {
            // When a bloodline record is added, auto-seed a Roster entry
            const newBloodlines = typeof val === 'function' ? val(zoo.bloodlines||[]) : val;
            const existing = zoo.bloodlines || [];
            const added = newBloodlines.filter(b => !existing.find(e => e.id === b.id));
            if (added.length > 0) {
              const newRoster = [...(zoo.roster||[])];
              added.forEach(b => {
                if (!newRoster.find(r => r.name === b.name && r.species === b.species)) {
                  newRoster.push({ id: Date.now() + Math.random(), species: b.species, name: b.name, sex: '', ageStage: 'Juvenile', fertility: '', immunity: '', size: '', longevity: '', appeal: '', mate: b.father && b.mother ? '' : '', offspring: '', disposition: 'Keep', isAlpha: false, isBonded: false, isOutsider: false, socialStructure: '' });
                }
              });
              makeSetter('roster','Roster')(newRoster);
            }
            makeSetter('bloodlines','Bloodlines')(val);
          }}
          roster={zoo.roster||[]} speciesList={speciesList} theme={theme} />}
        {tab==='peeps'        && <Peeps peeps={zoo.peeps||{zones:[],facilities:[],vendors:[],restaurants:[]}} setPeeps={makeSetter('peeps','Peeps')} theme={theme} habitats={zoo.habitats||[]} />}
        {tab==='quiz'          && <HabitatQuiz theme={theme} onOpenBuilder={openBuilder} />}
      </div>

      {zoopediaOpen && <Zoopedia theme={theme} onOpenBuilder={(sp)=>{setZoopediaOpen(false);openBuilder(sp);}} isModal onClose={()=>setZoopediaOpen(false)} />}
      {builderOpen  && <HabitatBuilder onClose={()=>setBuilderOpen(false)} initialSpecies={builderSpecies} onCommit={handleBuilderCommit} theme={theme} />}
    </div>
  );
}
