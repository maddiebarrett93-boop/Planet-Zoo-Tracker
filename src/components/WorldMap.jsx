import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { WORLD_COUNTRIES, REGION_COLORS } from '../data/worldMap.js';
import { PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';

const MAP_W = 960, MAP_H = 500;

// ── Data ──────────────────────────────────────────────────────────────────
const REGION_ANIMAL_COUNTS = {};
PZ1_ZOOPEDIA.forEach(a => {
  if (!a.continents) return;
  a.continents.split(',').map(c => c.trim()).forEach(c => {
    REGION_ANIMAL_COUNTS[c] = (REGION_ANIMAL_COUNTS[c] || 0) + 1;
  });
});

function getAnimalsForCountry(name) {
  const q = name.toLowerCase();
  return PZ1_ZOOPEDIA.filter(a => {
    if (!a.regions) return false;
    return a.regions.split(',').map(s => s.trim().toLowerCase()).some(r => r.includes(q) || q.includes(r));
  });
}
function getAnimalsForRegion(region) {
  return PZ1_ZOOPEDIA.filter(a =>
    a.continents && a.continents.split(',').map(c => c.trim()).includes(region)
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

export default function WorldMap({ theme, onSelectAnimal, onOpenBuilder }) {
  const accent = theme?.accent || '#0f9a6d';
  const containerRef = useRef(null);

  // Pan/zoom: we track in "SVG coordinate space" via a viewBox offset + scale
  // This avoids the clamp bug with CSS transform
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: MAP_W, h: MAP_H });

  const dragRef = useRef(null);
  const lastTouchRef = useRef(null);

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedRegion, setSelectedRegion]   = useState(null);
  const [hovered, setHovered] = useState(null);

  // ── ViewBox helpers ─────────────────────────────────────────────────────
  // Clamp viewBox so we never go outside the map
  function clampVB(vb) {
    const x = Math.max(0, Math.min(MAP_W - vb.w, vb.x));
    const y = Math.max(0, Math.min(MAP_H - vb.h, vb.y));
    const w = Math.max(MAP_W / 6, Math.min(MAP_W, vb.w));
    const h = Math.max(MAP_H / 6, Math.min(MAP_H, vb.h));
    return { x, y, w, h };
  }

  // Convert a pixel delta on screen to SVG coordinate delta
  function pixelToSVG(dx, dy) {
    const el = containerRef.current;
    if (!el) return { dx: 0, dy: 0 };
    const rect = el.getBoundingClientRect();
    return {
      dx: (dx / rect.width)  * viewBox.w,
      dy: (dy / rect.height) * viewBox.h,
    };
  }

  // Convert screen point to SVG coordinate
  function screenToSVG(clientX, clientY) {
    const el = containerRef.current;
    if (!el) return { sx: 0, sy: 0 };
    const rect = el.getBoundingClientRect();
    return {
      sx: viewBox.x + ((clientX - rect.left) / rect.width)  * viewBox.w,
      sy: viewBox.y + ((clientY - rect.top)  / rect.height) * viewBox.h,
    };
  }

  function zoomAt(clientX, clientY, factor) {
    const { sx, sy } = screenToSVG(clientX, clientY);
    setViewBox(vb => {
      const newW = vb.w * factor;
      const newH = vb.h * factor;
      const newX = sx - (sx - vb.x) * factor;
      const newY = sy - (sy - vb.y) * factor;
      return clampVB({ x: newX, y: newY, w: newW, h: newH });
    });
  }

  const resetView = () => setViewBox({ x: 0, y: 0, w: MAP_W, h: MAP_H });

  // ── Mouse events ─────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    const { dx, dy } = pixelToSVG(dragRef.current.x - e.clientX, dragRef.current.y - e.clientY);
    dragRef.current = { x: e.clientX, y: e.clientY };
    setViewBox(vb => clampVB({ ...vb, x: vb.x + dx, y: vb.y + dy }));
  };
  const onMouseUp = () => { dragRef.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.15 : 0.87);
  };

  // ── Touch events ──────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTouchRef.current = null;
    } else if (e.touches.length === 2) {
      dragRef.current = null;
      lastTouchRef.current = [
        { x: e.touches[0].clientX, y: e.touches[0].clientY },
        { x: e.touches[1].clientX, y: e.touches[1].clientY },
      ];
    }
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      const { dx, dy } = pixelToSVG(dragRef.current.x - e.touches[0].clientX, dragRef.current.y - e.touches[0].clientY);
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setViewBox(vb => clampVB({ ...vb, x: vb.x + dx, y: vb.y + dy }));
    } else if (e.touches.length === 2 && lastTouchRef.current) {
      const t0 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const t1 = { x: e.touches[1].clientX, y: e.touches[1].clientY };
      const prev = lastTouchRef.current;
      const prevDist = Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y);
      const currDist = Math.hypot(t1.x - t0.x, t1.y - t0.y);
      if (prevDist > 0) {
        const factor = prevDist / currDist; // shrink viewBox = zoom in
        const midX = (t0.x + t1.x) / 2;
        const midY = (t0.y + t1.y) / 2;
        zoomAt(midX, midY, factor);
      }
      lastTouchRef.current = [t0, t1];
    }
  };
  const onTouchEnd = (e) => {
    if (e.touches.length === 0) { dragRef.current = null; lastTouchRef.current = null; }
    else if (e.touches.length === 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTouchRef.current = null;
    }
  };

  // ── Country click ─────────────────────────────────────────────────────
  const wasDragging = useRef(false);
  const onCountryMouseDown = () => { wasDragging.current = false; };
  const onCountryMouseMove = () => { wasDragging.current = true; };
  const onCountryClick = (country) => {
    if (wasDragging.current) return;
    if (country.region === 'Unknown') return;
    setSelectedCountry(country.name);
    setSelectedRegion(country.region);
  };

  const handleRegionClick = (r) => { setSelectedRegion(r); setSelectedCountry(null); };
  const clearSelection = () => { setSelectedCountry(null); setSelectedRegion(null); };

  // ── Animals ───────────────────────────────────────────────────────────
  const animals = useMemo(() => {
    if (!selectedRegion) return [];
    if (selectedCountry) {
      const byCountry = getAnimalsForCountry(selectedCountry);
      return byCountry.length > 0 ? byCountry : getAnimalsForRegion(selectedRegion);
    }
    return getAnimalsForRegion(selectedRegion);
  }, [selectedRegion, selectedCountry]);

  const regions = Object.keys(REGION_COLORS).filter(r => r !== 'Unknown');
  const vbStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;
  const isZoomed = viewBox.w < MAP_W * 0.95;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#080d08', overflow:'hidden' }}>

      {/* Region pills */}
      <div style={{ display:'flex', gap:5, padding:'7px 10px', borderBottom:'1px solid #1e2a18', flexShrink:0, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <button onClick={clearSelection} style={{ background:!selectedRegion?accent:'#111a0f', border:`1px solid ${!selectedRegion?accent:'#2e4028'}`, borderRadius:20, padding:'3px 11px', color:!selectedRegion?'#fff':'#5a7050', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>🌍 All</button>
        {regions.map(r => {
          const rc = REGION_COLORS[r];
          const isA = selectedRegion === r;
          return (
            <button key={r} onClick={() => handleRegionClick(r)}
              style={{ background:isA?rc.fill:'#111a0f', border:`1px solid ${isA?rc.label:'#2e4028'}`, borderRadius:20, padding:'3px 11px', color:isA?rc.label:'#5a7050', fontSize:11, fontWeight:isA?700:400, cursor:'pointer', flexShrink:0, display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:rc.label, opacity:isA?1:0.4 }} />
              {r} {REGION_ANIMAL_COUNTS[r] ? <span style={{ opacity:0.6 }}>{REGION_ANIMAL_COUNTS[r]}</span> : null}
            </button>
          );
        })}
      </div>

      {/* MAP CANVAS — flex:0 0 45%, overflow hidden, pointer events on wrapper */}
      <div
        ref={containerRef}
        style={{ flex:'0 0 45%', minHeight:200, position:'relative', overflow:'hidden', background:'#0a1018', cursor: dragRef.current ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      >
        {/* SVG fills container 100% × 100%, viewBox drives the pan/zoom */}
        <svg
          viewBox={vbStr}
          style={{ display:'block', width:'100%', height:'100%', touchAction:'none' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x={0} y={0} width={MAP_W} height={MAP_H} fill="#0a1018" />
          {/* Grid */}
          {[-60,-30,0,30,60].map(lat => <line key={lat} x1={0} y1={(90-lat)/180*MAP_H} x2={MAP_W} y2={(90-lat)/180*MAP_H} stroke="#1a2828" strokeWidth={0.5} />)}
          {[-120,-60,0,60,120].map(lon => <line key={lon} x1={(lon+180)/360*MAP_W} y1={0} x2={(lon+180)/360*MAP_W} y2={MAP_H} stroke="#1a2828" strokeWidth={0.5} />)}

          {/* Countries */}
          {WORLD_COUNTRIES.map(country => {
            const rc = REGION_COLORS[country.region] || REGION_COLORS['Unknown'];
            const isSel = selectedCountry === country.name;
            const isRegSel = selectedRegion === country.region;
            const isDimmed = selectedRegion && country.region !== selectedRegion;
            const fill = isSel ? rc.active : isRegSel ? rc.hover : isDimmed ? '#0c1010' : rc.fill;
            return (
              <path key={country.name} d={country.path} fill={fill}
                stroke={isSel ? rc.label : isDimmed ? '#111818' : '#1e2e1e'}
                strokeWidth={isSel ? 1.5 : 0.4}
                style={{ cursor: country.region !== 'Unknown' ? 'pointer' : 'default', transition:'fill 0.12s' }}
                onMouseEnter={() => setHovered(country.name)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={onCountryMouseDown}
                onMouseMove={onCountryMouseMove}
                onClick={() => onCountryClick(country)}
              />
            );
          })}

          {/* Region labels */}
          {[
            { r:'Africa', x:480, y:295 }, { r:'Europe', x:478, y:138 },
            { r:'North America', x:160, y:178 }, { r:'South & Central America', x:232, y:345 },
            { r:'Asia', x:658, y:178 }, { r:'Oceania', x:758, y:372 },
          ].map(({ r, x, y }) => {
            const rc = REGION_COLORS[r];
            const isA = selectedRegion === r;
            return (
              <text key={r} x={x} y={y} textAnchor="middle"
                fontSize={isA?11:8} fontWeight={isA?700:400}
                fill={isA?rc.label:`${rc.label}55`}
                style={{ pointerEvents:'none', userSelect:'none', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {r}
              </text>
            );
          })}
        </svg>

        {/* Zoom controls */}
        <div style={{ position:'absolute', bottom:8, right:8, display:'flex', flexDirection:'column', gap:3, zIndex:5 }}>
          {[
            ['+', () => { const el=containerRef.current; if(el){const r=el.getBoundingClientRect(); zoomAt(r.left+r.width/2,r.top+r.height/2,0.75);}}],
            ['−', () => { const el=containerRef.current; if(el){const r=el.getBoundingClientRect(); zoomAt(r.left+r.width/2,r.top+r.height/2,1.33);}}],
            ['↺', resetView],
          ].map(([label, action]) => (
            <button key={label} onClick={action}
              style={{ width:30, height:30, background:'rgba(8,13,8,0.88)', border:'1px solid #2e4028', borderRadius:5, color:'#c8d8a8', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Selection crumb */}
        {selectedRegion && (
          <div style={{ position:'absolute', top:8, left:8, background:'rgba(6,9,6,0.92)', border:`1px solid ${accent}`, borderRadius:7, padding:'5px 10px', fontSize:12, color:'#c8d8a8', display:'flex', gap:6, alignItems:'center', zIndex:5 }}>
            <span style={{ color:accent, fontWeight:700 }}>{selectedRegion}</span>
            {selectedCountry && <><span style={{ color:'#3a5030' }}>›</span><span>{selectedCountry}</span></>}
            <button onClick={clearSelection} style={{ background:'none', border:'none', color:'#5a7050', cursor:'pointer', padding:0, fontSize:16, lineHeight:1 }}>×</button>
          </div>
        )}

        {/* Hover label */}
        {hovered && !dragRef.current && (
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'rgba(6,9,6,0.88)', border:'1px solid #2e4028', borderRadius:6, padding:'4px 10px', fontSize:12, color:'#c8d8a8', pointerEvents:'none', zIndex:5, whiteSpace:'nowrap' }}>
            {hovered}
          </div>
        )}

        {/* Hint */}
        {!isZoomed && !selectedRegion && (
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', fontSize:11, color:'#2a3a28', pointerEvents:'none', whiteSpace:'nowrap' }}>
            Scroll/pinch to zoom · drag to pan · click a country
          </div>
        )}
      </div>

      {/* ANIMAL LIST — bottom half, independently scrollable */}
      <div style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', minHeight:0, borderTop:'1px solid #1e2a18' }}>
        {!selectedRegion ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:160, gap:8, color:'#3a5030', textAlign:'center', padding:'1.5rem' }}>
            <div style={{ fontSize:30 }}>🌍</div>
            <div style={{ fontSize:13, color:'#5a7050', fontWeight:600 }}>Tap a country or region pill</div>
            <div style={{ fontSize:12 }}>Native species appear here</div>
          </div>
        ) : (
          <>
            <div style={{ padding:'9px 14px', borderBottom:'1px solid #1a2218', display:'sticky', top:0, background:'#080d08', zIndex:2, display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:700, color:'#c8d8a8', fontSize:14 }}>{selectedCountry || selectedRegion}</span>
              <span style={{ color:'#5a7050', fontSize:12 }}>{animals.length} species</span>
              {selectedCountry && getAnimalsForCountry(selectedCountry).length === 0 && <span style={{ color:'#3a5030', fontSize:11 }}>(region fallback)</span>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:8, padding:'10px' }}>
              {animals.map(a => {
                const sc = IUCN_COLOR[a.conservationStatus];
                return (
                  <button key={a.name} onClick={() => onSelectAnimal && onSelectAnimal(a.name)}
                    style={{ background:'#111a0f', border:'1px solid #1e2a18', borderRadius:8, padding:'10px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{TYPE_ICON[a.type] || '🦁'}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, color:'#c8d8a8', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                      <div style={{ display:'flex', gap:5, marginTop:2 }}>
                        <span style={{ fontSize:10, color:sc, fontWeight:700 }}>{IUCN_SHORT[a.conservationStatus]||'?'}</span>
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
