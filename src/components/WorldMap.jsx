import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { WORLD_COUNTRIES, REGION_COLORS } from '../data/worldMap.js';
import { PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';

const W = 960, H = 500;

// ── Data helpers ──────────────────────────────────────────────────────────
const REGION_ANIMAL_COUNTS = {};
PZ1_ZOOPEDIA.forEach(a => {
  if (!a.continents) return;
  a.continents.split(',').map(c => c.trim()).forEach(c => {
    REGION_ANIMAL_COUNTS[c] = (REGION_ANIMAL_COUNTS[c] || 0) + 1;
  });
});

function getAnimalsForCountry(countryName) {
  const q = countryName.toLowerCase();
  return PZ1_ZOOPEDIA.filter(a => {
    if (!a.regions) return false;
    return a.regions.split(',').map(s => s.trim().toLowerCase()).some(r => r.includes(q) || q.includes(r));
  });
}
function getAnimalsForRegion(regionName) {
  return PZ1_ZOOPEDIA.filter(a =>
    a.continents && a.continents.split(',').map(c => c.trim()).includes(regionName)
  );
}

const IUCN_COLOR = {
  'Critically Endangered':'#c84040','Endangered':'#c87030','Vulnerable':'#c8a030',
  'Near Threatened':'#9ab84a','Least Concern':'#6ab87a',
  'Extinct in the Wild':'#9060a0','Data Deficient':'#7a9460','Domesticated':'#4a9ab8',
};
const IUCN_SHORT = {
  'Critically Endangered':'CR','Endangered':'EN','Vulnerable':'VU',
  'Near Threatened':'NT','Least Concern':'LC','Extinct in the Wild':'EW',
  'Data Deficient':'DD','Domesticated':'DOM',
};
const TYPE_ICON = { Habitat:'🦁', Exhibit:'🦎', Aviary:'🦜', Aquarium:'🐠' };

export default function WorldMap({ theme, onOpenBuilder, onSelectAnimal }) {
  const accent = theme?.accent || '#0f9a6d';
  const svgRef = useRef(null);

  // ── Pan / zoom state ──────────────────────────────────────────────────
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragStart = useRef(null);
  const lastTouches = useRef(null);

  // ── Selection state ───────────────────────────────────────────────────
  const [hovered, setHovered]               = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion]   = useState(null);
  const [tooltip, setTooltip]               = useState(null);

  // ── Pan helpers ───────────────────────────────────────────────────────
  const clampTransform = (t, containerW, containerH) => {
    const scaledW = W * t.scale;
    const scaledH = H * t.scale;
    const minX = Math.min(0, containerW - scaledW);
    const minY = Math.min(0, containerH - scaledH);
    return {
      scale: t.scale,
      x: Math.max(minX, Math.min(0, t.x)),
      y: Math.max(minY, Math.min(0, t.y)),
    };
  };

  const getContainerSize = () => {
    const el = svgRef.current?.parentElement;
    return el ? { w: el.clientWidth, h: el.clientHeight } : { w: 960, h: 500 };
  };

  // Mouse pan
  const onMouseDown = (e) => {
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };
  const onMouseMove = (e) => {
    if (!dragStart.current) return;
    const { w, h } = getContainerSize();
    setTransform(t => clampTransform({ ...t, x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }, w, h));
  };
  const onMouseUp = () => { dragStart.current = null; };

  // Touch pan + pinch zoom
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
      lastTouches.current = null;
    } else if (e.touches.length === 2) {
      dragStart.current = null;
      lastTouches.current = [
        { x: e.touches[0].clientX, y: e.touches[0].clientY },
        { x: e.touches[1].clientX, y: e.touches[1].clientY },
      ];
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    const { w, h } = getContainerSize();
    if (e.touches.length === 1 && dragStart.current) {
      setTransform(t => clampTransform({ ...t, x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y }, w, h));
    } else if (e.touches.length === 2 && lastTouches.current) {
      const t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const t1 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      const prevDist = Math.hypot(lastTouches.current[1].x - lastTouches.current[0].x, lastTouches.current[1].y - lastTouches.current[0].y);
      const currDist = Math.hypot(t1.x - t0.x, t1.y - t0.y);
      const ratio = currDist / prevDist;
      // Pivot around midpoint
      const midX = (t0.x + t1.x) / 2;
      const midY = (t0.y + t1.y) / 2;
      setTransform(prev => {
        const newScale = Math.max(1, Math.min(6, prev.scale * ratio));
        const scaleChange = newScale / prev.scale;
        const newX = midX - scaleChange * (midX - prev.x);
        const newY = midY - scaleChange * (midY - prev.y);
        return clampTransform({ scale: newScale, x: newX, y: newY }, w, h);
      });
      lastTouches.current = [t0, t1];
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) { dragStart.current = null; lastTouches.current = null; }
  };

  // Scroll-wheel zoom
  const onWheel = (e) => {
    e.preventDefault();
    const { w, h } = getContainerSize();
    const rect = svgRef.current?.getBoundingClientRect();
    const mx = e.clientX - (rect?.left || 0);
    const my = e.clientY - (rect?.top || 0);
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    setTransform(prev => {
      const newScale = Math.max(1, Math.min(6, prev.scale * delta));
      const ratio = newScale / prev.scale;
      const newX = mx - ratio * (mx - prev.x);
      const newY = my - ratio * (my - prev.y);
      return clampTransform({ scale: newScale, x: newX, y: newY }, w, h);
    });
  };

  const resetView = () => setTransform({ x: 0, y: 0, scale: 1 });

  // ── Country interaction ───────────────────────────────────────────────
  const handleCountryClick = useCallback((country) => {
    if (country.region === 'Unknown' || dragStart.current) return;
    setSelectedCountry(country.name);
    setSelectedRegion(country.region);
  }, []);

  const handleRegionClick = (region) => {
    setSelectedRegion(region);
    setSelectedCountry(null);
  };
  const clearSelection = () => { setSelectedCountry(null); setSelectedRegion(null); };

  // ── Animals to show ───────────────────────────────────────────────────
  const sidebarAnimals = useMemo(() => {
    if (!selectedRegion) return [];
    if (selectedCountry) {
      const byCountry = getAnimalsForCountry(selectedCountry);
      return byCountry.length > 0 ? byCountry : getAnimalsForRegion(selectedRegion);
    }
    return getAnimalsForRegion(selectedRegion);
  }, [selectedRegion, selectedCountry]);

  const regions = Object.keys(REGION_COLORS).filter(r => r !== 'Unknown');

  return (
    // Full-height flex column: map on top, list on bottom
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', background:'#080d08' }}>

      {/* ── Region pill bar ── */}
      <div style={{ display:'flex', gap:5, padding:'8px 10px', borderBottom:'1px solid #1e2a18', flexShrink:0, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <button onClick={clearSelection}
          style={{ background:!selectedRegion?accent:'#111a0f', border:`1px solid ${!selectedRegion?accent:'#2e4028'}`, borderRadius:20, padding:'4px 11px', color:!selectedRegion?'#fff':'#5a7050', fontSize:11, fontWeight:!selectedRegion?700:400, cursor:'pointer', flexShrink:0 }}>
          🌍 All
        </button>
        {regions.map(r => {
          const rc = REGION_COLORS[r];
          const count = REGION_ANIMAL_COUNTS[r] || 0;
          const isActive = selectedRegion === r;
          return (
            <button key={r} onClick={() => handleRegionClick(r)}
              style={{ background:isActive?rc.fill:'#111a0f', border:`1px solid ${isActive?rc.label:'#2e4028'}`, borderRadius:20, padding:'4px 11px', color:isActive?rc.label:'#5a7050', fontSize:11, fontWeight:isActive?700:400, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:rc.label, opacity:isActive?1:0.5 }} />
              {r} {count > 0 && <span style={{ opacity:0.7 }}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Map canvas (top half) ── */}
      <div style={{ flex:'0 0 45%', position:'relative', overflow:'hidden', background:'#0a1018', userSelect:'none' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        ref={svgRef}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W} height={H}
          style={{
            display:'block',
            transform:`translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
            transformOrigin:'0 0',
            width:'100%', height:'100%',
            cursor: dragStart.current ? 'grabbing' : 'grab',
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x={0} y={0} width={W} height={H} fill="#0a1018" />
          {/* Grid */}
          {[-60,-30,0,30,60].map(lat => {
            const y = (90-lat)/180*H;
            return <line key={lat} x1={0} y1={y} x2={W} y2={y} stroke="#1a2828" strokeWidth={0.5} />;
          })}
          {[-120,-60,0,60,120].map(lon => {
            const x = (lon+180)/360*W;
            return <line key={lon} x1={x} y1={0} x2={x} y2={H} stroke="#1a2828" strokeWidth={0.5} />;
          })}

          {/* Countries */}
          {WORLD_COUNTRIES.map(country => {
            const rc = REGION_COLORS[country.region] || REGION_COLORS['Unknown'];
            const isSel = selectedCountry === country.name;
            const isRegSel = selectedRegion === country.region;
            const isDimmed = selectedRegion && country.region !== selectedRegion;
            let fill = rc.fill;
            if (isSel) fill = rc.active;
            else if (isRegSel) fill = rc.hover;
            else if (isDimmed) fill = '#0c1010';
            return (
              <path key={country.name} d={country.path} fill={fill}
                stroke={isSel ? rc.label : isDimmed ? '#111818' : '#1e2e1e'}
                strokeWidth={isSel ? 1.5 : 0.4}
                style={{ cursor: country.region !== 'Unknown' ? 'pointer' : 'default', transition:'fill 0.1s' }}
                onMouseEnter={() => setHovered(country.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleCountryClick(country)}
              />
            );
          })}

          {/* Region labels */}
          {[
            { region:'Africa',                   x:480, y:295 },
            { region:'Europe',                   x:478, y:138 },
            { region:'North America',            x:160, y:178 },
            { region:'South & Central America',  x:232, y:345 },
            { region:'Asia',                     x:658, y:178 },
            { region:'Oceania',                  x:758, y:372 },
          ].map(({ region, x, y }) => {
            const rc = REGION_COLORS[region];
            const isA = selectedRegion === region;
            return (
              <text key={region} x={x} y={y} textAnchor="middle"
                fontSize={isA ? 11 : 8} fontWeight={isA ? 700 : 400}
                fill={isA ? rc.label : `${rc.label}66`}
                style={{ pointerEvents:'none', userSelect:'none', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {region}
              </text>
            );
          })}
        </svg>

        {/* Zoom controls */}
        <div style={{ position:'absolute', bottom:8, right:8, display:'flex', flexDirection:'column', gap:4 }}>
          {[
            { label:'+', action: () => setTransform(t => { const { w, h } = getContainerSize(); return clampTransform({ ...t, scale: Math.min(6, t.scale * 1.4) }, w, h); }) },
            { label:'−', action: () => setTransform(t => { const { w, h } = getContainerSize(); return clampTransform({ ...t, scale: Math.max(1, t.scale / 1.4) }, w, h); }) },
            { label:'↺', action: resetView },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              style={{ width:32, height:32, background:'rgba(10,18,10,0.85)', border:'1px solid #2e4028', borderRadius:6, color:'#c8d8a8', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Selected country crumb */}
        {selectedRegion && (
          <div style={{ position:'absolute', top:8, left:8, background:'rgba(8,13,8,0.9)', border:`1px solid ${accent}`, borderRadius:7, padding:'5px 10px', fontSize:12, color:'#c8d8a8', display:'flex', gap:6, alignItems:'center' }}>
            <span style={{ color:accent, fontWeight:700 }}>{selectedRegion}</span>
            {selectedCountry && <><span style={{ color:'#3a5030' }}>›</span><span>{selectedCountry}</span></>}
            <button onClick={clearSelection} style={{ background:'none', border:'none', color:'#5a7050', cursor:'pointer', padding:0, fontSize:16, lineHeight:1 }}>×</button>
          </div>
        )}

        {/* Pan hint */}
        {transform.scale === 1 && !selectedRegion && (
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#2e4028', pointerEvents:'none', whiteSpace:'nowrap' }}>
            Pinch to zoom · drag to pan
          </div>
        )}
      </div>

      {/* ── Animal list (bottom half) ── */}
      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', borderTop:'1px solid #1e2a18', minHeight:0 }}>
        {!selectedRegion ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', minHeight:160, gap:8, color:'#3a5030', textAlign:'center', padding:'1rem' }}>
            <div style={{ fontSize:32 }}>🌍</div>
            <div style={{ fontSize:13, color:'#5a7050', fontWeight:600 }}>Tap a country or region</div>
            <div style={{ fontSize:12 }}>Species native to that location appear here</div>
          </div>
        ) : (
          <>
            <div style={{ padding:'10px 14px', borderBottom:'1px solid #1e2a18', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, background:'#0a0d09', zIndex:2 }}>
              <div>
                <span style={{ fontWeight:700, color:'#c8d8a8', fontSize:14 }}>{selectedCountry || selectedRegion}</span>
                <span style={{ color:'#5a7050', fontSize:12, marginLeft:8 }}>{sidebarAnimals.length} species</span>
                {selectedCountry && getAnimalsForCountry(selectedCountry).length === 0 && (
                  <span style={{ color:'#3a5030', fontSize:11, marginLeft:4 }}>(full region shown)</span>
                )}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:8, padding:'10px' }}>
              {sidebarAnimals.map(a => {
                const sc = IUCN_COLOR[a.conservationStatus];
                return (
                  <button key={a.name}
                    onClick={() => onSelectAnimal && onSelectAnimal(a.name)}
                    style={{ background:'#111a0f', border:'1px solid #1e2a18', borderRadius:8, padding:'10px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{TYPE_ICON[a.type] || '🦁'}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, color:'#c8d8a8', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ display:'flex', gap:5, marginTop:2 }}>
                        <span style={{ fontSize:10, color:sc, fontWeight:700 }}>{IUCN_SHORT[a.conservationStatus] || '?'}</span>
                        {a.appeal && <span style={{ fontSize:10, color:'#5a7050' }}>★{Number(a.appeal).toLocaleString()}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
