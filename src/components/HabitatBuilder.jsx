import { useState, useMemo } from 'react';
import { X, Plus, Minus, Check, Trash2 } from 'lucide-react';
import { PZ1_ZOOPEDIA_MAP, PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';
import { AnimalImage } from './AnimalImage.jsx';

function calcRequired(base, addPer, count) {
  // Coerce strings from spreadsheet data to numbers
  base = +base || 0; addPer = +addPer || 0; count = +count || 0;
  if (!base) return 0;
  return base + Math.max(0, (count - 1)) * (addPer || 0);
}
function parseMax(str) {
  if (!str) return 20;
  const m = String(str).match(/(\d+)\s*$/);
  return m ? +m[1] : 20;
}
function Counter({ value, onChange, min = 0 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <button onClick={() => onChange(Math.max(min, value-1))} style={{ width:26, height:26, background:'#1a2818', border:'1px solid #2e4028', borderRadius:5, color:'#7a9460', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Minus size={12}/></button>
      <span style={{ minWidth:22, textAlign:'center', color:'#c8d8a8', fontWeight:700, fontSize:16 }}>{value}</span>
      <button onClick={() => onChange(value+1)} style={{ width:26, height:26, background:'#1a2818', border:'1px solid #2e4028', borderRadius:5, color:'#7a9460', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><Plus size={12}/></button>
    </div>
  );
}

// ── Compatibility checker ────────────────────────────────────────────────────
function checkCompatibility(primaryName, companions) {
  const primary = PZ1_ZOOPEDIA_MAP[primaryName];
  if (!primary || companions.length === 0) return [];
  
  const primaryCompat = primary.compatibility ? primary.compatibility.split(',').map(s=>s.trim()) : [];
  const allSpecies    = [primaryName, ...companions.map(c=>c.species).filter(Boolean)];
  const warnings      = [];

  // Check each companion vs primary
  companions.forEach(comp => {
    if (!comp.species) return;
    const compAnimal = PZ1_ZOOPEDIA_MAP[comp.species];
    const compCompat = compAnimal?.compatibility ? compAnimal.compatibility.split(',').map(s=>s.trim()) : [];
    const primaryKnowsComp = primaryCompat.includes(comp.species);
    const compKnowsPrimary = compCompat.includes(primaryName);
    if (!primaryKnowsComp && !compKnowsPrimary) {
      warnings.push({ type:'error', msg:`${primaryName} and ${comp.species} are not listed as compatible — no enrichment bonus, shared biome requirements may conflict.` });
    }
  });

  // Check companions against each other (pairwise)
  for (let i = 0; i < companions.length; i++) {
    for (let j = i+1; j < companions.length; j++) {
      const a = companions[i].species; const b = companions[j].species;
      if (!a || !b) continue;
      const aAnimal = PZ1_ZOOPEDIA_MAP[a];
      const bAnimal = PZ1_ZOOPEDIA_MAP[b];
      const aCompat = aAnimal?.compatibility ? aAnimal.compatibility.split(',').map(s=>s.trim()) : [];
      const bCompat = bAnimal?.compatibility ? bAnimal.compatibility.split(',').map(s=>s.trim()) : [];
      if (!aCompat.includes(b) && !bCompat.includes(a)) {
        warnings.push({ type:'warn', msg:`${a} and ${b} aren't listed as compatible with each other — no cross-enrichment bonus between them.` });
      }
    }
  }
  return warnings;
}

// ── SpaceBar ────────────────────────────────────────────────────────────────
function SpaceBar({ label, required, max, color }) {
  const pctReq = max > 0 ? Math.min(100, (required/max)*100) : 0;
  const ok = required <= max || max === 0;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
        <span style={{ color:'#7a9460' }}>{label}</span>
        <span style={{ color:'#c8d8a8', fontWeight:700 }}>{required.toLocaleString()} m² needed</span>
      </div>
      <div style={{ height:6, background:'#1a2818', borderRadius:3, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${pctReq}%`, background:color||'#4a8aab', borderRadius:3, transition:'width 0.3s' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#3a5030', marginTop:2 }}>
        <span>For your {label.toLowerCase()} count</span>
        {max > 0 && <span>Max capacity: {max.toLocaleString()} m²</span>}
      </div>
    </div>
  );
}

export default function HabitatBuilder({ onClose, initialSpecies, onCommit, theme }) {
  const accent = theme?.accent||'#0f9a6d';

  const [species, setSpecies]             = useState(initialSpecies||'');
  const [males, setMales]                 = useState(1);
  const [females, setFemales]             = useState(1);
  const [companions, setCompanions]       = useState([]); // [{species, males, females}]
  const [hasConservGoal, setHasConservGoal] = useState(false);
  const [habitatName, setHabitatName]     = useState('');
  const [searchQ, setSearchQ]             = useState('');

  const animal     = PZ1_ZOOPEDIA_MAP[species];
  const adultCount = males + females;

  // Primary space
  const primLandReq  = calcRequired(animal?.baseLand,  animal?.addLand,  adultCount);
  const primWaterReq = calcRequired(animal?.baseWater, animal?.addWater, adultCount);
  const primClimbReq = calcRequired(animal?.baseClimbing, animal?.addClimbing, adultCount);
  const maxAdults    = parseMax(animal?.groupSize);
  const primLandMax  = calcRequired(animal?.baseLand, animal?.addLand, maxAdults);
  const primWaterMax = calcRequired(animal?.baseWater, animal?.addWater, maxAdults);

  // Companion totals
  const compTotals = companions.reduce((acc, c) => {
    const ca = PZ1_ZOOPEDIA_MAP[c.species];
    if (!ca) return acc;
    const n = (c.males||0) + (c.females||0);
    acc.land  += calcRequired(ca.baseLand,  ca.addLand,  n);
    acc.water += calcRequired(ca.baseWater, ca.addWater, n);
    return acc;
  }, { land:0, water:0 });

  const totalLand  = primLandReq  + compTotals.land;
  const totalWater = primWaterReq + compTotals.water;
  const totalClimb = primClimbReq;

  // Compatibility warnings
  const compatWarnings = useMemo(() => checkCompatibility(species, companions), [species, companions]);

  // Companion suggestions from primary animal
  const primaryCompat = animal?.compatibility ? animal.compatibility.split(',').map(s=>s.trim()).filter(Boolean) : [];

  // Species search
  const filteredSpecies = useMemo(() => {
    const q = searchQ.toLowerCase();
    return PZ1_ZOOPEDIA.filter(a => !q || a.name.toLowerCase().includes(q)).slice(0, 80);
  }, [searchQ]);

  const addCompanion = () => setCompanions(prev => [...prev, { species:'', males:0, females:1 }]);
  const removeCompanion = (i) => setCompanions(prev => prev.filter((_,idx)=>idx!==i));
  const updateCompanion = (i, key, val) => setCompanions(prev => prev.map((c,idx)=>idx===i?{...c,[key]:val}:c));

  const commit = () => {
    if (!species||!animal) return;
    const name = habitatName||`${species} Habitat`;
    const habitat = {
      id: Date.now(), name, species,
      regions: animal.continents ? [animal.continents.split(',')[0].trim()] : [],
      biomes:  animal.biomes ? animal.biomes.split(',').map(b=>b.trim()) : [],
      habitatType: animal.type||'Habitats',
      actualLandSpace:totalLand, actualWaterSpace:totalWater,
      baseSpace:animal.baseLand||0, perAdditionalSpace:animal.addLand||0,
      adultCount, guestRating:'', status:'Planning', socialStructure:'',
      fenceGrade:animal.fenceGrade, fenceHeight:animal.fenceHeight,
      conservationGoal:hasConservGoal,
      companions: companions.filter(c=>c.species),
      features: companions.filter(c=>c.species).map(c=>`${c.species}`).join(', ')
    };
    // Auto-seed roster
    const roster = [];
    for (let i=1; i<=males; i++)
      roster.push({ id:Date.now()+i, species, name:`${species} ${i}`, sex:'Male', ageStage:'Adult', fertility:'', immunity:'', size:'', longevity:'', appeal:animal.appeal||'', mate:'', offspring:'', disposition:'Keep', isAlpha:i===1, isBonded:false, isOutsider:false, socialStructure:'' });
    for (let i=1; i<=females; i++)
      roster.push({ id:Date.now()+100+i, species, name:`${species} ${males+i}`, sex:'Female', ageStage:'Adult', fertility:'', immunity:'', size:'', longevity:'', appeal:animal.appeal||'', mate:'', offspring:'', disposition:'Keep', isAlpha:false, isBonded:false, isOutsider:false, socialStructure:'' });
    companions.filter(c=>c.species).forEach((comp, ci) => {
      const ca = PZ1_ZOOPEDIA_MAP[comp.species];
      for (let i=1; i<=comp.males; i++)
        roster.push({ id:Date.now()+200+(ci*50)+i, species:comp.species, name:`${comp.species} ${i}`, sex:'Male', ageStage:'Adult', fertility:'', immunity:'', size:'', longevity:'', appeal:ca?.appeal||'', mate:'', offspring:'', disposition:'Keep', isAlpha:false, isBonded:false, isOutsider:false, socialStructure:'' });
      for (let i=1; i<=comp.females; i++)
        roster.push({ id:Date.now()+300+(ci*50)+i, species:comp.species, name:`${comp.species} ${comp.males+i}`, sex:'Female', ageStage:'Adult', fertility:'', immunity:'', size:'', longevity:'', appeal:ca?.appeal||'', mate:'', offspring:'', disposition:'Keep', isAlpha:false, isBonded:false, isOutsider:false, socialStructure:'' });
    });
    onCommit({ habitat, rosterEntries:roster, hasConservationGoal:hasConservGoal, species });
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'0.75rem' }}>
      <div style={{ background:'#111a0f', border:`1px solid ${accent}44`, borderRadius:14, width:'100%', maxWidth:900, maxHeight:'95vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:accent, padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:'#fff' }}>🏗️ Habitat Builder</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)' }}>Predictive planning · auto-seeds Roster on commit</div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, padding:'5px 9px', color:'#fff', cursor:'pointer' }}><X size={16}/></button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden', flexDirection:'row' }}>

          {/* ── LEFT PANEL ── */}
          <div style={{ width:270, flexShrink:0, borderRight:'1px solid #1e2a18', padding:'12px', overflowY:'auto', display:'flex', flexDirection:'column', gap:12 }}>

            {/* Species picker */}
            <div>
              <label style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 }}>Primary Species</label>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search…"
                style={{ width:'100%', background:'#0d1410', border:'1px solid #2e4028', borderRadius:6, padding:'6px 9px', color:'#c8d8a8', fontSize:13, boxSizing:'border-box', outline:'none', marginBottom:6 }} />
              <div style={{ height:150, overflowY:'auto', border:'1px solid #1e2a18', borderRadius:6 }}>
                {filteredSpecies.map(a => (
                  <button key={a.name} onClick={() => { setSpecies(a.name); setSearchQ(''); setCompanions([]); }}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'5px 8px', background:species===a.name?`${accent}22`:'transparent', border:'none', borderBottom:'1px solid #111a0f', cursor:'pointer', textAlign:'left' }}>
                    <AnimalImage src={a.image} alt={a.name} type={a.type} conservationStatus={a.conservationStatus} style={{ width:26, height:26, borderRadius:4, flexShrink:0, fontSize:'0.9rem' }} />
                    <span style={{ fontSize:12, color:species===a.name?'#e0ecc0':'#c8d8a8' }}>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {animal && (
              <>
                {/* Counts */}
                <div>
                  <label style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:8 }}>Adult Counts</label>
                  {[['♂ Males', males, setMales, '#8ab0c8'], ['♀ Females', females, setFemales, '#c890b8']].map(([label, val, setter, color]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:13, color }}>{label}</span>
                      <Counter value={val} onChange={setter} />
                    </div>
                  ))}
                  <div style={{ fontSize:12, color:'#5a7050', paddingTop:6, borderTop:'1px solid #1a2218' }}>
                    Total: <strong style={{ color:'#c8d8a8' }}>{adultCount}</strong>
                    {animal.maleToFemale && <span style={{ marginLeft:8, color:'#3a5030' }}>Rec. {animal.maleToFemale}</span>}
                  </div>
                </div>

                {/* Barrier */}
                <div style={{ background:'#0a1208', border:'1px solid #1e2a18', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Barrier Requirements</div>
                  <div style={{ display:'flex', gap:14 }}>
                    <div><div style={{ fontSize:10, color:'#5a7050' }}>Grade</div><div style={{ fontSize:20, fontWeight:800, color:'#c8d8a8' }}>{animal.fenceGrade||'—'}</div></div>
                    <div><div style={{ fontSize:10, color:'#5a7050' }}>Height</div><div style={{ fontSize:20, fontWeight:800, color:'#c8d8a8' }}>{animal.fenceHeight?`${animal.fenceHeight}m`:'—'}</div></div>
                    <div><div style={{ fontSize:10, color:'#5a7050' }}>Climbable</div><div style={{ fontSize:13, fontWeight:700, color:animal.climbable?'#c84040':'#6ab87a' }}>{animal.climbable?'⚠ Yes':'No'}</div></div>
                  </div>
                </div>

                {/* Companions */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <label style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em' }}>Companion Species</label>
                    <button onClick={addCompanion} style={{ background:'transparent', border:`1px solid ${accent}`, borderRadius:5, padding:'3px 8px', color:accent, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', gap:3 }}><Plus size={11}/> Add</button>
                  </div>
                  {companions.length===0 && primaryCompat.length>0 && (
                    <div style={{ fontSize:11, color:'#3a5030', marginBottom:6 }}>Compatible: {primaryCompat.slice(0,3).join(', ')}{primaryCompat.length>3?` +${primaryCompat.length-3} more`:''}</div>
                  )}
                  {companions.map((comp, i) => (
                    <div key={i} style={{ background:'#0a1208', border:'1px solid #1e2a18', borderRadius:7, padding:'8px 10px', marginBottom:7 }}>
                      <div style={{ display:'flex', gap:6, marginBottom:7, alignItems:'center' }}>
                        <select value={comp.species} onChange={e=>updateCompanion(i,'species',e.target.value)}
                          style={{ flex:1, background:'#111a0f', border:'1px solid #2e4028', borderRadius:5, padding:'5px 7px', color:comp.species?'#c8d8a8':'#5a7050', fontSize:12, outline:'none' }}>
                          <option value="">Select species…</option>
                          {primaryCompat.length>0 && <optgroup label="Compatible">
                            {primaryCompat.map(n=><option key={n} value={n}>{n}</option>)}
                          </optgroup>}
                          <optgroup label="All species">
                            {PZ1_ZOOPEDIA.filter(a=>!primaryCompat.includes(a.name)).map(a=><option key={a.name} value={a.name}>{a.name}</option>)}
                          </optgroup>
                        </select>
                        <button onClick={()=>removeCompanion(i)} style={{ background:'none', border:'none', color:'#c96060', cursor:'pointer', padding:2 }}><Trash2 size={13}/></button>
                      </div>
                      <div style={{ display:'flex', gap:10 }}>
                        {[['♂', comp.males, v=>updateCompanion(i,'males',v), '#8ab0c8'], ['♀', comp.females, v=>updateCompanion(i,'females',v), '#c890b8']].map(([sym, val, setter, color]) => (
                          <div key={sym} style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                            <span style={{ fontSize:12, color }}>{sym}</span>
                            <Counter value={val} onChange={setter} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conservation */}
                <label style={{ display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer', padding:'10px', background:hasConservGoal?'#0a1e10':'#0a120a', border:`1px solid ${hasConservGoal?accent:'#1e2a18'}`, borderRadius:8 }}>
                  <input type="checkbox" checked={hasConservGoal} onChange={e=>setHasConservGoal(e.target.checked)} style={{ accentColor:accent, marginTop:2 }} />
                  <span style={{ fontSize:12, color:'#c8d8a8', lineHeight:1.4 }}>Active conservation goal?<br/><span style={{ color:'#5a7050', fontSize:11 }}>Links to Conservation tab on commit</span></span>
                </label>
              </>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ flex:1, padding:'14px 18px', overflowY:'auto' }}>
            {!animal ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#3a5030', gap:10 }}>
                <div style={{ fontSize:40 }}>🏕️</div>
                <div style={{ fontSize:14, fontWeight:600 }}>Select a species to begin</div>
              </div>
            ) : (
              <>
                {/* Animal header */}
                <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid #1a2218' }}>
                  <AnimalImage src={animal.image} alt={animal.name} type={animal.type} conservationStatus={animal.conservationStatus} style={{ width:68, height:68, borderRadius:10, flexShrink:0, fontSize:'2rem' }} />
                  <div>
                    <div style={{ fontWeight:800, fontSize:18, color:'#e0ecc0' }}>{animal.name}</div>
                    <div style={{ fontSize:11, color:'#5a7050', fontStyle:'italic' }}>{animal.genus} {animal.species}</div>
                    <div style={{ display:'flex', gap:8, marginTop:4, flexWrap:'wrap' }}>
                      {animal.appeal && <span style={{ color:'#c8a830', fontSize:12, fontWeight:700 }}>★ {Number(animal.appeal).toLocaleString()}</span>}
                      {animal.reproductionRate && <span style={{ color:'#7a9460', fontSize:12 }}>{animal.reproductionRate} repro</span>}
                      {animal.temperature && <span style={{ color:'#7a9460', fontSize:12 }}>{animal.temperature} °C</span>}
                    </div>
                  </div>
                </div>

                {/* Habitat name */}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:5 }}>Habitat Name</label>
                  <input value={habitatName} onChange={e=>setHabitatName(e.target.value)} placeholder={`${species} Habitat`}
                    style={{ width:'100%', background:'#0d1410', border:'1px solid #2e4028', borderRadius:6, padding:'7px 10px', color:'#c8d8a8', fontSize:14, boxSizing:'border-box', outline:'none' }} />
                </div>

                {/* Social / group requirements */}
                <div style={{ background:'#0a1208', border:'1px solid #1e2a18', borderRadius:8, padding:'12px 14px', marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Group Requirements</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:10, color:'#5a7050', marginBottom:3 }}>Group Size</div>
                      <div style={{ fontSize:18, fontWeight:800, color:'#c8d8a8' }}>{animal.groupSize || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'#5a7050', marginBottom:3 }}>M:F Ratio</div>
                      <div style={{ fontSize:18, fontWeight:800, color:'#c8d8a8' }}>{animal.maleToFemale || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'#5a7050', marginBottom:3 }}>Your Count</div>
                      <div style={{ fontSize:18, fontWeight:800, color: (() => { const gs = animal.groupSize; if (!gs) return '#c8d8a8'; const parts = String(gs).match(/(\d+)[^\d]+(\d+)/); if (!parts) return '#c8d8a8'; return adultCount >= +parts[1] && adultCount <= +parts[2] ? '#6ab87a' : '#c84040'; })() }}>{adultCount}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, paddingTop:8, borderTop:'1px solid #1a2218' }}>
                    <div>
                      <div style={{ fontSize:10, color:'#5a7050', marginBottom:3 }}>♂ Bachelor Range</div>
                      <div style={{ fontSize:13, color:'#8ab0c8', fontWeight:600 }}>{animal.maleBachelor || '—'}</div>
                      <div style={{ fontSize:10, color: (() => { const b = animal.maleBachelor; if (!b) return '#3a5030'; const parts = String(b).match(/(\d+)[^\d]+(\d+)/); if (!parts) return '#3a5030'; return males >= +parts[1] && males <= +parts[2] ? '#6ab87a' : '#c87030'; })() }}>
                        Your: {males} ♂{(() => { const b = animal.maleBachelor; if (!b) return ''; const parts = String(b).match(/(\d+)[^\d]+(\d+)/); if (!parts) return ''; return males >= +parts[1] && males <= +parts[2] ? ' ✓' : ' ⚠'; })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:'#5a7050', marginBottom:3 }}>♀ Bachelor Range</div>
                      <div style={{ fontSize:13, color:'#c890b8', fontWeight:600 }}>{animal.femaleBachelor || '—'}</div>
                      <div style={{ fontSize:10, color: (() => { const b = animal.femaleBachelor; if (!b) return '#3a5030'; const parts = String(b).match(/(\d+)[^\d]+(\d+)/); if (!parts) return '#3a5030'; return females >= +parts[1] && females <= +parts[2] ? '#6ab87a' : '#c87030'; })() }}>
                        Your: {females} ♀{(() => { const b = animal.femaleBachelor; if (!b) return ''; const parts = String(b).match(/(\d+)[^\d]+(\d+)/); if (!parts) return ''; return females >= +parts[1] && females <= +parts[2] ? ' ✓' : ' ⚠'; })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compatibility alerts */}
                {compatWarnings.length > 0 && (
                  <div style={{ marginBottom:14 }}>
                    {compatWarnings.map((w, i) => (
                      <div key={i} style={{ background:w.type==='error'?'#180808':'#181408', border:`1px solid ${w.type==='error'?'#5a2828':'#4a3808'}`, borderRadius:7, padding:'8px 12px', marginBottom:6, display:'flex', gap:8 }}>
                        <span style={{ fontSize:14, flexShrink:0 }}>{w.type==='error'?'🚫':'⚠️'}</span>
                        <span style={{ fontSize:12, color:w.type==='error'?'#c86060':'#c8a040', lineHeight:1.5 }}>{w.msg}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Space summary */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px,1fr))', gap:10, marginBottom:16 }}>
                  {[
                    { label:'Total Land', value:totalLand, color:'#6ab87a', show:true },
                    { label:'Total Water', value:totalWater, color:'#4a8aab', show:totalWater>0 },
                    { label:'Climbing', value:totalClimb, color:'#c8a030', show:totalClimb>0 },
                  ].filter(s=>s.show).map(s => (
                    <div key={s.label} style={{ background:'#0a1208', border:`1px solid ${s.color}44`, borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'#5a7050', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{s.label}</div>
                      <div style={{ fontSize:22, fontWeight:800, color:s.color }}>{s.value.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'#3a5030' }}>m² needed</div>
                    </div>
                  ))}
                </div>

                {/* Min vs max bars */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Capacity Range</div>
                  {animal.baseLand>0 && <SpaceBar label="Land" required={totalLand} max={primLandMax} color="#6ab87a" />}
                  {animal.baseWater>0 && <SpaceBar label="Water" required={totalWater} max={primWaterMax} color="#4a8aab" />}
                </div>

                {/* Breakdown */}
                <div style={{ background:'#0a1208', border:'1px solid #1e2a18', borderRadius:8, padding:'12px 14px', marginBottom:16, fontSize:13 }}>
                  <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Calculation Breakdown</div>
                  <div style={{ display:'flex', justifyContent:'space-between', color:'#7a9460', marginBottom:4 }}>
                    <span>{species} base</span><span style={{ color:'#c8d8a8' }}>{(animal.baseLand||0).toLocaleString()} m²</span>
                  </div>
                  {adultCount>1 && <div style={{ display:'flex', justifyContent:'space-between', color:'#7a9460', marginBottom:4 }}>
                    <span>+{adultCount-1} extra adults × {(animal.addLand||0).toLocaleString()} m²</span>
                    <span style={{ color:'#c8d8a8' }}>{((adultCount-1)*(animal.addLand||0)).toLocaleString()} m²</span>
                  </div>}
                  {companions.filter(c=>c.species).map((comp, i) => {
                    const ca = PZ1_ZOOPEDIA_MAP[comp.species]; if (!ca) return null;
                    const n = (comp.males||0)+(comp.females||0);
                    return (
                      <div key={i}>
                        <div style={{ borderTop:'1px solid #1a2218', paddingTop:6, marginTop:4, display:'flex', justifyContent:'space-between', color:'#7a9460', marginBottom:4 }}>
                          <span>{comp.species} base</span><span style={{ color:'#c8d8a8' }}>{(ca.baseLand||0).toLocaleString()} m²</span>
                        </div>
                        {n>1 && <div style={{ display:'flex', justifyContent:'space-between', color:'#7a9460', marginBottom:4 }}>
                          <span>+{n-1} extra × {(ca.addLand||0).toLocaleString()} m²</span>
                          <span style={{ color:'#c8d8a8' }}>{((n-1)*(ca.addLand||0)).toLocaleString()} m²</span>
                        </div>}
                      </div>
                    );
                  })}
                  <div style={{ borderTop:'1px solid #2e4028', paddingTop:8, marginTop:4, display:'flex', justifyContent:'space-between', fontWeight:700 }}>
                    <span style={{ color:'#c8d8a8' }}>Total land needed</span><span style={{ color:accent }}>{totalLand.toLocaleString()} m²</span>
                  </div>
                </div>

                {/* Roster preview */}
                <div style={{ background:'#0a1208', border:'1px solid #1e2a18', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
                  <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Roster Auto-Seed Preview</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {Array.from({length:males},(_,i)=><span key={`m${i}`} style={{ background:'#0c1e30', border:'1px solid #1a4060', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#8ab0c8' }}>♂ {species} {i+1}</span>)}
                    {Array.from({length:females},(_,i)=><span key={`f${i}`} style={{ background:'#200c28', border:'1px solid #40185a', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#c890b8' }}>♀ {species} {males+i+1}</span>)}
                    {companions.filter(c=>c.species).flatMap((comp, ci) => [
                      ...Array.from({length:comp.males||0},(_,i)=><span key={`cm${ci}${i}`} style={{ background:'#0a1e18', border:'1px solid #1a3828', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#4ab890' }}>♂ {comp.species} {i+1}</span>),
                      ...Array.from({length:comp.females||0},(_,i)=><span key={`cf${ci}${i}`} style={{ background:'#1e0c18', border:'1px solid #3a1828', borderRadius:20, padding:'3px 10px', fontSize:11, color:'#b87090' }}>♀ {comp.species} {(comp.males||0)+i+1}</span>),
                    ])}
                  </div>
                </div>

                <button onClick={commit}
                  style={{ width:'100%', background:accent, border:'none', borderRadius:8, padding:'12px', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                  <Check size={16}/> Commit Enclosure to Zoo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
