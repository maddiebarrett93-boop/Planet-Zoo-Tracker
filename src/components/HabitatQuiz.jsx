import { useState, useMemo } from 'react';
import { PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';
import { AnimalImage } from './AnimalImage.jsx';

const SPACE_BUCKETS = [
  { label: 'Small', sublabel: '< 1,000 m²', icon: '🏠', test: a => +a.baseLand > 0 && +a.baseLand < 1000 },
  { label: 'Medium', sublabel: '1,000–4,000 m²', icon: '🏟️', test: a => +a.baseLand >= 1000 && +a.baseLand <= 4000 },
  { label: 'Large', sublabel: '> 4,000 m²', icon: '🌍', test: a => +a.baseLand > 4000 },
];
const STYLE_BUCKETS = [
  { label: 'Aquatic Body', sublabel: 'Needs water space', icon: '🌊', test: a => +a.baseWater > 0 },
  { label: 'High Climbing', sublabel: 'Needs climbing area', icon: '🧗', test: a => +a.baseClimbing > 0 },
  { label: 'Standard Terrestrial', sublabel: 'Land only', icon: '🌿', test: a => !+a.baseWater && !+a.baseClimbing && +a.baseLand > 0 },
];
const SOCIAL_BUCKETS = [
  { label: 'Single Showcase', sublabel: 'Solitary / pairs', icon: '🦁', test: a => a.socialStructure === 'Solitary' || a.socialStructure === 'Pair Bond' },
  { label: 'Multi-Species', sublabel: 'Has compatible species', icon: '🐘🦓', test: a => a.compatibility && a.compatibility.length > 2 },
  { label: 'Large Group', sublabel: 'Gregarious herd', icon: '🐃', test: a => a.socialStructure === 'Gregarious' || a.socialStructure === 'Matrilineal' || a.socialStructure === 'Patrilineal' },
];

const IUCN_COLOR = {
  'Critically Endangered':'#c84040','Endangered':'#c87030','Vulnerable':'#c8a030',
  'Near Threatened':'#9ab84a','Least Concern':'#6ab87a',
};

export default function HabitatQuiz({ theme, onOpenBuilder }) {
  const accent = theme?.accent || '#0f9a6d';
  const [space, setSpace]   = useState(null);
  const [style, setStyle]   = useState(null);
  const [social, setSocial] = useState(null);
  const [results, setResults] = useState(null);

  const canRun = space !== null && style !== null && social !== null;

  const run = () => {
    const spaceBucket  = SPACE_BUCKETS[space];
    const styleBucket  = STYLE_BUCKETS[style];
    const socialBucket = SOCIAL_BUCKETS[social];

    const matches = PZ1_ZOOPEDIA.filter(a =>
      a.baseLand &&
      spaceBucket.test(a) &&
      styleBucket.test(a) &&
      socialBucket.test(a)
    );

    // Score by appeal descending, pick top 3
    const scored = matches
      .filter(a => a.type === 'Habitat' || !a.type)
      .sort((a, b) => (+b.appeal || 0) - (+a.appeal || 0));

    // Get diverse picks — try not to pick 3 of the same family
    const picked = [];
    const usedFamilies = new Set();
    for (const a of scored) {
      if (picked.length >= 3) break;
      if (!usedFamilies.has(a.family) || picked.length === 2) {
        picked.push(a);
        usedFamilies.add(a.family);
      }
    }
    // Fallback if not enough diverse
    if (picked.length < 3) {
      for (const a of scored) {
        if (picked.length >= 3) break;
        if (!picked.find(p => p.name === a.name)) picked.push(a);
      }
    }

    setResults(picked.length > 0 ? picked : null);
  };

  const reset = () => { setSpace(null); setStyle(null); setSocial(null); setResults(null); };

  const Pill = ({ label, sublabel, icon, active, onClick }) => (
    <button onClick={onClick} style={{
      background: active ? `${accent}22` : '#111a0f',
      border: `1px solid ${active ? accent : '#2e4028'}`,
      borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
      flex: 1, minWidth: 90, transition: 'all 0.15s',
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 13, color: active ? '#e0ecc0' : '#c8d8a8', fontWeight: active ? 700 : 500 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#5a7050', marginTop: 2 }}>{sublabel}</div>
    </button>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e0ecc0', marginBottom: 4 }}>🎯 Habitat Finder</div>
        <div style={{ fontSize: 13, color: '#5a7050' }}>Answer 3 questions to get tailored species recommendations.</div>
      </div>

      {!results ? (
        <>
          {/* Q1 */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 12, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
              1 · How much land space do you have?
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SPACE_BUCKETS.map((b, i) => <Pill key={b.label} {...b} active={space === i} onClick={() => setSpace(i)} />)}
            </div>
          </div>

          {/* Q2 */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: 12, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
              2 · What enclosure style are you building?
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STYLE_BUCKETS.map((b, i) => <Pill key={b.label} {...b} active={style === i} onClick={() => setStyle(i)} />)}
            </div>
          </div>

          {/* Q3 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 12, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontWeight: 600 }}>
              3 · What social dynamic are you targeting?
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SOCIAL_BUCKETS.map((b, i) => <Pill key={b.label} {...b} active={social === i} onClick={() => setSocial(i)} />)}
            </div>
          </div>

          <button onClick={run} disabled={!canRun}
            style={{ width: '100%', background: canRun ? accent : '#1a2818', border: `1px solid ${canRun ? accent : '#2e4028'}`, borderRadius: 8, padding: '12px', color: canRun ? '#fff' : '#3a5030', fontSize: 15, fontWeight: 700, cursor: canRun ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {canRun ? '🔍 Find Matches' : 'Select all 3 options above'}
          </button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, color: '#7a9460' }}>
              Top picks for your criteria:
            </div>
            <button onClick={reset} style={{ background: 'none', border: '1px solid #2e4028', borderRadius: 6, padding: '5px 12px', color: '#7a9460', cursor: 'pointer', fontSize: 12 }}>
              ← Try again
            </button>
          </div>

          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#5a7050' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤔</div>
              <div>No exact matches — try adjusting your criteria.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((a, i) => {
                const sc = IUCN_COLOR[a.conservationStatus] || '#7a9460';
                return (
                  <div key={a.name} style={{ background: '#111a0f', border: `1px solid ${i === 0 ? accent : '#2e4028'}`, borderRadius: 12, overflow: 'hidden' }}>
                    {i === 0 && (
                      <div style={{ background: accent, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>★ BEST MATCH</div>
                    )}
                    <div style={{ padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <AnimalImage src={a.image} alt={a.name} type={a.type} conservationStatus={a.conservationStatus}
                        style={{ width: 60, height: 60, borderRadius: 8, flexShrink: 0, fontSize: '1.8rem' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#e0ecc0', marginBottom: 2 }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: '#5a7050', fontStyle: 'italic', marginBottom: 6 }}>{a.genus} {a.species}</div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, marginBottom: 8 }}>
                          <span style={{ color: sc, fontWeight: 700 }}>{a.conservationStatus}</span>
                          {a.appeal && <span style={{ color: '#c8a830' }}>★ {Number(a.appeal).toLocaleString()}</span>}
                          {a.reproductionRate && <span style={{ color: '#7a9460' }}>{a.reproductionRate} repro</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                          {[
                            ['Land', `${a.baseLand}+${a.addLand}/ea.`, '#6ab87a'],
                            ['Water', a.baseWater > 0 ? `${a.baseWater}+${a.addWater}/ea.` : '—', '#4a8aab'],
                            ['Group', a.groupSize || '—', '#c8a030'],
                          ].map(([label, val, color]) => (
                            <div key={label} style={{ background: '#0a1208', borderRadius: 6, padding: '6px 8px' }}>
                              <div style={{ fontSize: 10, color: '#5a7050', marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 12, color, fontWeight: 600 }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {onOpenBuilder && (
                          <button onClick={() => onOpenBuilder(a.name)}
                            style={{ background: accent, border: 'none', borderRadius: 6, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            🏗️ Plan This Habitat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
