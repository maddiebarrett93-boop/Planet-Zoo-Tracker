import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import LandingPage from './components/LandingPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import AnimalInventory from './components/AnimalInventory.jsx';
import Roster from './components/Roster.jsx';
import ConservationProjects from './components/ConservationProjects.jsx';
import HabitatPlanner from './components/HabitatPlanner.jsx';
import BloodlineTracker from './components/BloodlineTracker.jsx';
import Peeps from './components/Peeps.jsx';
import Zoopedia from './components/Zoopedia.jsx';
import HabitatBuilder from './components/HabitatBuilder.jsx';
import HabitatQuiz from './components/HabitatQuiz.jsx';
import TaxonomyExplorer from './components/TaxonomyExplorer.jsx';
import ZooManager from './components/ZooManager.jsx';
import { DEFAULT_ZOO, PZ1_ANIMALS, PZ2_ANIMALS } from './data/constants.js';
import { readTab, writeTab, readCache, readCacheAny, readZoos, writeZoos, debouncedWrite } from './lib/sheetsSync.js';

export const THEMES = {
  PZ1: { accent:'#0f9a6d', accentDim:'#0a6b4c', accentLight:'#1bc98a', accentBg:'#041a12', accentBorder:'#0d5c3a', tabActive:'#071a12', name:'Planet Zoo 1' },
  PZ2: { accent:'#616f43', accentDim:'#434e2e', accentLight:'#8a9c5e', accentBg:'#0f1209', accentBorder:'#3a4428', tabActive:'#111a0f', name:'Planet Zoo 2' },
};

// Operational tabs only — tools are in the palette
const TABS = [
  { id:'dashboard',    label:'🏠', full:'Dashboard'    },
  { id:'inventory',    label:'🦁', full:'Inventory'    },
  { id:'roster',       label:'🐾', full:'Roster'       },
  { id:'conservation', label:'🌿', full:'Conservation' },
  { id:'habitats',     label:'🏕️', full:'Habitats'     },
  { id:'bloodlines',   label:'🌳', full:'Bloodlines'   },
  { id:'peeps',        label:'🎪', full:'Peeps'        },
];

const TAB_SHEET = {
  inventory:'Animals', roster:'Roster', conservation:'Conservation',
  habitats:'Habitats', bloodlines:'Bloodlines', peeps:'Peeps',
};

const SEED = DEFAULT_ZOO(); SEED.name = 'My First Zoo';

export default function App() {
  // ── Landing / zoo selection ─────────────────────────────────────────
  const [zoos, setZoos]               = useState([SEED]);
  const [activeZooId, setActiveZooId] = useState(null); // null = show landing
  const [tab, setTab]                 = useState('dashboard');
  const [pzVersion, setPzVersion]     = useState('PZ1');

  // ── Tool overlays ────────────────────────────────────────────────────
  const [zoopediaOpen, setZoopediaOpen] = useState(false);
  const [builderOpen, setBuilderOpen]   = useState(false);
  const [builderSpecies, setBuilderSpecies] = useState('');
  const [quizOpen, setQuizOpen]         = useState(false);
  const [taxonomyOpen, setTaxonomyOpen]   = useState(false);
  const [paletteOpen, setPaletteOpen]   = useState(false);

  // ── Sync ─────────────────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncMsg, setSyncMsg]       = useState('');
  const isInit = useRef(false);

  const theme      = THEMES[pzVersion];
  const animalDb   = pzVersion === 'PZ2' ? PZ2_ANIMALS : PZ1_ANIMALS;
  const speciesList = useMemo(() => animalDb.map(a=>a.name).sort(), [animalDb]);

  const zoo       = zoos.find(z=>z.id===activeZooId) || zoos[0];
  const updateZoo = useCallback((patch) => {
    setZoos(prev => prev.map(z => z.id===activeZooId ? { ...z, ...(typeof patch==='function'?patch(z):patch) } : z));
  }, [activeZooId]);

  const showSync = (s, m='') => { setSyncStatus(s); setSyncMsg(m); };

  function applySheetData(sheetTab, rows, zooId) {
    const parsed = rows.map(r => {
      const out = { ...r };
      ['regions','biomes','companions'].forEach(k => {
        if (typeof out[k]==='string' && (out[k].startsWith('[')||out[k].startsWith('{'))) { try { out[k]=JSON.parse(out[k]); } catch {} }
      });
      ['isAlpha','isBonded','isOutsider'].forEach(k => {
        if (out[k]==='true') out[k]=true;
        if (out[k]==='false') out[k]=false;
      });
      ['males','females','id','fertility','immunity','size','longevity','appeal',
       'goalPop','currentPop','releaseGoal','released','generation','actualLandSpace',
       'actualWaterSpace','baseSpace','perAdditionalSpace','adultCount','guestRating'].forEach(k => {
        if (out[k]!==''&&out[k]!==null&&out[k]!==undefined&&!isNaN(out[k])) out[k]=+out[k];
      });
      delete out.zoo_id;
      return out;
    });
    const map = { Animals:'animals', Roster:'roster', Conservation:'conservation', Habitats:'habitats', Bloodlines:'bloodlines' };
    const id  = zooId || activeZooId;
    if (map[sheetTab]) setZoos(prev => prev.map(z => z.id===id ? { ...z, [map[sheetTab]]:parsed } : z));
    if (sheetTab==='Peeps' && parsed[0]?.data) {
      try { const p=JSON.parse(parsed[0].data); setZoos(prev=>prev.map(z=>z.id===id?{...z,peeps:p}:z)); } catch {}
    }
  }

  const loadTab = useCallback(async (tabId) => {
    const sheetTab = TAB_SHEET[tabId];
    if (!sheetTab || !activeZooId) return;
    const cached = readCacheAny(sheetTab, activeZooId);
    if (cached) applySheetData(sheetTab, cached);
    try {
      showSync('loading');
      const rows = await readTab(sheetTab, activeZooId);
      applySheetData(sheetTab, rows);
      showSync('ok', `${sheetTab} synced`);
      setTimeout(() => showSync('idle'), 2000);
    } catch (e) {
      showSync('error', 'Offline');
      setTimeout(() => showSync('idle'), 3000);
    }
  }, [activeZooId]);

  useEffect(() => { if (activeZooId) loadTab(tab); }, [tab, activeZooId]);

  // Full reload — fetches all tabs for the current activeZooId
  const fullReload = async (targetId) => {
    const id = targetId || activeZooId;
    if (!id) return;
    showSync('loading', 'Loading…');
    try {
      // Load zoo list
      const zooRows = await readZoos();
      if (zooRows.length > 0) {
        const loaded = zooRows.map(r => ({ ...DEFAULT_ZOO(), ...r, id: r.id || r.zoo_id }));
        setZoos(loaded);
        // Use the first zoo that matches, or first zoo overall
        const match = loaded.find(z => z.id === id) || loaded[0];
        if (match.id !== id) setActiveZooId(match.id);
      }
      // Load all tabs in parallel
      const tabs = Object.entries(TAB_SHEET);
      const results = await Promise.allSettled(tabs.map(([, st]) => readTab(st, id)));
      let loadedCount = 0;
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') { applySheetData(tabs[i][1], r.value, id); loadedCount++; }
        else console.warn('[sync] Failed tab:', tabs[i][1], r.reason?.message);
      });
      showSync('ok', `Loaded ${loadedCount}/${tabs.length} tabs`);
      setTimeout(() => showSync('idle'), 2500);
    } catch (e) {
      console.error('[sync] Full reload failed:', e);
      showSync('error', 'Sync failed — check /api/debug');
      setTimeout(() => showSync('idle'), 4000);
    }
  };

  useEffect(() => {
    if (!activeZooId) return;
    if (isInit.current === activeZooId) return; // already loaded for this zoo
    isInit.current = activeZooId;
    fullReload(activeZooId);
  }, [activeZooId]);

  const makeSetter = (key, sheetTab) => (val) => {
    updateZoo(z => ({ [key]: typeof val==='function'?val(z[key]):val }));
    const rows = typeof val==='function' ? val(zoo[key]||[]) : val;
    if (sheetTab==='Peeps') debouncedWrite('Peeps', activeZooId, [{ data:JSON.stringify(rows) }]);
    else if (Array.isArray(rows)) debouncedWrite(sheetTab, activeZooId, rows);
  };

  const addZoo = (name) => {
    const nz = DEFAULT_ZOO(); nz.name = name;
    setZoos(p => { const n=[...p,nz]; writeZoos(n.map(z=>({id:z.id,name:z.name,customStats:z.customStats,createdAt:z.createdAt}))).catch(()=>{}); return n; });
    setActiveZooId(nz.id);
  };
  const renameZoo = (id, name) => setZoos(p => p.map(z=>z.id===id?{...z,name}:z));
  const deleteZoo = (id) => {
    setZoos(p => { const n=p.filter(z=>z.id!==id); if(activeZooId===id) setActiveZooId(null); writeZoos(n.map(z=>({id:z.id,name:z.name,customStats:z.customStats,createdAt:z.createdAt}))).catch(()=>{}); return n; });
  };

  const handleBuilderCommit = ({ habitat, rosterEntries, hasConservationGoal, species }) => {
    updateZoo(z => {
      const newH = [...(z.habitats||[]), habitat];
      const newR = [...(z.roster||[]), ...rosterEntries];
      let newC   = z.conservation||[];
      if (hasConservationGoal && !newC.find(c=>c.species===species))
        newC = [...newC, { id:Date.now(), species, goalPop:rosterEntries.length, currentPop:rosterEntries.length, releaseGoal:0, released:0 }];
      debouncedWrite('Habitats', activeZooId, newH);
      debouncedWrite('Roster',   activeZooId, newR);
      if (hasConservationGoal) debouncedWrite('Conservation', activeZooId, newC);
      return { habitats:newH, roster:newR, conservation:newC };
    });
  };

  const openBuilder = (sp='') => { setBuilderSpecies(sp); setBuilderOpen(true); setPaletteOpen(false); };

  const syncColors = { idle:'transparent', loading:'#c8a030', saving:'#4a8aab', ok:'#6ab87a', error:'#c84040' };
  const syncLabels = { idle:'', loading:'⟳', saving:'⟳', ok:'✓', error:'⚠' };

  // ── LANDING PAGE ─────────────────────────────────────────────────────
  if (!activeZooId) {
    return (
      <>
        <style>{`:root{--accent:${theme.accent};} input:focus,select:focus,textarea:focus{outline:2px solid ${theme.accent} !important;}`}</style>
        <LandingPage
          zoos={zoos}
          onSelect={id => { setActiveZooId(id); isInit.current = false; }}
          onAdd={addZoo}
          onDelete={deleteZoo}
          theme={theme}
        />
      </>
    );
  }

  // ── MAIN APP ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#0a0d09', color:'#c8d8a8', fontFamily:"'Inter',system-ui,sans-serif" }}>
      <style>{`
        :root{--accent:${theme.accent};--accent-dim:${theme.accentDim};--accent-light:${theme.accentLight};--accent-bg:${theme.accentBg};--accent-border:${theme.accentBorder};}
        input:focus,select:focus,textarea:focus{outline:2px solid ${theme.accent} !important;outline-offset:1px;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:#0a0d09;}
        ::-webkit-scrollbar-thumb{background:${theme.accentBorder};border-radius:3px;}
      `}</style>

      {/* ── Header ── */}
      <div style={{ background:'#060908', borderBottom:`1px solid ${theme.accentBorder}`, position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 1rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0.5rem 0', flexWrap:'wrap' }}>

            {/* Back to zoos */}
            <button onClick={() => setActiveZooId(null)}
              style={{ background:'none', border:'none', color:'#5a7050', cursor:'pointer', fontSize:20, padding:0, flexShrink:0, lineHeight:1 }} title="Back to zoo list">
              🦒
            </button>

            <ZooManager zoos={zoos} activeZooId={activeZooId} setActiveZooId={id => { setActiveZooId(id); isInit.current=false; }} addZoo={addZoo} renameZoo={renameZoo} deleteZoo={deleteZoo} />

            {/* Sync pill + manual refresh */}
            {syncStatus !== 'idle' ? (
              <div style={{ fontSize:11, color:syncColors[syncStatus], padding:'2px 7px', background:`${syncColors[syncStatus]}18`, borderRadius:20, border:`1px solid ${syncColors[syncStatus]}44`, flexShrink:0 }}>
                {syncLabels[syncStatus]} {syncMsg}
              </div>
            ) : (
              <button onClick={() => { isInit.current = null; fullReload(activeZooId); }}
                style={{ fontSize:11, color:'#3a5030', padding:'2px 7px', background:'transparent', borderRadius:20, border:'1px solid #1e2a18', flexShrink:0, cursor:'pointer' }}
                title="Refresh data from Google Sheets">
                ⟳
              </button>
            )}

            <div style={{ flex:1 }} />

            {/* Tools palette button */}
            <button onClick={() => setPaletteOpen(v=>!v)}
              style={{ display:'flex', alignItems:'center', gap:5, background:paletteOpen?theme.accentBg:'transparent', border:`1px solid ${paletteOpen?theme.accent:theme.accentBorder}`, borderRadius:8, padding:'5px 11px', color:paletteOpen?theme.accentLight:'#7a9460', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
              🛠️ Tools {paletteOpen ? '▲' : '▼'}
            </button>

            {/* PZ toggle */}
            <div onClick={() => setPzVersion(v=>v==='PZ1'?'PZ2':'PZ1')}
              style={{ display:'flex', alignItems:'center', gap:6, background:theme.accentBg, border:`1px solid ${theme.accentBorder}`, borderRadius:20, padding:'4px 12px', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:theme.accentLight }} />
              <span style={{ color:theme.accentLight, fontSize:11, fontWeight:700 }}>▶ {theme.name}</span>
            </div>
          </div>

          {/* Tools palette dropdown */}
          {paletteOpen && (
            <div style={{ display:'flex', gap:8, padding:'8px 0 10px', borderTop:`1px solid ${theme.accentBorder}` }}>
              {[
                { icon:'📖', label:'Zoopedia', sub:'Species reference', action:() => { setZoopediaOpen(true); setPaletteOpen(false); } },
                { icon:'🏗️', label:'Habitat Builder', sub:'Plan & calculate', action:() => { openBuilder(); } },
                { icon:'🎯', label:'Species Finder', sub:'Get recommendations', action:() => { setQuizOpen(true); setPaletteOpen(false); } },
                { icon:'🎓', label:'Taxonomy Guide', sub:'Learn animal classification', action:() => { setTaxonomyOpen(true); setPaletteOpen(false); } },
              ].map(t => (
                <button key={t.label} onClick={t.action}
                  style={{ display:'flex', alignItems:'center', gap:10, background:theme.accentBg, border:`1px solid ${theme.accentBorder}`, borderRadius:10, padding:'8px 14px', cursor:'pointer', textAlign:'left', flex:1, minWidth:0 }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{t.icon}</span>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13, color:'#c8d8a8', fontWeight:600, whiteSpace:'nowrap' }}>{t.label}</div>
                    <div style={{ fontSize:11, color:'#5a7050' }}>{t.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Tab bar */}
          <div style={{ display:'flex', gap:1, overflowX:'auto' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setPaletteOpen(false); }} style={{
                background:tab===t.id?theme.tabActive:'transparent', border:'none',
                borderBottom:tab===t.id?`2px solid ${theme.accent}`:'2px solid transparent',
                color:tab===t.id?'#d8ecc0':'#4a6040',
                padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:tab===t.id?600:400,
                whiteSpace:'nowrap', borderRadius:'4px 4px 0 0', transition:'color 0.15s',
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
        {tab==='inventory'    && <AnimalInventory animals={zoo.animals||[]} setAnimals={makeSetter('animals','Animals')} speciesList={speciesList} theme={theme} />}
        {tab==='roster'       && <Roster roster={zoo.roster||[]} setRoster={makeSetter('roster','Roster')} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} />}
        {tab==='conservation' && <ConservationProjects conservation={zoo.conservation||[]} setConservation={makeSetter('conservation','Conservation')} animals={zoo.animals||[]} speciesList={speciesList} theme={theme} />}
        {tab==='habitats'     && <HabitatPlanner habitats={zoo.habitats||[]} setHabitats={makeSetter('habitats','Habitats')} pzVersion={pzVersion} speciesList={speciesList} theme={theme} animalDb={animalDb} onOpenBuilder={openBuilder} />}
        {tab==='bloodlines'   && <BloodlineTracker
          bloodlines={zoo.bloodlines||[]}
          setBloodlines={(val) => {
            const newBL = typeof val==='function' ? val(zoo.bloodlines||[]) : val;
            const added = newBL.filter(b => !(zoo.bloodlines||[]).find(e=>e.id===b.id));
            if (added.length > 0) {
              const newR = [...(zoo.roster||[])];
              added.forEach(b => {
                if (!newR.find(r=>r.name===b.name&&r.species===b.species))
                  newR.push({ id:Date.now()+Math.random(), species:b.species, name:b.name, sex:'', ageStage:'Juvenile', fertility:'', immunity:'', size:'', longevity:'', appeal:'', mate:'', offspring:'', disposition:'Keep', isAlpha:false, isBonded:false, isOutsider:false, socialStructure:'' });
              });
              makeSetter('roster','Roster')(newR);
            }
            makeSetter('bloodlines','Bloodlines')(val);
          }}
          roster={zoo.roster||[]} speciesList={speciesList} theme={theme} />}
        {tab==='peeps'        && <Peeps peeps={zoo.peeps||{zones:[],facilities:[],vendors:[],restaurants:[]}} setPeeps={makeSetter('peeps','Peeps')} theme={theme} habitats={zoo.habitats||[]} />}
      </div>

      {/* ── Tool overlays ── */}
      {zoopediaOpen && (
        <Zoopedia theme={theme}
          onOpenBuilder={sp => { setZoopediaOpen(false); openBuilder(sp); }}
          isModal onClose={() => setZoopediaOpen(false)} />
      )}
      {builderOpen && (
        <HabitatBuilder onClose={() => setBuilderOpen(false)} initialSpecies={builderSpecies} onCommit={handleBuilderCommit} theme={theme} />
      )}
      {quizOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
          <div style={{ background:'#111a0f', border:`1px solid ${theme.accentBorder}`, borderRadius:14, width:'100%', maxWidth:640, padding:'1.5rem', position:'relative' }}>
            <button onClick={() => setQuizOpen(false)} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', color:'#5a7050', cursor:'pointer', fontSize:18 }}>✕</button>
            <HabitatQuiz theme={theme} onOpenBuilder={sp => { setQuizOpen(false); openBuilder(sp); }} />
          </div>
        </div>
      )}
      {taxonomyOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'1rem', overflowY:'auto' }}>
          <div style={{ background:'#111a0f', border:`1px solid ${theme.accentBorder}`, borderRadius:14, width:'100%', maxWidth:860, padding:'1.5rem', position:'relative', marginTop:'1rem' }}>
            <button onClick={() => setTaxonomyOpen(false)} style={{ position:'absolute', top:14, right:14, background:'none', border:'none', color:'#5a7050', cursor:'pointer', fontSize:18 }}>✕</button>
            <TaxonomyExplorer theme={theme} onSelectAnimal={name => { setTaxonomyOpen(false); setZoopediaOpen(true); }} />
          </div>
        </div>
      )}
    </div>
  );
}
