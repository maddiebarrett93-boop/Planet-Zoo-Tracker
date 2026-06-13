import { useState, useMemo } from 'react';

const SEGMENT = 4; // meters per wall segment in PZ

function calcFence(targetArea, ratio) {
  // ratio = width:height, e.g. 2 = twice as wide as tall
  // area = w * h, w = ratio * h => area = ratio * h^2 => h = sqrt(area/ratio)
  const h = Math.sqrt(targetArea / ratio);
  const w = ratio * h;
  return { w: Math.round(w), h: Math.round(h) };
}

function segmentsNeeded(meters) {
  return Math.ceil(meters / SEGMENT);
}

function EnclosurePreview({ w, h, maxW, scale = 1 }) {
  const CANVAS = 260;
  const maxDim = Math.max(w, h, maxW, 1);
  const px = (m) => (m / maxDim) * (CANVAS - 40);
  const pw = px(w);
  const ph = px(h);
  const pmw = px(maxW);
  const pmh = px((maxW / w) * h); // keep same ratio for max

  return (
    <svg width={CANVAS} height={CANVAS} style={{ display:'block', margin:'0 auto' }}>
      {/* Max capacity (dimmed) */}
      <rect
        x={(CANVAS - pmw) / 2} y={(CANVAS - pmh) / 2}
        width={pmw} height={pmh}
        fill="none" stroke="#2e4028" strokeWidth={1.5} strokeDasharray="6 3"
        rx={3}
      />
      <text x={CANVAS/2} y={(CANVAS - pmh)/2 - 4} textAnchor="middle" fontSize={9} fill="#3a5030">Max</text>

      {/* Min requirement (solid) */}
      <rect
        x={(CANVAS - pw) / 2} y={(CANVAS - ph) / 2}
        width={pw} height={ph}
        fill="rgba(88,103,63,0.15)" stroke="#58673f" strokeWidth={2}
        rx={3}
      />
      <text x={CANVAS/2} y={(CANVAS - ph)/2 - 4} textAnchor="middle" fontSize={9} fill="#7a9460">Min</text>

      {/* Dimensions */}
      <text x={CANVAS/2} y={(CANVAS + ph)/2 + 12} textAnchor="middle" fontSize={10} fill="#7a9460">
        {w}m × {h}m
      </text>
    </svg>
  );
}

export default function FenceDesigner({ animal, theme, adultCount }) {
  const accent = theme?.accent || '#0f9a6d';
  const [ratio, setRatio] = useState(1.5); // width:height
  const [customRatio, setCustomRatio] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const effectiveRatio = useCustom && customRatio ? +customRatio : ratio;

  const baseLand  = +(animal?.baseLand)  || 0;
  const addLand   = +(animal?.addLand)   || 0;
  const baseWater = +(animal?.baseWater) || 0;
  const addWater  = +(animal?.addWater)  || 0;
  const groupSize = animal?.groupSize || '';

  // Parse max group size from "6-500" → 500
  const parseMax = (str) => {
    if (!str) return 20;
    const m = String(str).match(/(\d+)\s*$/);
    return m ? +m[1] : 20;
  };
  const maxGroup = parseMax(groupSize);

  const minLand = baseLand + Math.max(0, (adultCount - 1)) * addLand;
  const maxLand = baseLand + Math.max(0, (maxGroup - 1)) * addLand;
  const minWater = baseWater ? baseWater + Math.max(0, (adultCount - 1)) * addWater : 0;
  const maxWater = baseWater ? baseWater + Math.max(0, (maxGroup - 1)) * addWater : 0;
  const totalMin = minLand + minWater;
  const totalMax = maxLand + maxWater;

  const minDims = useMemo(() => calcFence(totalMin, effectiveRatio), [totalMin, effectiveRatio]);
  const maxDims = useMemo(() => calcFence(totalMax, effectiveRatio), [totalMax, effectiveRatio]);

  const minSegsW = segmentsNeeded(minDims.w);
  const minSegsH = segmentsNeeded(minDims.h);
  const maxSegsW = segmentsNeeded(maxDims.w);
  const maxSegsH = segmentsNeeded(maxDims.h);

  const RATIOS = [
    { label: '1:1', value: 1, desc: 'Square' },
    { label: '4:3', value: 4/3, desc: 'Classic' },
    { label: '3:2', value: 1.5, desc: 'Standard' },
    { label: '16:9', value: 16/9, desc: 'Wide' },
    { label: '2:1', value: 2, desc: 'Long' },
    { label: '3:1', value: 3, desc: 'Strip' },
  ];

  if (!baseLand) return (
    <div style={{ padding:'1rem', textAlign:'center', color:'#5a7050', fontSize:13 }}>
      Select a species with known land requirements to use the fence designer.
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12, fontWeight:600 }}>
        Phase 2 — Fence Designer
      </div>
      <div style={{ fontSize:12, color:'#5a7050', marginBottom:14, lineHeight:1.5 }}>
        PZ uses 4m fence segments. Pick an aspect ratio to see how many segments you need per side.
      </div>

      {/* Ratio picker */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:11, color:'#7a9460', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.04em' }}>Enclosure Shape</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          {RATIOS.map(r => (
            <button key={r.label}
              onClick={() => { setRatio(r.value); setUseCustom(false); }}
              style={{ background: (!useCustom && Math.abs(ratio - r.value) < 0.01) ? `${accent}22` : '#111a0f', border:`1px solid ${(!useCustom && Math.abs(ratio - r.value) < 0.01) ? accent : '#2e4028'}`, borderRadius:7, padding:'5px 11px', cursor:'pointer', textAlign:'center' }}>
              <div style={{ fontSize:13, color:'#c8d8a8', fontWeight:600 }}>{r.label}</div>
              <div style={{ fontSize:10, color:'#5a7050' }}>{r.desc}</div>
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            style={{ background: useCustom ? `${accent}22` : '#111a0f', border:`1px solid ${useCustom ? accent : '#2e4028'}`, borderRadius:7, padding:'5px 11px', cursor:'pointer' }}>
            <div style={{ fontSize:13, color:'#c8d8a8', fontWeight:600 }}>Custom</div>
            <div style={{ fontSize:10, color:'#5a7050' }}>W:H ratio</div>
          </button>
        </div>
        {useCustom && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, color:'#7a9460' }}>Width ÷ Height =</span>
            <input type="number" min={0.2} max={10} step={0.1} value={customRatio}
              onChange={e => setCustomRatio(e.target.value)}
              placeholder="e.g. 2.5"
              style={{ background:'#0d1410', border:'1px solid #2e4028', borderRadius:6, padding:'5px 8px', color:'#c8d8a8', fontSize:13, width:80, outline:'none' }} />
          </div>
        )}
      </div>

      {/* Preview SVG */}
      <div style={{ background:'#0a120a', border:'1px solid #1e2a18', borderRadius:10, padding:'1rem', marginBottom:14 }}>
        <EnclosurePreview w={minDims.w} h={minDims.h} maxW={maxDims.w} />
        <div style={{ display:'flex', justifyContent:'center', gap:16, fontSize:11, color:'#5a7050', marginTop:8 }}>
          <span><span style={{ color:'#58673f' }}>━</span> Min ({adultCount} adults)</span>
          <span><span style={{ color:'#2e4028' }}>╌</span> Max ({maxGroup} adults)</span>
        </div>
      </div>

      {/* Segment counts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {/* Min */}
        <div style={{ background:'#0d1a0d', border:`1px solid ${accent}44`, borderRadius:9, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:accent, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8, fontWeight:700 }}>
            Minimum ({adultCount} adults)
          </div>
          <div style={{ fontSize:12, color:'#7a9460', marginBottom:6 }}>
            {minDims.w}m × {minDims.h}m = {totalMin.toLocaleString()} m²
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <div>
              <div style={{ fontSize:10, color:'#5a7050' }}>Width</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#c8d8a8' }}>{minSegsW}</div>
              <div style={{ fontSize:10, color:'#3a5030' }}>segments</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#5a7050' }}>Height</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#c8d8a8' }}>{minSegsH}</div>
              <div style={{ fontSize:10, color:'#3a5030' }}>segments</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#5a7050' }}>Perimeter</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#c8d8a8' }}>{2*(minSegsW+minSegsH)}</div>
              <div style={{ fontSize:10, color:'#3a5030' }}>total segs</div>
            </div>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:'#3a5030' }}>
            Actual area: {(minSegsW*SEGMENT * minSegsH*SEGMENT).toLocaleString()} m²
          </div>
        </div>

        {/* Max */}
        <div style={{ background:'#111a0f', border:'1px solid #2e4028', borderRadius:9, padding:'12px 14px' }}>
          <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8, fontWeight:700 }}>
            Max capacity ({maxGroup} adults)
          </div>
          <div style={{ fontSize:12, color:'#5a7050', marginBottom:6 }}>
            {maxDims.w}m × {maxDims.h}m = {totalMax.toLocaleString()} m²
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <div>
              <div style={{ fontSize:10, color:'#5a7050' }}>Width</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#7a9460' }}>{maxSegsW}</div>
              <div style={{ fontSize:10, color:'#3a5030' }}>segments</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#5a7050' }}>Height</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#7a9460' }}>{maxSegsH}</div>
              <div style={{ fontSize:10, color:'#3a5030' }}>segments</div>
            </div>
            <div>
              <div style={{ fontSize:10, color:'#5a7050' }}>Perimeter</div>
              <div style={{ fontSize:20, fontWeight:800, color:'#7a9460' }}>{2*(maxSegsW+maxSegsH)}</div>
              <div style={{ fontSize:10, color:'#3a5030' }}>total segs</div>
            </div>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:'#3a5030' }}>
            Actual area: {(maxSegsW*SEGMENT * maxSegsH*SEGMENT).toLocaleString()} m²
          </div>
        </div>
      </div>

      {/* Note about segment rounding */}
      <div style={{ marginTop:10, fontSize:11, color:'#3a5030', lineHeight:1.5 }}>
        Segments rounded up to nearest 4m. Actual enclosed area will be slightly larger than the minimum requirement.
        {animal?.fenceGrade && <span> Fence grade required: <span style={{ color:'#7a9460', fontWeight:600 }}>Grade {animal.fenceGrade}</span> ({animal.fenceHeight}m).</span>}
      </div>
    </div>
  );
}
