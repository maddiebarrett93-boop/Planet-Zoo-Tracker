import { useState, useMemo } from 'react';
import { Search, ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import { PZ1_ZOOPEDIA, PZ1_ZOOPEDIA_MAP } from '../data/pz1_zoopedia.js';
import { AnimalImage } from './AnimalImage.jsx';

const IUCN_COLOR = {
  'Least Concern':'#6ab87a','Near Threatened':'#9ab84a','Vulnerable':'#c8a030',
  'Endangered':'#c87030','Critically Endangered':'#c84040',
  'Extinct in the Wild':'#9060a0','Data Deficient':'#7a9460','Domesticated':'#4a9ab8',
};
const IUCN_BG = {
  'Least Concern':'#0a1e10','Near Threatened':'#121e08','Vulnerable':'#1e1a08',
  'Endangered':'#1e1008','Critically Endangered':'#1e0808',
  'Extinct in the Wild':'#120810','Data Deficient':'#111a0f','Domesticated':'#081820',
};
const REPRO_COLOR = { 'Very Easy':'#6ab87a','Easy':'#9ab84a','Average':'#c8a030','Difficult':'#c87030','Very Difficult':'#c84040' };
const TYPE_COLOR  = { 'Habitat':'#4a8aab','Exhibit':'#9060a0','Aviary':'#c8a030','Aquarium':'#2a7ab8' };
const IUCN_SHORT  = { 'Least Concern':'LC','Near Threatened':'NT','Vulnerable':'VU','Endangered':'EN','Critically Endangered':'CR','Extinct in the Wild':'EW','Data Deficient':'DD','Domesticated':'DOM' };

const ALL_BIOMES     = [...new Set(PZ1_ZOOPEDIA.flatMap(a => a.biomes ? a.biomes.split(',').map(b=>b.trim()) : []).filter(Boolean))].sort();
const ALL_CONTINENTS = [...new Set(PZ1_ZOOPEDIA.flatMap(a => a.continents ? a.continents.split(',').map(c=>c.trim()) : []).filter(Boolean))].sort();
const ALL_CLASSES    = [...new Set(PZ1_ZOOPEDIA.map(a=>a.class_).filter(Boolean))].sort();
const ALL_ORDERS     = [...new Set(PZ1_ZOOPEDIA.map(a=>a.order).filter(Boolean))].sort();
const APPEAL_TIERS   = [
  { label:'Any Appeal', min:0, max:Infinity },
  { label:'Normal (0–1,249)', min:0, max:1249 },
  { label:'Bronze (1,250–3,124)', min:1250, max:3124 },
  { label:'Silver (3,125–5,624)', min:3125, max:5624 },
  { label:'Gold (5,625+)', min:5625, max:Infinity },
];

function Chip({ label, bg, color, border }) {
  return <span style={{ background:bg||'#1a2a14', border:`1px solid ${border||'#2e4028'}`, borderRadius:12, padding:'2px 9px', fontSize:11, color:color||'#7a9460', fontWeight:600, whiteSpace:'nowrap', display:'inline-block' }}>{label}</span>;
}
function Sec({ title, accent, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ background:accent, borderRadius:5, padding:'4px 10px', fontSize:11, fontWeight:700, color:'#fff', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>{title}</div>
      {children}
    </div>
  );
}
function Row({ label, value, unit, mono }) {
  const empty = value===null||value===undefined||value==='';
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #111a0f' }}>
      <span style={{ fontSize:12, color:'#5a7050', flexShrink:0, marginRight:8 }}>{label}</span>
      <span style={{ fontSize:13, color:empty?'#2a3a28':'#c8d8a8', fontWeight:empty?400:500, fontFamily:mono?'monospace':'inherit', textAlign:'right' }}>
        {empty?'—':`${value}${unit?' '+unit:''}`}
      </span>
    </div>
  );
}
function SpaceRow({ label, base, add, unit='m²' }) {
  const empty = !base&&!add;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid #111a0f' }}>
      <span style={{ fontSize:12, color:'#5a7050', flexShrink:0, marginRight:8 }}>{label}</span>
      <span style={{ fontSize:13, color:empty?'#2a3a28':'#c8d8a8', fontWeight:500, textAlign:'right' }}>
        {empty?'—':`${base||0} ${unit} +${add||0} ${unit}/ea.`}
      </span>
    </div>
  );
}

function AnimalCard({ animal, theme, onOpenBuilder, onBack }) {
  const accent = theme?.accent||'#0f9a6d';
  const biomes        = animal.biomes      ? animal.biomes.split(',').map(b=>b.trim()).filter(Boolean) : [];
  const continents    = animal.continents  ? animal.continents.split(',').map(c=>c.trim()).filter(Boolean) : [];
  const compatibility = animal.compatibility ? animal.compatibility.split(',').map(c=>c.trim()).filter(Boolean) : [];
  const latinName     = [animal.genus, animal.species].filter(Boolean).join(' ');

  return (
    <div style={{ background:'#111a0f', border:'1px solid #2e4028', borderRadius:12, overflow:'hidden' }}>
      {/* Back button on mobile */}
      {onBack && (
        <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'none', color:'#7a9460', cursor:'pointer', padding:'10px 14px', fontSize:13, width:'100%', textAlign:'left', borderBottom:'1px solid #1a2218' }}>
          <ArrowLeft size={15} /> Back to list
        </button>
      )}

      {/* Hero image */}
      <div style={{ position:'relative', background:'#0a120a', minHeight:140 }}>
        <AnimalImage src={animal.image} alt={animal.name} type={animal.type} conservationStatus={animal.conservationStatus}
          style={{ width:'100%', height:180, borderRadius:0, fontSize:'3rem' }} />
        <div style={{ background:'linear-gradient(to top, rgba(10,18,10,1) 0%, rgba(10,18,10,0.5) 50%, transparent 100%)', position:'absolute', bottom:0, left:0, right:0, padding:'24px 16px 12px' }}>
          <div style={{ fontWeight:800, fontSize:20, color:'#e8f8d0', lineHeight:1.1 }}>{animal.name}</div>
          {latinName && <div style={{ fontSize:12, color:'#7a9460', fontStyle:'italic', marginTop:2 }}>{latinName}</div>}
        </div>
        {animal.type && <div style={{ position:'absolute', top:10, right:10, background:TYPE_COLOR[animal.type]||'#3a5a3a', color:'#fff', borderRadius:6, padding:'3px 9px', fontSize:11, fontWeight:700 }}>{animal.type}</div>}
      </div>

      {/* Status row */}
      <div style={{ display:'flex', gap:8, padding:'10px 14px', alignItems:'center', borderBottom:'1px solid #1a2218', flexWrap:'wrap' }}>
        {animal.conservationStatus && (
          <span style={{ background:IUCN_BG[animal.conservationStatus]||'#111a0f', color:IUCN_COLOR[animal.conservationStatus]||'#7a9460', border:`1px solid ${IUCN_COLOR[animal.conservationStatus]||'#2e4028'}`, borderRadius:20, padding:'2px 10px', fontSize:11, fontWeight:700 }}>
            {animal.conservationStatus}
          </span>
        )}
        {animal.appeal && <span style={{ marginLeft:'auto', fontSize:13, color:'#c8a830', fontWeight:700 }}>★ {Number(animal.appeal).toLocaleString()} appeal</span>}
        {onOpenBuilder && (
          <button onClick={() => onOpenBuilder(animal.name)}
            style={{ background:accent, border:'none', borderRadius:6, padding:'5px 12px', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>
            🏗️ Plan Habitat
          </button>
        )}
      </div>

      <div style={{ padding:'12px 14px' }}>
        {/* TAXONOMY */}
        {(animal.class_||animal.order||animal.family) && (
          <Sec title="Taxonomy" accent={accent}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              <Row label="Class"  value={animal.class_} />
              <Row label="Order"  value={animal.order} />
              <Row label="Family" value={animal.family} />
              <Row label="Genus"  value={animal.genus} />
            </div>
            <Row label="Species" value={animal.species} mono />
          </Sec>
        )}

        {/* ORIGINS */}
        <Sec title="Origins" accent={accent}>
          <div style={{ marginBottom:6 }}>
            <div style={{ fontSize:11, color:'#5a7050', marginBottom:4 }}>Continents</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {continents.length>0 ? continents.map(c=><Chip key={c} label={c}/>) : <span style={{ fontSize:12, color:'#2a3a28' }}>—</span>}
            </div>
          </div>
          {animal.regions && (
            <div style={{ fontSize:12, color:'#7a9460', lineHeight:1.5, borderTop:'1px solid #111a0f', paddingTop:6 }}>
              <span style={{ color:'#5a7050', marginRight:6 }}>Regions:</span>{animal.regions}
            </div>
          )}
        </Sec>

        {/* HABITAT */}
        <Sec title="Habitat" accent={accent}>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, color:'#5a7050', marginBottom:4 }}>Biomes</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
              {biomes.length>0 ? biomes.map(b=><Chip key={b} label={b} bg="#0e1e18" border="#1a3828" color="#4ab890"/>) : <span style={{ fontSize:12, color:'#2a3a28' }}>—</span>}
            </div>
          </div>
          <Row label="Fence Grade"  value={animal.fenceGrade?`Grade ${animal.fenceGrade}`:null} />
          <Row label="Fence Height" value={animal.fenceHeight} unit="m" />
          <Row label="Climbable"    value={animal.climbable?'Yes ⚠':animal.climbable===false?'No':null} />
          <Row label="Temperature"  value={animal.temperature} unit="°C" />
          <Row label="Humidity"     value={animal.humidity} unit="%" />
          <SpaceRow label="Land Area"     base={animal.baseLand}    add={animal.addLand} />
          <SpaceRow label="Water Area"    base={animal.baseWater}   add={animal.addWater} />
          {(animal.baseClimbing||animal.addClimbing) && <SpaceRow label="Climbing Area" base={animal.baseClimbing} add={animal.addClimbing} />}
          {(animal.deepWaterMin||animal.addDeepWater) && <SpaceRow label="Deep Water" base={animal.deepWaterMin} add={animal.addDeepWater} unit="m" />}
        </Sec>

        {/* SOCIAL */}
        <Sec title="Social" accent={accent}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:4 }}>
            <div><div style={{ fontSize:11, color:'#5a7050', marginBottom:4 }}>Group Size</div><div style={{ fontSize:16, color:'#c8d8a8', fontWeight:700 }}>{animal.groupSize||'—'}</div></div>
            <div><div style={{ fontSize:11, color:'#5a7050', marginBottom:4 }}>M:F Ratio</div><div style={{ fontSize:16, color:'#c8d8a8', fontWeight:700 }}>{animal.maleToFemale||'—'}</div></div>
            <div><div style={{ fontSize:11, color:'#5a7050', marginBottom:4 }}>♂ Bachelor</div><div style={{ fontSize:13, color:'#8ab0c8' }}>{animal.maleBachelor||'—'}</div></div>
            <div><div style={{ fontSize:11, color:'#5a7050', marginBottom:4 }}>♀ Bachelor</div><div style={{ fontSize:13, color:'#c890b8' }}>{animal.femaleBachelor||'—'}</div></div>
          </div>
        </Sec>

        {/* REPRODUCTION */}
        <Sec title="Reproduction" accent={accent}>
          {animal.reproductionRate && <div style={{ marginBottom:8 }}><span style={{ color:REPRO_COLOR[animal.reproductionRate]||'#7a9460', fontWeight:700, fontSize:14 }}>{animal.reproductionRate}</span></div>}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
            <Row label="Maturity"        value={animal.maturity}       unit="yrs" />
            <Row label="Sterility"       value={animal.sterility}      unit={typeof animal.sterility==='number'?'yrs':''} />
            <Row label="Incubation"      value={animal.incubation}     unit="mo" />
            <Row label="Interbirth"      value={animal.interbirth}     unit="mo" />
            <Row label="Life Expectancy" value={animal.lifeExpectancy} unit="yrs" />
          </div>
        </Sec>

        {/* COMPATIBILITY */}
        {compatibility.length>0 && (
          <Sec title="Interspecies Compatibility" accent={accent}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {compatibility.map(c=><Chip key={c} label={c} bg="#0a1e10" border="#1a3020" color="#6ab87a"/>)}
            </div>
          </Sec>
        )}
      </div>
    </div>
  );
}

// ── Filters panel (shared between mobile drawer and desktop sidebar) ─────────
function Filters({ values, setters, onClear, count, total }) {
  const { search, filterStatus, filterType, filterContinent, filterBiome, filterClass, filterOrder, filterAppeal } = values;
  const sel = { background:'#111a0f', border:'1px solid #2e4028', borderRadius:6, padding:'6px 9px', color:'#5a7050', fontSize:12, outline:'none', width:'100%' };
  const activeFilters = [filterStatus,filterType,filterContinent,filterBiome,filterClass,filterOrder,filterAppeal>0?'yes':''].filter(Boolean).length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
      <div style={{ position:'relative' }}>
        <Search size={13} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#5a7050' }} />
        <input value={search} onChange={e=>setters.setSearch(e.target.value)} placeholder="Search name, latin, region…"
          style={{ width:'100%', background:'#111a0f', border:'1px solid #2e4028', borderRadius:6, padding:'7px 10px 7px 26px', color:'#c8d8a8', fontSize:12, boxSizing:'border-box', outline:'none' }} />
      </div>
      <select value={filterStatus} onChange={e=>setters.setFilterStatus(e.target.value)} style={sel}>
        <option value="">All statuses</option>
        {Object.keys(IUCN_COLOR).map(s=><option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filterType} onChange={e=>setters.setFilterType(e.target.value)} style={sel}>
        <option value="">All types</option>
        {['Habitat','Exhibit','Aviary','Aquarium'].map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      <select value={filterContinent} onChange={e=>setters.setFilterContinent(e.target.value)} style={sel}>
        <option value="">All continents</option>
        {ALL_CONTINENTS.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filterBiome} onChange={e=>setters.setFilterBiome(e.target.value)} style={sel}>
        <option value="">All biomes</option>
        {ALL_BIOMES.map(b=><option key={b} value={b}>{b}</option>)}
      </select>
      <select value={filterClass} onChange={e=>setters.setFilterClass(e.target.value)} style={sel}>
        <option value="">All classes</option>
        {ALL_CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filterOrder} onChange={e=>setters.setFilterOrder(e.target.value)} style={sel}>
        <option value="">All orders</option>
        {ALL_ORDERS.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
      <select value={filterAppeal} onChange={e=>setters.setFilterAppeal(+e.target.value)} style={sel}>
        {APPEAL_TIERS.map((t,i)=><option key={i} value={i}>{t.label}</option>)}
      </select>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, color:'#3a5030' }}>{count} of {total} animals</span>
        {activeFilters>0 && <button onClick={onClear} style={{ background:'none', border:'none', color:'#7a9460', fontSize:11, cursor:'pointer', padding:0 }}>Clear {activeFilters} filter{activeFilters>1?'s':''}</button>}
      </div>
    </div>
  );
}

export default function Zoopedia({ theme, onOpenBuilder, isModal, onClose }) {
  const accent = theme?.accent||'#0f9a6d';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [filterType, setFilterType]         = useState('');
  const [filterContinent, setFilterContinent] = useState('');
  const [filterBiome, setFilterBiome]       = useState('');
  const [filterClass, setFilterClass]       = useState('');
  const [filterOrder, setFilterOrder]       = useState('');
  const [filterAppeal, setFilterAppeal]     = useState(0);
  const [selected, setSelected]             = useState(null);
  const [showFilters, setShowFilters]       = useState(false);
  // Mobile view: 'list' | 'detail'
  const [mobileView, setMobileView]         = useState('list');

  const clearFilters = () => { setFilterStatus(''); setFilterType(''); setFilterContinent(''); setFilterBiome(''); setFilterClass(''); setFilterOrder(''); setFilterAppeal(0); setSearch(''); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PZ1_ZOOPEDIA.filter(a => {
      if (q && !a.name?.toLowerCase().includes(q) && !a.genus?.toLowerCase().includes(q) && !a.species?.toLowerCase().includes(q) && !a.regions?.toLowerCase().includes(q)) return false;
      if (filterStatus && a.conservationStatus!==filterStatus) return false;
      if (filterType && a.type!==filterType) return false;
      if (filterContinent && !(a.continents||'').includes(filterContinent)) return false;
      if (filterBiome && !(a.biomes||'').includes(filterBiome)) return false;
      if (filterClass && a.class_!==filterClass) return false;
      if (filterOrder && a.order!==filterOrder) return false;
      if (filterAppeal>0) { const t=APPEAL_TIERS[filterAppeal]; const ap=Number(a.appeal)||0; if(ap<t.min||ap>t.max) return false; }
      return true;
    });
  }, [search,filterStatus,filterType,filterContinent,filterBiome,filterClass,filterOrder,filterAppeal]);

  const selectedAnimal = selected ? PZ1_ZOOPEDIA_MAP[selected] : null;

  const filterSetters = { setSearch, setFilterStatus, setFilterType, setFilterContinent, setFilterBiome, setFilterClass, setFilterOrder, setFilterAppeal };

  const handleSelect = (name) => { setSelected(name); setMobileView('detail'); };
  const handleBack   = () => { setMobileView('list'); setSelected(null); };

  // Container — full screen when modal
  const containerStyle = isModal
    ? { position:'fixed', inset:0, zIndex:600, background:'#0a0d09', display:'flex', flexDirection:'column', overflow:'hidden' }
    : { height:'calc(100vh - 110px)', display:'flex', flexDirection:'column', overflow:'hidden' };

  return (
    <div style={containerStyle}>
      {/* Modal header (when opened as overlay) */}
      {isModal && (
        <div style={{ background:accent, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:16, color:'#fff' }}>📖 Zoopedia</div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, padding:'5px 10px', color:'#fff', cursor:'pointer', fontSize:13 }}>✕ Close</button>
        </div>
      )}

      {/* Desktop: two-column. Mobile: single-column with view switching */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>

        {/* ── LEFT: filters + list ── Hidden on mobile when viewing detail */}
        <div style={{
          width:260, flexShrink:0, borderRight:'1px solid #1e2a18',
          display:'flex', flexDirection:'column', overflow:'hidden',
          // On mobile (narrow): show only when mobileView==='list'
        }} className="zoo-left-panel">
          <style>{`
            @media (max-width: 640px) {
              .zoo-left-panel { width: 100% !important; display: ${mobileView==='list'?'flex':'none'} !important; border-right: none !important; }
              .zoo-right-panel { display: ${mobileView==='detail'?'flex':'none'} !important; width: 100% !important; }
            }
          `}</style>

          {/* Filter toggle header */}
          <div style={{ padding:'10px 12px', borderBottom:'1px solid #1a2218', display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
            <div style={{ position:'relative', flex:1 }}>
              <Search size={13} style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', color:'#5a7050' }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                style={{ width:'100%', background:'#0d1410', border:'1px solid #2e4028', borderRadius:6, padding:'6px 10px 6px 26px', color:'#c8d8a8', fontSize:13, boxSizing:'border-box', outline:'none' }} />
            </div>
            <button onClick={() => setShowFilters(v=>!v)}
              style={{ background:showFilters?accent:'#111a0f', border:`1px solid ${showFilters?accent:'#2e4028'}`, borderRadius:6, padding:'6px 10px', color:showFilters?'#fff':'#7a9460', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4, flexShrink:0, whiteSpace:'nowrap' }}>
              <SlidersHorizontal size={13} /> Filters
            </button>
          </div>

          {/* Collapsible filter drawer */}
          {showFilters && (
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #1a2218', flexShrink:0, background:'#0a120a' }}>
              {[
                ['All statuses', filterStatus, setFilterStatus, Object.keys(IUCN_COLOR)],
                ['All types', filterType, setFilterType, ['Habitat','Exhibit','Aviary','Aquarium']],
                ['All continents', filterContinent, setFilterContinent, ALL_CONTINENTS],
                ['All biomes', filterBiome, setFilterBiome, ALL_BIOMES],
                ['All classes', filterClass, setFilterClass, ALL_CLASSES],
                ['All orders', filterOrder, setFilterOrder, ALL_ORDERS],
              ].map(([placeholder, val, setter, opts]) => (
                <select key={placeholder} value={val} onChange={e=>setter(e.target.value)}
                  style={{ width:'100%', background:'#111a0f', border:'1px solid #2e4028', borderRadius:5, padding:'5px 8px', color:val?'#c8d8a8':'#5a7050', fontSize:12, outline:'none', marginBottom:5 }}>
                  <option value="">{placeholder}</option>
                  {opts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              ))}
              <select value={filterAppeal} onChange={e=>setFilterAppeal(+e.target.value)}
                style={{ width:'100%', background:'#111a0f', border:'1px solid #2e4028', borderRadius:5, padding:'5px 8px', color:'#c8d8a8', fontSize:12, outline:'none', marginBottom:5 }}>
                {APPEAL_TIERS.map((t,i)=><option key={i} value={i}>{t.label}</option>)}
              </select>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11 }}>
                <span style={{ color:'#3a5030' }}>{filtered.length} of {PZ1_ZOOPEDIA.length}</span>
                <button onClick={clearFilters} style={{ background:'none', border:'none', color:'#7a9460', cursor:'pointer', fontSize:11, padding:0 }}>Clear all</button>
              </div>
            </div>
          )}

          {/* Animal list */}
          <div style={{ flex:1, overflowY:'auto', padding:'4px' }}>
            {filtered.map(a => {
              const isSel = selected===a.name;
              const sc    = IUCN_COLOR[a.conservationStatus];
              return (
                <button key={a.name} onClick={() => handleSelect(a.name)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 8px', background:isSel?`${accent}18`:'transparent', border:`1px solid ${isSel?accent:'transparent'}`, borderRadius:7, cursor:'pointer', textAlign:'left', marginBottom:2 }}>
                  <AnimalImage src={a.image} alt={a.name} type={a.type} conservationStatus={a.conservationStatus}
                    style={{ width:32, height:32, borderRadius:5, flexShrink:0, fontSize:'1rem' }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:isSel?'#e0ecc0':'#c8d8a8', fontWeight:isSel?600:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize:10, color:sc||'#3a5030', fontWeight:600 }}>{IUCN_SHORT[a.conservationStatus]||'?'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: animal card ── */}
        <div style={{ flex:1, overflowY:'auto', padding:'0' }} className="zoo-right-panel">
          {selectedAnimal
            ? <AnimalCard animal={selectedAnimal} theme={theme} onOpenBuilder={onOpenBuilder} onBack={mobileView==='detail' ? handleBack : null} />
            : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#3a5030', gap:10, padding:'2rem' }}>
                <div style={{ fontSize:44 }}>📖</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#5a7050' }}>Select an animal</div>
                <div style={{ fontSize:12, textAlign:'center' }}>{PZ1_ZOOPEDIA.length} animals · use filters to narrow down</div>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
