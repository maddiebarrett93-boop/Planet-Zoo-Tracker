import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { PZ1_ZOOPEDIA, PZ1_ZOOPEDIA_MAP } from '../data/pz1_zoopedia.js';

// ── Constants ────────────────────────────────────────────────────────────────
const IUCN_COLOR = {
  'Least Concern':         '#6ab87a',
  'Near Threatened':       '#9ab84a',
  'Vulnerable':            '#c8a030',
  'Endangered':            '#c87030',
  'Critically Endangered': '#c84040',
  'Extinct in the Wild':   '#9060a0',
  'Data Deficient':        '#7a9460',
  'Domesticated':          '#4a9ab8',
};
const IUCN_BG = {
  'Least Concern':         '#0a1e10',
  'Near Threatened':       '#121e08',
  'Vulnerable':            '#1e1a08',
  'Endangered':            '#1e1008',
  'Critically Endangered': '#1e0808',
  'Extinct in the Wild':   '#120810',
  'Data Deficient':        '#111a0f',
  'Domesticated':          '#081820',
};
const REPRO_COLOR = {
  'Very Easy': '#6ab87a', 'Easy': '#9ab84a',
  'Average': '#c8a030', 'Difficult': '#c87030', 'Very Difficult': '#c84040',
};
const TYPE_COLOR = {
  'Habitat': '#4a8aab', 'Exhibit': '#9060a0', 'Aviary': '#c8a030', 'Aquarium': '#2a7ab8',
};

function Chip({ label, bg, color, border }) {
  return (
    <span style={{ background: bg || '#1a2a14', border: `1px solid ${border || '#2e4028'}`, borderRadius: 12, padding: '2px 9px', fontSize: 11, color: color || '#7a9460', fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}>
      {label}
    </span>
  );
}

function Section({ title, accent, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ background: accent, borderRadius: 5, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, unit, mono }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #111a0f' }}>
      <span style={{ fontSize: 12, color: '#5a7050' }}>{label}</span>
      <span style={{ fontSize: 13, color: empty ? '#2a3a28' : '#c8d8a8', fontWeight: empty ? 400 : 500, fontFamily: mono ? 'monospace' : 'inherit' }}>
        {empty ? '—' : `${value}${unit ? ' ' + unit : ''}`}
      </span>
    </div>
  );
}

function SpaceRow({ label, base, add, unit = 'm²' }) {
  const empty = !base && !add;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #111a0f' }}>
      <span style={{ fontSize: 12, color: '#5a7050' }}>{label}</span>
      <span style={{ fontSize: 13, color: empty ? '#2a3a28' : '#c8d8a8', fontWeight: 500 }}>
        {empty ? '—' : `${base || 0} ${unit} +${add || 0} ${unit}/ea.`}
      </span>
    </div>
  );
}

function AnimalCard({ animal, theme }) {
  const accent = theme?.accent || '#0f9a6d';

  // Parse biomes/continents/compatibility into arrays
  const biomes = animal.biomes ? animal.biomes.split(',').map(b => b.trim()).filter(Boolean) : [];
  const continents = animal.continents ? animal.continents.split(',').map(c => c.trim()).filter(Boolean) : [];
  const compatibility = animal.compatibility ? animal.compatibility.split(',').map(c => c.trim()).filter(Boolean) : [];
  const latinName = [animal.genus, animal.species].filter(Boolean).join(' ');

  return (
    <div style={{ background: '#111a0f', border: '1px solid #2e4028', borderRadius: 12, overflow: 'hidden' }}>

      {/* Header with image */}
      <div style={{ position: 'relative', background: '#0a120a' }}>
        {animal.image && (
          <img src={animal.image} alt={animal.name}
            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block', opacity: 0.9 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}
        <div style={{ background: 'linear-gradient(to top, rgba(10,18,10,1) 0%, rgba(10,18,10,0.6) 60%, transparent 100%)', position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#e8f8d0', lineHeight: 1.1 }}>{animal.name}</div>
          {latinName && <div style={{ fontSize: 12, color: '#7a9460', fontStyle: 'italic', marginTop: 2 }}>{latinName}</div>}
        </div>
        {/* Type badge */}
        {animal.type && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: TYPE_COLOR[animal.type] || '#3a5a3a', color: '#fff', borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>
            {animal.type}
          </div>
        )}
      </div>

      {/* Status + appeal row */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', alignItems: 'center', borderBottom: '1px solid #1a2218', flexWrap: 'wrap' }}>
        {animal.conservationStatus && (
          <span style={{ background: IUCN_BG[animal.conservationStatus] || '#111a0f', color: IUCN_COLOR[animal.conservationStatus] || '#7a9460', border: `1px solid ${IUCN_COLOR[animal.conservationStatus] || '#2e4028'}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
            {animal.conservationStatus}
          </span>
        )}
        {animal.appeal && (
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#c8a830', fontWeight: 700 }}>
            ★ {Number(animal.appeal).toLocaleString()} appeal
          </span>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>

        {/* ── TAXONOMY ── */}
        {(animal.class_ || animal.order || animal.family) && (
          <Section title="Taxonomy" accent={accent}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              <Row label="Class"  value={animal.class_} />
              <Row label="Order"  value={animal.order} />
              <Row label="Family" value={animal.family} />
              <Row label="Genus"  value={animal.genus} />
            </div>
            <Row label="Species" value={animal.species} mono />
          </Section>
        )}

        {/* ── ORIGINS ── */}
        <Section title="Origins" accent={accent}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4 }}>Continents</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {continents.length > 0
                ? continents.map(c => <Chip key={c} label={c} />)
                : <span style={{ fontSize: 12, color: '#2a3a28' }}>—</span>}
            </div>
          </div>
          {animal.regions && (
            <div style={{ fontSize: 12, color: '#7a9460', lineHeight: 1.5, borderTop: '1px solid #111a0f', paddingTop: 6 }}>
              <span style={{ color: '#5a7050', marginRight: 6 }}>Regions:</span>{animal.regions}
            </div>
          )}
        </Section>

        {/* ── HABITAT ── */}
        <Section title="Habitat" accent={accent}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4 }}>Biomes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {biomes.length > 0
                ? biomes.map(b => <Chip key={b} label={b} bg="#0e1e18" border="#1a3828" color="#4ab890" />)
                : <span style={{ fontSize: 12, color: '#2a3a28' }}>—</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Row label="Fence Grade"  value={animal.fenceGrade ? `Grade ${animal.fenceGrade}` : null} />
            <Row label="Fence Height" value={animal.fenceHeight} unit="m" />
            <Row label="Climbable"    value={animal.climbable ? 'Yes ✓' : animal.climbable === false ? 'No' : null} />
            <Row label="Temperature"  value={animal.temperature} unit="°C" />
            <Row label="Humidity"     value={animal.humidity} unit="%" />
          </div>
          <SpaceRow label="Land Area"     base={animal.baseLand}    add={animal.addLand} />
          <SpaceRow label="Water Area"    base={animal.baseWater}   add={animal.addWater} />
          {(animal.baseClimbing || animal.addClimbing) && (
            <SpaceRow label="Climbing Area" base={animal.baseClimbing} add={animal.addClimbing} />
          )}
          {(animal.deepWaterMin || animal.addDeepWater) && (
            <SpaceRow label="Deep Water Depth" base={animal.deepWaterMin} add={animal.addDeepWater} unit="m" />
          )}
        </Section>

        {/* ── SOCIAL ── */}
        <Section title="Social" accent={accent}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 8px' }}>
            <div>
              <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4 }}>Group Size</div>
              <div style={{ fontSize: 14, color: '#c8d8a8', fontWeight: 700 }}>{animal.groupSize || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4 }}>M:F Ratio</div>
              <div style={{ fontSize: 14, color: '#c8d8a8', fontWeight: 700 }}>{animal.maleToFemale || '—'}</div>
            </div>
            <div />
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4 }}>♂ Bachelor</div>
              <div style={{ fontSize: 13, color: '#8ab0c8' }}>{animal.maleBachelor || '—'}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#5a7050', marginBottom: 4 }}>♀ Bachelor</div>
              <div style={{ fontSize: 13, color: '#c890b8' }}>{animal.femaleBachelor || '—'}</div>
            </div>
          </div>
        </Section>

        {/* ── REPRODUCTION ── */}
        <Section title="Reproduction" accent={accent}>
          {animal.reproductionRate && (
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: REPRO_COLOR[animal.reproductionRate] || '#7a9460', fontWeight: 700, fontSize: 14 }}>
                {animal.reproductionRate}
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Row label="Maturity"         value={animal.maturity}      unit="yrs" />
            <Row label="Sterility"        value={animal.sterility}     unit={typeof animal.sterility === 'number' ? 'yrs' : ''} />
            <Row label="Incubation"       value={animal.incubation}    unit="mo" />
            <Row label="Interbirth"       value={animal.interbirth}    unit="mo" />
            <Row label="Life Expectancy"  value={animal.lifeExpectancy} unit="yrs" />
          </div>
        </Section>

        {/* ── COMPATIBILITY ── */}
        {compatibility.length > 0 && (
          <Section title="Interspecies Enrichment Compatibility" accent={accent}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {compatibility.map(c => (
                <Chip key={c} label={c} bg="#0a1e10" border="#1a3020" color="#6ab87a" />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ── Main Zoopedia ────────────────────────────────────────────────────────────
const ALL_BIOMES = [...new Set(PZ1_ZOOPEDIA.flatMap(a => a.biomes ? a.biomes.split(',').map(b => b.trim()) : []).filter(Boolean))].sort();
const ALL_CONTINENTS = [...new Set(PZ1_ZOOPEDIA.flatMap(a => a.continents ? a.continents.split(',').map(c => c.trim()) : []).filter(Boolean))].sort();
const ALL_CLASSES = [...new Set(PZ1_ZOOPEDIA.map(a => a.class_).filter(Boolean))].sort();
const ALL_ORDERS = [...new Set(PZ1_ZOOPEDIA.map(a => a.order).filter(Boolean))].sort();
const APPEAL_TIER_FILTERS = [
  { label: 'Any Appeal', min: 0, max: Infinity },
  { label: 'Normal (0–1249)', min: 0, max: 1249 },
  { label: 'Bronze (1250–3124)', min: 1250, max: 3124 },
  { label: 'Silver (3125–5624)', min: 3125, max: 5624 },
  { label: 'Gold (5625+)', min: 5625, max: Infinity },
];

export default function Zoopedia({ theme, onOpenBuilder }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterContinent, setFilterContinent] = useState('');
  const [filterBiome, setFilterBiome] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterOrder, setFilterOrder] = useState('');
  const [filterAppeal, setFilterAppeal] = useState(0);
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PZ1_ZOOPEDIA.filter(a => {
      if (!q && !filterStatus && !filterType && !filterContinent && !filterBiome && !filterClass) return true;
      if (q && !a.name?.toLowerCase().includes(q)
            && !a.genus?.toLowerCase().includes(q)
            && !a.species?.toLowerCase().includes(q)
            && !a.regions?.toLowerCase().includes(q)) return false;
      if (filterStatus && a.conservationStatus !== filterStatus) return false;
      if (filterType && a.type !== filterType) return false;
      if (filterContinent && !(a.continents || '').includes(filterContinent)) return false;
      if (filterBiome && !(a.biomes || '').includes(filterBiome)) return false;
      if (filterClass && a.class_ !== filterClass) return false;
      if (filterOrder && a.order !== filterOrder) return false;
      if (filterAppeal > 0) {
        const tier = APPEAL_TIER_FILTERS[filterAppeal];
        const ap = Number(a.appeal) || 0;
        if (ap < tier.min || ap > tier.max) return false;
      }
      return true;
    });
  }, [search, filterStatus, filterType, filterContinent, filterBiome, filterClass, filterOrder, filterAppeal]);

  const selectedAnimal = selected ? PZ1_ZOOPEDIA_MAP[selected] : null;

  const selectStyle = { background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 9px', color: '#5a7050', fontSize: 12, outline: 'none', width: '100%' };

  return (
    <div style={{ display: 'flex', gap: 14, height: 'calc(100vh - 120px)', minHeight: 500, flexWrap: 'wrap' }}>

      {/* ── Left panel: list ── */}
      <div style={{ width: 250, minWidth: 200, flexShrink: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#5a7050' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, latin, region…"
            style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px 7px 26px', color: '#c8d8a8', fontSize: 12, boxSizing: 'border-box', outline: 'none' }} />
        </div>

        {/* Filters */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          {Object.keys(IUCN_COLOR).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          {['Habitat','Exhibit','Aviary','Aquarium'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterContinent} onChange={e => setFilterContinent(e.target.value)} style={selectStyle}>
          <option value="">All continents</option>
          {ALL_CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterBiome} onChange={e => setFilterBiome(e.target.value)} style={selectStyle}>
          <option value="">All biomes</option>
          {ALL_BIOMES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={selectStyle}>
          <option value="">All classes</option>
          {ALL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Count */}
        <select value={filterOrder} onChange={e => setFilterOrder(e.target.value)} style={selectStyle}>
          <option value="">All orders</option>
          {ALL_ORDERS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterAppeal} onChange={e => setFilterAppeal(+e.target.value)} style={selectStyle}>
          {APPEAL_TIER_FILTERS.map((t, i) => <option key={i} value={i}>{t.label}</option>)}
        </select>
        <div style={{ fontSize: 11, color: '#3a5030', textAlign: 'center' }}>{filtered.length} of {PZ1_ZOOPEDIA.length} animals</div>

        {/* Animal list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filtered.map(a => {
            const isSelected = selected === a.name;
            const sc = IUCN_COLOR[a.conservationStatus];
            return (
              <button key={a.name} onClick={() => setSelected(isSelected ? null : a.name)}
                style={{ background: isSelected ? (theme?.accentBg || '#071810') : 'transparent', border: `1px solid ${isSelected ? (theme?.accent || '#0f9a6d') : 'transparent'}`, borderRadius: 6, padding: '6px 9px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                {a.image
                  ? <img src={a.image} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
                  : <div style={{ width: 28, height: 28, borderRadius: 4, background: '#1a2818', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: isSelected ? '#e0ecc0' : '#c8d8a8', fontWeight: isSelected ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: sc || '#3a5030', fontWeight: 600 }}>{a.conservationStatus?.replace('Critically Endangered','CR').replace('Endangered','EN').replace('Vulnerable','VU').replace('Near Threatened','NT').replace('Least Concern','LC').replace('Data Deficient','DD') || '?'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: card ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selectedAnimal
          ? <AnimalCard animal={selectedAnimal} theme={theme} />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3a5030', gap: 10 }}>
              <div style={{ fontSize: 44 }}>📖</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#5a7050' }}>Select an animal</div>
              <div style={{ fontSize: 12 }}>{PZ1_ZOOPEDIA.length} animals · filter and search on the left</div>
            </div>
          )
        }
      </div>
    </div>
  );
}
