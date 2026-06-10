import { useState, useCallback, useMemo } from 'react';
import { WORLD_COUNTRIES, REGION_COLORS } from '../data/worldMap.js';
import { PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';

const W = 960, H = 500;

// Build a lookup: region → set of country names that appear in animal data
const REGION_ANIMAL_COUNTS = {};
PZ1_ZOOPEDIA.forEach(a => {
  if (!a.continents) return;
  a.continents.split(',').map(c => c.trim()).forEach(continent => {
    REGION_ANIMAL_COUNTS[continent] = (REGION_ANIMAL_COUNTS[continent] || 0) + 1;
  });
});

// Build per-country animal list using regions field
function getAnimalsForCountry(countryName) {
  const q = countryName.toLowerCase();
  return PZ1_ZOOPEDIA.filter(a => {
    if (!a.regions) return false;
    // Split by comma and check each region segment
    return a.regions.split(',').map(s => s.trim().toLowerCase()).some(r => r.includes(q) || q.includes(r));
  });
}

function getAnimalsForRegion(regionName) {
  return PZ1_ZOOPEDIA.filter(a => {
    if (!a.continents) return false;
    return a.continents.split(',').map(c => c.trim()).includes(regionName);
  });
}

const IUCN_COLOR = {
  'Least Concern':'#6ab87a','Near Threatened':'#9ab84a','Vulnerable':'#c8a030',
  'Endangered':'#c87030','Critically Endangered':'#c84040',
  'Extinct in the Wild':'#9060a0','Data Deficient':'#7a9460','Domesticated':'#4a9ab8',
};
const IUCN_SHORT = {
  'Least Concern':'LC','Near Threatened':'NT','Vulnerable':'VU',
  'Endangered':'EN','Critically Endangered':'CR','Extinct in the Wild':'EW',
  'Data Deficient':'DD','Domesticated':'DOM',
};

export default function WorldMap({ theme, onOpenBuilder, onSelectAnimal }) {
  const accent = theme?.accent || '#0f9a6d';
  const [hovered, setHovered]         = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion]   = useState(null);
  const [viewMode, setViewMode]       = useState('region'); // 'region' | 'country'
  const [tooltip, setTooltip]         = useState(null);    // {x, y, name, region, count}

  const handleCountryEnter = useCallback((e, country) => {
    setHovered(country.name);
    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
    const cx = e.clientX - svgRect.left;
    const cy = e.clientY - svgRect.top;
    const regionAnimals = getAnimalsForRegion(country.region).length;
    setTooltip({ x: cx, y: cy, name: country.name, region: country.region, count: regionAnimals });
  }, []);

  const handleCountryLeave = useCallback(() => {
    setHovered(null);
    setTooltip(null);
  }, []);

  const handleCountryClick = useCallback((country) => {
    if (country.region === 'Unknown') return;
    setSelectedCountry(country.name);
    setSelectedRegion(country.region);
    setViewMode('country');
  }, []);

  const handleRegionClick = useCallback((region) => {
    setSelectedRegion(region);
    setSelectedCountry(null);
    setViewMode('region');
  }, []);

  const clearSelection = () => {
    setSelectedCountry(null);
    setSelectedRegion(null);
  };

  // Animals to show in sidebar
  const sidebarAnimals = useMemo(() => {
    if (!selectedRegion) return [];
    if (viewMode === 'country' && selectedCountry) {
      const byCountry = getAnimalsForCountry(selectedCountry);
      return byCountry.length > 0 ? byCountry : getAnimalsForRegion(selectedRegion);
    }
    return getAnimalsForRegion(selectedRegion);
  }, [selectedRegion, selectedCountry, viewMode]);

  const regionColors = REGION_COLORS;

  // Region summary for legend
  const regions = Object.keys(REGION_COLORS).filter(r => r !== 'Unknown');

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, height:'100%', flex:1, minHeight:0 }}>

      {/* Region legend / filter pills */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', padding:'10px 0', borderBottom:'1px solid #1e2a18', flexShrink:0 }}>
        <button onClick={clearSelection}
          style={{ background: !selectedRegion ? accent : '#111a0f', border:`1px solid ${!selectedRegion ? accent : '#2e4028'}`, borderRadius:20, padding:'4px 12px', color: !selectedRegion ? '#fff' : '#5a7050', fontSize:12, cursor:'pointer', fontWeight: !selectedRegion ? 700 : 400 }}>
          🌍 All Regions
        </button>
        {regions.map(r => {
          const rc = regionColors[r];
          const count = REGION_ANIMAL_COUNTS[r] || 0;
          const isActive = selectedRegion === r;
          return (
            <button key={r} onClick={() => handleRegionClick(r)}
              style={{ background: isActive ? rc.fill : '#111a0f', border:`1px solid ${isActive ? rc.label : '#2e4028'}`, borderRadius:20, padding:'4px 12px', color: isActive ? rc.label : '#5a7050', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontWeight: isActive ? 700 : 400 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:rc.label, opacity: isActive ? 1 : 0.5 }} />
              {r}
              {count > 0 && <span style={{ color: isActive ? rc.label : '#3a5030', fontSize:10 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Main content: map + sidebar */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', gap:0 }}>

        {/* ── SVG Map ── */}
        <div style={{ flex:1, position:'relative', overflow:'hidden', background:'#080d08' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width:'100%', height:'100%', display:'block' }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Ocean background */}
            <rect x={0} y={0} width={W} height={H} fill="#0a1018" />

            {/* Grid lines (parallels + meridians) */}
            {[-60,-30,0,30,60].map(lat => {
              const y = (90 - lat) / 180 * H;
              return <line key={`lat${lat}`} x1={0} y1={y} x2={W} y2={y} stroke="#1a2828" strokeWidth={0.5} />;
            })}
            {[-120,-60,0,60,120].map(lon => {
              const x = (lon + 180) / 360 * W;
              return <line key={`lon${lon}`} x1={x} y1={0} x2={x} y2={H} stroke="#1a2828" strokeWidth={0.5} />;
            })}

            {/* Countries */}
            {WORLD_COUNTRIES.map(country => {
              const rc = regionColors[country.region] || regionColors['Unknown'];
              const isHovered  = hovered === country.name;
              const isSelected = selectedCountry === country.name;
              const isRegionSelected = selectedRegion === country.region;
              const isDimmed = selectedRegion && country.region !== selectedRegion;

              let fill = rc.fill;
              if (isSelected) fill = rc.active;
              else if (isHovered) fill = rc.hover;
              else if (isRegionSelected) fill = rc.hover;
              else if (isDimmed) fill = '#0f1410';

              return (
                <path
                  key={country.name}
                  d={country.path}
                  fill={fill}
                  stroke={isSelected ? rc.label : (isDimmed ? '#141a14' : '#1e2e1e')}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                  style={{ cursor: country.region !== 'Unknown' ? 'pointer' : 'default', transition:'fill 0.15s' }}
                  onMouseEnter={e => handleCountryEnter(e, country)}
                  onMouseLeave={handleCountryLeave}
                  onClick={() => handleCountryClick(country)}
                />
              );
            })}

            {/* Region labels */}
            {[
              { region:'Africa',                   x:480, y:290 },
              { region:'Europe',                   x:480, y:140 },
              { region:'North America',            x:160, y:175 },
              { region:'South & Central America',  x:235, y:340 },
              { region:'Asia',                     x:660, y:175 },
              { region:'Oceania',                  x:760, y:370 },
              { region:'Antarctica',               x:480, y:480 },
            ].map(({ region, x, y }) => {
              const rc = regionColors[region];
              const isActive = selectedRegion === region;
              return (
                <text key={region} x={x} y={y} textAnchor="middle"
                  fontSize={isActive ? 11 : 9} fontWeight={isActive ? 700 : 400}
                  fill={isActive ? rc.label : `${rc.label}88`}
                  style={{ pointerEvents:'none', userSelect:'none', letterSpacing:'0.05em', textTransform:'uppercase' }}>
                  {region}
                </text>
              );
            })}

            {/* Tooltip */}
            {tooltip && (
              <g style={{ pointerEvents:'none' }}>
                <rect
                  x={Math.min(tooltip.x + 8, W - 160)}
                  y={Math.max(tooltip.y - 40, 4)}
                  width={150} height={42} rx={5}
                  fill="#0d1a0d" stroke={accent} strokeWidth={1} opacity={0.95}
                />
                <text x={Math.min(tooltip.x + 14, W - 154)} y={Math.max(tooltip.y - 22, 18)}
                  fontSize={12} fontWeight={700} fill="#c8d8a8">{tooltip.name}</text>
                <text x={Math.min(tooltip.x + 14, W - 154)} y={Math.max(tooltip.y - 8, 32)}
                  fontSize={10} fill="#7a9460">{tooltip.region} · {tooltip.count} species</text>
              </g>
            )}
          </svg>

          {/* Selection crumb */}
          {selectedRegion && (
            <div style={{ position:'absolute', top:8, left:8, background:'rgba(10,15,10,0.9)', border:`1px solid ${accent}`, borderRadius:8, padding:'6px 12px', fontSize:12, color:'#c8d8a8', display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ color:accent, fontWeight:700 }}>{selectedRegion}</span>
              {selectedCountry && <><span style={{ color:'#3a5030' }}>›</span><span>{selectedCountry}</span></>}
              <button onClick={clearSelection} style={{ background:'none', border:'none', color:'#5a7050', cursor:'pointer', padding:0, fontSize:14, lineHeight:1 }}>×</button>
            </div>
          )}
        </div>

        {/* ── Sidebar: animal results ── */}
        <div style={{ width:260, flexShrink:0, borderLeft:'1px solid #1e2a18', display:'flex', flexDirection:'column', background:'#0a0d09', overflow:'hidden' }}>
          {!selectedRegion ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:10, padding:'1.5rem', color:'#3a5030', textAlign:'center' }}>
              <div style={{ fontSize:36 }}>🌍</div>
              <div style={{ fontSize:14, fontWeight:600, color:'#5a7050' }}>Click any country</div>
              <div style={{ fontSize:12, lineHeight:1.5 }}>or use the region pills above to filter species by location</div>
            </div>
          ) : (
            <>
              <div style={{ padding:'12px 14px', borderBottom:'1px solid #1e2a18', flexShrink:0 }}>
                <div style={{ fontWeight:700, color:'#c8d8a8', fontSize:14, marginBottom:2 }}>
                  {selectedCountry || selectedRegion}
                </div>
                <div style={{ fontSize:11, color:'#5a7050' }}>
                  {sidebarAnimals.length} species
                  {viewMode === 'country' && selectedCountry && getAnimalsForCountry(selectedCountry).length === 0
                    ? ' (showing full region)' : ''}
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                {sidebarAnimals.map(a => {
                  const sc = IUCN_COLOR[a.conservationStatus];
                  return (
                    <button key={a.name}
                      onClick={() => onSelectAnimal && onSelectAnimal(a.name)}
                      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'transparent', border:'none', borderBottom:'1px solid #111a0f', cursor:'pointer', textAlign:'left' }}>
                      <div style={{ width:36, height:36, borderRadius:6, flexShrink:0, overflow:'hidden', background:`${sc || '#2e4028'}18`, border:`1px solid ${sc || '#2e4028'}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem' }}>
                        {a.image
                          ? <img src={`/api/img?url=${encodeURIComponent(a.image)}`} alt={a.name}
                              style={{ width:'100%', height:'100%', objectFit:'cover' }}
                              onError={e => { e.target.style.display='none'; }}
                            />
                          : <span style={{fontSize:'1.2rem'}}>{a.type === 'Exhibit' ? '🦎' : a.type === 'Aquatic' ? '🐠' : a.type === 'Aviary' ? '🦜' : '🦁'}</span>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, color:'#c8d8a8', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                        <div style={{ display:'flex', gap:5, alignItems:'center', marginTop:2 }}>
                          <span style={{ fontSize:10, color:sc, fontWeight:700 }}>{IUCN_SHORT[a.conservationStatus] || '?'}</span>
                          {a.appeal && <span style={{ fontSize:10, color:'#5a7050' }}>★{Number(a.appeal).toLocaleString()}</span>}
                        </div>
                      </div>
                      {onOpenBuilder && (
                        <div style={{ fontSize:14, color:'#2e4028', flexShrink:0 }}>🏗️</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
