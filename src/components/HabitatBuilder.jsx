import { useState, useMemo } from 'react';
import { X, Plus, Minus, ChevronRight, Check } from 'lucide-react';
import { PZ1_ZOOPEDIA_MAP, PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';
import { AnimalImage } from './AnimalImage.jsx';

function calcRequired(base, addPerExtra, adultCount) {
  if (!base) return 0;
  return base + Math.max(0, (adultCount - 1)) * (addPerExtra || 0);
}

function SpaceBar({ label, current, required, max, color }) {
  const pctReq = max > 0 ? Math.min(100, (required / max) * 100) : 0;
  const pctCur = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const ok = current >= required;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: '#7a9460' }}>{label}</span>
        <span style={{ color: ok ? '#6ab87a' : '#c84040', fontWeight: 700 }}>
          {current.toLocaleString()} / {required.toLocaleString()} m² {ok ? '✓' : '✗'}
        </span>
      </div>
      <div style={{ height: 8, background: '#1a2818', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pctReq}%`, background: color || '#4a8aab', opacity: 0.3, borderRadius: 4 }} />
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pctCur}%`, background: ok ? '#6ab87a' : '#c84040', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#3a5030', marginTop: 2 }}>
        <span>Min needed: {required.toLocaleString()} m²</span>
        <span>Species max: {max.toLocaleString()} m²</span>
      </div>
    </div>
  );
}

function Counter({ value, onChange, min = 0, max = 99 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ width: 26, height: 26, background: '#1a2818', border: '1px solid #2e4028', borderRadius: 5, color: '#7a9460', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
      <span style={{ minWidth: 24, textAlign: 'center', color: '#c8d8a8', fontWeight: 700, fontSize: 16 }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ width: 26, height: 26, background: '#1a2818', border: '1px solid #2e4028', borderRadius: 5, color: '#7a9460', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
    </div>
  );
}

export default function HabitatBuilder({ onClose, initialSpecies, onCommit, theme }) {
  const accent = theme?.accent || '#0f9a6d';

  const [species, setSpecies] = useState(initialSpecies || '');
  const [males, setMales] = useState(1);
  const [females, setFemales] = useState(1);
  const [companionSpecies, setCompanionSpecies] = useState('');
  const [compMales, setCompMales] = useState(0);
  const [compFemales, setCompFemales] = useState(0);
  const [hasConservationGoal, setHasConservationGoal] = useState(false);
  const [habitatName, setHabitatName] = useState('');
  const [searchQ, setSearchQ] = useState('');

  const animal = PZ1_ZOOPEDIA_MAP[species];
  const companion = PZ1_ZOOPEDIA_MAP[companionSpecies];

  const adultCount = males + females;
  const compAdultCount = compMales + compFemales;

  // Space calculations for primary species
  const primaryLandReq  = calcRequired(animal?.baseLand,  animal?.addLand,  adultCount);
  const primaryWaterReq = calcRequired(animal?.baseWater, animal?.addWater, adultCount);
  const primaryClimbReq = calcRequired(animal?.baseClimbing, animal?.addClimbing, adultCount);

  // Max capacity (using a representative large group — use groupSize max if available)
  const parseMax = str => { if (!str) return 20; const m = String(str).match(/(\d+)$/); return m ? +m[1] : 20; };
  const maxAdults = parseMax(animal?.groupSize);
  const primaryLandMax  = calcRequired(animal?.baseLand,  animal?.addLand,  maxAdults);
  const primaryWaterMax = calcRequired(animal?.baseWater, animal?.addWater, maxAdults);

  // Companion space
  const compLandReq  = companion ? calcRequired(companion.baseLand,  companion.addLand,  compAdultCount) : 0;
  const compWaterReq = companion ? calcRequired(companion.baseWater, companion.addWater, compAdultCount) : 0;

  // Total combined
  const totalLand  = primaryLandReq  + compLandReq;
  const totalWater = primaryWaterReq + compWaterReq;
  const totalClimb = primaryClimbReq;

  // Compatible species for companion picker
  const compatNames = animal?.compatibility ? animal.compatibility.split(',').map(s => s.trim()).filter(Boolean) : [];

  const filteredSpecies = useMemo(() => {
    const q = searchQ.toLowerCase();
    return PZ1_ZOOPEDIA.filter(a => !q || a.name.toLowerCase().includes(q)).slice(0, 80);
  }, [searchQ]);

  const commit = () => {
    if (!species || !animal) return;
    const name = habitatName || `${species} Habitat`;

    // Build habitat record
    const habitat = {
      id: Date.now(),
      name,
      species,
      regions: animal.continents ? [animal.continents.split(',')[0].trim()] : [],
      biomes: animal.biomes ? animal.biomes.split(',').map(b => b.trim()) : [],
      habitatType: animal.type || 'Habitats',
      actualLandSpace: totalLand,
      actualWaterSpace: totalWater,
      baseSpace: animal.baseLand || 0,
      perAdditionalSpace: animal.addLand || 0,
      adultCount,
      guestRating: '',
      features: companionSpecies ? `Cohabitation: ${companionSpecies}` : '',
      status: 'Planning',
      socialStructure: '',
      fenceGrade: animal.fenceGrade,
      fenceHeight: animal.fenceHeight,
      conservationGoal: hasConservationGoal,
      companions: companionSpecies ? [{ species: companionSpecies, males: compMales, females: compFemales }] : [],
    };

    // Auto-generate roster entries
    const rosterEntries = [];
    for (let i = 1; i <= males; i++) {
      rosterEntries.push({ id: Date.now() + i, species, name: `${species} ${i}`, sex: 'Male', ageStage: 'Adult', fertility: '', immunity: '', size: '', longevity: '', appeal: animal.appeal || '', mate: '', offspring: '', disposition: 'Keep', isAlpha: i === 1, isBonded: false, isOutsider: false, socialStructure: '' });
    }
    for (let i = 1; i <= females; i++) {
      rosterEntries.push({ id: Date.now() + 100 + i, species, name: `${species} ${males + i}`, sex: 'Female', ageStage: 'Adult', fertility: '', immunity: '', size: '', longevity: '', appeal: animal.appeal || '', mate: '', offspring: '', disposition: 'Keep', isAlpha: false, isBonded: false, isOutsider: false, socialStructure: '' });
    }
    // Companion roster entries
    if (companion && compAdultCount > 0) {
      for (let i = 1; i <= compMales; i++) {
        rosterEntries.push({ id: Date.now() + 200 + i, species: companionSpecies, name: `${companionSpecies} ${i}`, sex: 'Male', ageStage: 'Adult', fertility: '', immunity: '', size: '', longevity: '', appeal: companion.appeal || '', mate: '', offspring: '', disposition: 'Keep', isAlpha: false, isBonded: false, isOutsider: false, socialStructure: '' });
      }
      for (let i = 1; i <= compFemales; i++) {
        rosterEntries.push({ id: Date.now() + 300 + i, species: companionSpecies, name: `${companionSpecies} ${compMales + i}`, sex: 'Female', ageStage: 'Adult', fertility: '', immunity: '', size: '', longevity: '', appeal: companion.appeal || '', mate: '', offspring: '', disposition: 'Keep', isAlpha: false, isBonded: false, isOutsider: false, socialStructure: '' });
      }
    }

    onCommit({ habitat, rosterEntries, hasConservationGoal, species });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#111a0f', border: `1px solid ${accent}44`, borderRadius: 14, width: '100%', maxWidth: 860, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: accent, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>🏗️ Habitat Builder</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Predictive planning · auto-seeds Roster on commit</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '5px 8px', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: species + counts */}
          <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #1e2a18', padding: '14px', overflowY: 'auto' }}>

            {/* Species picker */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Primary Species</label>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search species…"
                style={{ width: '100%', background: '#0d1410', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 9px', color: '#c8d8a8', fontSize: 13, boxSizing: 'border-box', outline: 'none', marginBottom: 6 }} />
              <div style={{ height: 160, overflowY: 'auto', border: '1px solid #1e2a18', borderRadius: 6 }}>
                {filteredSpecies.map(a => (
                  <button key={a.name} onClick={() => { setSpecies(a.name); setSearchQ(''); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: species === a.name ? `${accent}22` : 'transparent', border: 'none', borderBottom: '1px solid #111a0f', cursor: 'pointer', textAlign: 'left' }}>
                    <AnimalImage src={a.image} alt={a.name} type={a.type} conservationStatus={a.conservationStatus} style={{ width: 28, height: 28, borderRadius: 4, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: species === a.name ? '#e0ecc0' : '#c8d8a8' }}>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {animal && (
              <>
                {/* Gender counts */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Adult Counts</label>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#8ab0c8' }}>♂ Males</span>
                    <Counter value={males} onChange={setMales} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#c890b8' }}>♀ Females</span>
                    <Counter value={females} onChange={setFemales} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#5a7050', borderTop: '1px solid #1a2218', paddingTop: 8 }}>
                    Total adults: <span style={{ color: '#c8d8a8', fontWeight: 700 }}>{adultCount}</span>
                    {animal.maleToFemale && <span style={{ marginLeft: 8, color: '#3a5030' }}>Rec. ratio: {animal.maleToFemale}</span>}
                  </div>
                </div>

                {/* Barrier specs */}
                <div style={{ background: '#0a1208', border: '1px solid #1e2a18', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Barrier Requirements</div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7050' }}>Grade</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#c8d8a8' }}>{animal.fenceGrade || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7050' }}>Height</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#c8d8a8' }}>{animal.fenceHeight ? `${animal.fenceHeight}m` : '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#5a7050' }}>Climbable</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: animal.climbable ? '#c84040' : '#6ab87a' }}>{animal.climbable ? '⚠ Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>

                {/* Companion species */}
                {compatNames.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Companion Species</label>
                    <select value={companionSpecies} onChange={e => setCompanionSpecies(e.target.value)}
                      style={{ width: '100%', background: '#0d1410', border: '1px solid #2e4028', borderRadius: 6, padding: '6px 9px', color: companionSpecies ? '#c8d8a8' : '#5a7050', fontSize: 13, outline: 'none', marginBottom: 8 }}>
                      <option value="">None</option>
                      {compatNames.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    {companion && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: '#8ab0c8' }}>♂ Males</span>
                          <Counter value={compMales} onChange={setCompMales} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: '#c890b8' }}>♀ Females</span>
                          <Counter value={compFemales} onChange={setCompFemales} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conservation toggle */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '10px', background: hasConservationGoal ? '#0a1e10' : '#0a120a', border: `1px solid ${hasConservationGoal ? accent : '#1e2a18'}`, borderRadius: 8 }}>
                  <input type="checkbox" checked={hasConservationGoal} onChange={e => setHasConservationGoal(e.target.checked)} style={{ accentColor: accent, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: '#c8d8a8', lineHeight: 1.4 }}>Active conservation goal for these animals?<br/><span style={{ color: '#5a7050', fontSize: 11 }}>Links habitat to Conservation tab on commit</span></span>
                </label>
              </>
            )}
          </div>

          {/* Right: space calculator */}
          <div style={{ flex: 1, padding: '14px 18px', overflowY: 'auto' }}>
            {!animal ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3a5030', gap: 10 }}>
                <div style={{ fontSize: 40 }}>🏕️</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Select a species to begin planning</div>
              </div>
            ) : (
              <>
                {/* Animal header */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #1a2218' }}>
                  <AnimalImage src={animal.image} alt={animal.name} type={animal.type} conservationStatus={animal.conservationStatus}
                    style={{ width: 72, height: 72, borderRadius: 10, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: '#e0ecc0' }}>{animal.name}</div>
                    <div style={{ fontSize: 11, color: '#5a7050', fontStyle: 'italic' }}>{animal.genus} {animal.species}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      {animal.appeal && <span style={{ color: '#c8a830', fontSize: 12, fontWeight: 700 }}>★ {Number(animal.appeal).toLocaleString()}</span>}
                      {animal.reproductionRate && <span style={{ color: '#7a9460', fontSize: 12 }}>{animal.reproductionRate} repro</span>}
                      {animal.temperature && <span style={{ color: '#7a9460', fontSize: 12 }}>{animal.temperature} °C</span>}
                    </div>
                  </div>
                </div>

                {/* Habitat name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 5 }}>Habitat Name</label>
                  <input value={habitatName} onChange={e => setHabitatName(e.target.value)} placeholder={`${species} Habitat`}
                    style={{ width: '100%', background: '#0d1410', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
                </div>

                {/* Space summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 18 }}>
                  {[
                    { label: 'Total Land', value: totalLand, unit: 'm²', color: '#6ab87a' },
                    { label: 'Total Water', value: totalWater, unit: 'm²', color: '#4a8aab', hide: totalWater === 0 },
                    { label: 'Climbing', value: totalClimb, unit: 'm²', color: '#c8a030', hide: totalClimb === 0 },
                  ].filter(s => !s.hide).map(s => (
                    <div key={s.label} style={{ background: '#0a1208', border: `1px solid ${s.color}44`, borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: '#5a7050', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: '#3a5030' }}>{s.unit} needed</div>
                    </div>
                  ))}
                </div>

                {/* Min vs Max comparison */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Space Planning — Min vs Max Capacity</div>
                  {animal.baseLand > 0 && (
                    <SpaceBar label="Land Area" current={totalLand} required={primaryLandReq} max={primaryLandMax} color="#6ab87a" />
                  )}
                  {animal.baseWater > 0 && (
                    <SpaceBar label="Water Area" current={totalWater} required={primaryWaterReq} max={primaryWaterMax} color="#4a8aab" />
                  )}
                </div>

                {/* Space breakdown */}
                <div style={{ background: '#0a1208', border: '1px solid #1e2a18', borderRadius: 8, padding: '12px 14px', marginBottom: 18, fontSize: 13 }}>
                  <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Calculation Breakdown</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a9460' }}>
                      <span>{species} base land</span><span style={{ color: '#c8d8a8' }}>{(animal.baseLand || 0).toLocaleString()} m²</span>
                    </div>
                    {adultCount > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a9460' }}>
                        <span>+{adultCount - 1} additional adults × {(animal.addLand || 0).toLocaleString()} m²</span>
                        <span style={{ color: '#c8d8a8' }}>{((adultCount - 1) * (animal.addLand || 0)).toLocaleString()} m²</span>
                      </div>
                    )}
                    {companion && compAdultCount > 0 && (
                      <>
                        <div style={{ borderTop: '1px solid #1a2218', paddingTop: 6, display: 'flex', justifyContent: 'space-between', color: '#7a9460' }}>
                          <span>{companionSpecies} base land</span><span style={{ color: '#c8d8a8' }}>{(companion.baseLand || 0).toLocaleString()} m²</span>
                        </div>
                        {compAdultCount > 1 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7a9460' }}>
                            <span>+{compAdultCount - 1} companion adults × {(companion.addLand || 0).toLocaleString()} m²</span>
                            <span style={{ color: '#c8d8a8' }}>{((compAdultCount - 1) * (companion.addLand || 0)).toLocaleString()} m²</span>
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ borderTop: '1px solid #2e4028', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span style={{ color: '#c8d8a8' }}>Total required</span><span style={{ color: accent }}>{totalLand.toLocaleString()} m²</span>
                    </div>
                  </div>
                </div>

                {/* Roster preview */}
                <div style={{ background: '#0a1208', border: '1px solid #1e2a18', borderRadius: 8, padding: '12px 14px', marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Roster Auto-Seed Preview</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Array.from({ length: males }, (_, i) => (
                      <span key={`m${i}`} style={{ background: '#0c1e30', border: '1px solid #1a4060', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#8ab0c8' }}>♂ {species} {i + 1}</span>
                    ))}
                    {Array.from({ length: females }, (_, i) => (
                      <span key={`f${i}`} style={{ background: '#200c28', border: '1px solid #40185a', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#c890b8' }}>♀ {species} {males + i + 1}</span>
                    ))}
                    {companion && Array.from({ length: compMales }, (_, i) => (
                      <span key={`cm${i}`} style={{ background: '#0a1e18', border: '1px solid #1a3828', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#4ab890' }}>♂ {companionSpecies} {i + 1}</span>
                    ))}
                    {companion && Array.from({ length: compFemales }, (_, i) => (
                      <span key={`cf${i}`} style={{ background: '#1e0c18', border: '1px solid #3a1828', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#b87090' }}>♀ {companionSpecies} {compMales + i + 1}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#3a5030', marginTop: 6 }}>{adultCount + compAdultCount} animals will be added to Roster with bare-bones info — edit details later</div>
                </div>

                {/* Commit button */}
                <button onClick={commit}
                  style={{ width: '100%', background: accent, border: 'none', borderRadius: 8, padding: '12px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Check size={16} /> Commit Enclosure to Zoo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
