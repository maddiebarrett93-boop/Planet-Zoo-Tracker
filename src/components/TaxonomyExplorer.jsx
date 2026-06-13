import { useState, useMemo } from 'react';
import { PZ1_ZOOPEDIA } from '../data/pz1_zoopedia.js';
import { AnimalImage } from './AnimalImage.jsx';

// ── Taxonomy hierarchy explainer ──────────────────────────────────────────
const LEVELS = [
  { rank:'Kingdom',  example:'Animalia',   desc:'All animals — multicellular organisms that eat other organisms.' },
  { rank:'Phylum',   example:'Chordata',   desc:'Animals with a nerve cord. Includes all vertebrates.' },
  { rank:'Class',    example:'Mammalia',   desc:'Warm-blooded, hair-bearing animals that nurse young with milk.' },
  { rank:'Order',    example:'Carnivora',  desc:'A grouping of families sharing a common evolutionary ancestor.' },
  { rank:'Family',   example:'Felidae',    desc:'The tightest grouping above genus — e.g. all cats.' },
  { rank:'Genus',    example:'Panthera',   desc:'Animals so closely related they can sometimes interbreed.' },
  { rank:'Species',  example:'leo',        desc:'The fundamental unit — animals that interbreed naturally.' },
];

// Key features per Order (curated)
const ORDER_NOTES = {
  Carnivora:      { icon:'🦁', desc:'Meat-eaters with specialized teeth and claws. Includes cats, dogs, bears, seals, and weasels.' },
  Proboscidea:    { icon:'🐘', desc:'The elephant order — largest land animals with elongated prehensile trunks and tusks.' },
  Primates:       { icon:'🦍', desc:'High intelligence, forward-facing eyes, grasping hands. Includes apes, monkeys, and lemurs.' },
  Artiodactyla:   { icon:'🦏', desc:'Even-toed ungulates: cattle, deer, giraffes, hippos, camels. Most are grazers or browsers.' },
  Perissodactyla: { icon:'🦓', desc:'Odd-toed ungulates: horses, rhinos, tapirs. Efficient runners with reduced toe counts.' },
  Rodentia:       { icon:'🐭', desc:'Largest mammal order. Defined by ever-growing incisors. Includes capybaras and prairie dogs.' },
  Chiroptera:     { icon:'🦇', desc:'Bats — the only mammals capable of sustained flight. Use echolocation to hunt.' },
  Crocodylia:     { icon:'🐊', desc:'Ancient semi-aquatic reptiles with armoured bodies, unchanged for 200 million years.' },
  Testudines:     { icon:'🐢', desc:'Turtles and tortoises — reptiles enclosed in a bony shell fused to the spine.' },
  Squamata:       { icon:'🐍', desc:'Largest reptile order: lizards and snakes. Shed skin and have moveable jaw bones.' },
  Sphenisciformes:{ icon:'🐧', desc:'Penguins — flightless seabirds highly adapted for aquatic life in cold climates.' },
  Falconiformes:  { icon:'🦅', desc:'Birds of prey with sharp talons and hooked beaks for hunting.' },
  Gruiformes:     { icon:'🦢', desc:'Cranes and rails — long-legged wading birds found in wetlands worldwide.' },
};

// Key features per Family (curated)
const FAMILY_NOTES = {
  Felidae:         { icon:'🐆', desc:'All cats — obligate carnivores with retractile claws, acute hearing, and night vision.' },
  Canidae:         { icon:'🐺', desc:'Dogs, wolves, foxes — social hunters with non-retractile claws and strong pack instincts.' },
  Ursidae:         { icon:'🐻', desc:'Bears — large omnivores, mostly solitary, with plantigrade feet and exceptional smell.' },
  Elephantidae:    { icon:'🐘', desc:'Elephants — longest-lived land animals with complex social bonds and remarkable memory.' },
  Rhinocerotidae:  { icon:'🦏', desc:'Rhinos — large herbivores with one or two keratin horns. All species threatened or endangered.' },
  Giraffidae:      { icon:'🦒', desc:'Giraffes and Okapi — ossicones instead of true horns; giraffe is the tallest living land animal.' },
  Bovidae:         { icon:'🐃', desc:'Hooved, hollow-horned ruminants: cattle, buffalo, antelope, bison, goats, and sheep.' },
  Equidae:         { icon:'🐎', desc:'Horses, zebras, donkeys — odd-toed ungulates built for speed on open terrain.' },
  Hippopotamidae:  { icon:'🦛', desc:'Hippos — semiaquatic megaherbivores, closest living relatives of whales.' },
  Hominidae:       { icon:'🦧', desc:'Great apes — orangutans, gorillas, chimpanzees, bonobos; share 98%+ DNA with humans.' },
  Cercopithecidae: { icon:'🐒', desc:'Old World monkeys — baboons, macaques, mandrills; have downward-pointing nostrils.' },
  Hyaenidae:       { icon:'🐾', desc:'Hyenas — dog-like but closer to cats; spotted hyenas live in female-dominant clans.' },
  Crocodylidae:    { icon:'🐊', desc:'Crocodiles — apex aquatic predators with the strongest bite force of any living animal.' },
  Spheniscidae:    { icon:'🐧', desc:'Penguins — wings evolved into flippers; insulated by dense waterproof feathers.' },
  Tapiridae:       { icon:'🐗', desc:'Tapirs — primitive herbivores with a short prehensile trunk; related to horses and rhinos.' },
  Camelidae:       { icon:'🐪', desc:'Camels, llamas, alpacas — adapted to arid environments; store fat (not water) in humps.' },
  Ailuropodidae:   { icon:'🐼', desc:'Giant panda — bamboo-specialist bear, one of the most iconic conservation symbols.' },
  Mustelidae:      { icon:'🦦', desc:'Weasels, otters, badgers, wolverines — slender-bodied carnivores with musk glands.' },
  Cheloniidae:     { icon:'🐢', desc:'Sea turtles — ancient marine reptiles that navigate back to natal beaches to nest.' },
  Testudinidae:    { icon:'🐢', desc:'Tortoises — fully terrestrial turtles with dome-shaped shells and columnar legs.' },
};

const IUCN_COLOR = {
  'Critically Endangered':'#c84040','Endangered':'#c87030','Vulnerable':'#c8a030',
  'Near Threatened':'#9ab84a','Least Concern':'#6ab87a','Data Deficient':'#7a9460','Domesticated':'#4a9ab8',
};

export default function TaxonomyExplorer({ theme, onSelectAnimal }) {
  const accent = theme?.accent || '#0f9a6d';
  const [filterBy, setFilterBy]   = useState('order'); // 'order' | 'family'
  const [selected, setSelected]   = useState('');
  const [showGuide, setShowGuide] = useState(false);

  // Build unique lists
  const orders   = useMemo(() => [...new Set(PZ1_ZOOPEDIA.map(a => a.order).filter(Boolean))].sort(), []);
  const families = useMemo(() => [...new Set(PZ1_ZOOPEDIA.map(a => a.family).filter(Boolean))].sort(), []);
  const options  = filterBy === 'order' ? orders : families;

  // Animals matching selection
  const matchedAnimals = useMemo(() => {
    if (!selected) return [];
    return PZ1_ZOOPEDIA.filter(a => filterBy === 'order' ? a.order === selected : a.family === selected);
  }, [selected, filterBy]);

  const notes = filterBy === 'order' ? ORDER_NOTES : FAMILY_NOTES;
  const info  = notes[selected];

  return (
    <div style={{ maxWidth:800, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:22, fontWeight:800, color:'#e0ecc0', marginBottom:4 }}>🎓 Taxonomy Explorer</div>
        <div style={{ fontSize:13, color:'#5a7050' }}>Understand biological classification and explore animal groups in the game.</div>
      </div>

      {/* How taxonomy works — collapsible */}
      <div style={{ background:'#0a120a', border:'1px solid #1e2a18', borderRadius:10, marginBottom:'1.5rem', overflow:'hidden' }}>
        <button onClick={() => setShowGuide(v => !v)}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'transparent', border:'none', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:16 }}>📚</span>
            <span style={{ fontSize:14, fontWeight:600, color:'#c8d8a8' }}>How Taxonomy Works</span>
          </div>
          <span style={{ color:'#5a7050' }}>{showGuide ? '▲' : '▼'}</span>
        </button>

        {showGuide && (
          <div style={{ padding:'0 16px 16px' }}>
            <div style={{ fontSize:12, color:'#5a7050', marginBottom:12, lineHeight:1.6 }}>
              Every animal gets a 7-level classification. Think of it as nested boxes — Kingdom is the biggest box, Species is the smallest. Animals in the same box share more characteristics.
            </div>
            {/* Hierarchy visual */}
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {LEVELS.map((l, i) => (
                <div key={l.rank} style={{ display:'flex', alignItems:'flex-start', gap:10, paddingLeft: i * 12 }}>
                  <div style={{ background: `hsl(${140 - i*12},30%,${12+i*2}%)`, border:`1px solid hsl(${140 - i*12},25%,${20+i*2}%)`, borderRadius:5, padding:'6px 10px', flexShrink:0, minWidth:120 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:`hsl(${140-i*12},50%,60%)` }}>{l.rank}</div>
                    <div style={{ fontSize:11, color:'#c8d8a8', fontStyle:'italic' }}>{l.example}</div>
                  </div>
                  <div style={{ fontSize:12, color:'#5a7050', lineHeight:1.5, paddingTop:4 }}>{l.desc}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:12, background:'#0d1a0d', border:`1px solid ${accent}33`, borderRadius:7, padding:'10px 12px', fontSize:12, color:'#7a9460' }}>
              <strong style={{ color:'#c8d8a8' }}>Example:</strong> A Lion is <em>Animalia → Chordata → Mammalia → Carnivora → Felidae → Panthera → leo</em>. Same Family as a tiger (Felidae), same Genus as a leopard (Panthera).
            </div>
          </div>
        )}
      </div>

      {/* Filter by Order or Family */}
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <div style={{ fontSize:12, color:'#7a9460', alignSelf:'center', fontWeight:600 }}>Browse by:</div>
        {[['order','Order'],['family','Family']].map(([v, label]) => (
          <button key={v} onClick={() => { setFilterBy(v); setSelected(''); }}
            style={{ background: filterBy===v ? `${accent}22` : '#111a0f', border:`1px solid ${filterBy===v ? accent : '#2e4028'}`, borderRadius:20, padding:'5px 14px', color: filterBy===v ? '#c8d8a8' : '#5a7050', fontSize:13, fontWeight: filterBy===v ? 700 : 400, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Option grid */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:'1.5rem' }}>
        {options.map(opt => {
          const n = notes[opt];
          const count = PZ1_ZOOPEDIA.filter(a => filterBy === 'order' ? a.order === opt : a.family === opt).length;
          const isActive = selected === opt;
          return (
            <button key={opt} onClick={() => setSelected(isActive ? '' : opt)}
              style={{ background: isActive ? `${accent}22` : '#111a0f', border:`1px solid ${isActive ? accent : '#2e4028'}`, borderRadius:8, padding:'7px 12px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:6 }}>
              {n && <span style={{ fontSize:16 }}>{n.icon}</span>}
              <div>
                <div style={{ fontSize:12, color: isActive ? '#e0ecc0' : '#c8d8a8', fontStyle:'italic', fontWeight: isActive ? 700 : 400 }}>{opt}</div>
                <div style={{ fontSize:10, color:'#3a5030' }}>{count} animals</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected info + animals */}
      {selected && (
        <div>
          {/* Info card */}
          <div style={{ background:'#0d1a0d', border:`1px solid ${accent}44`, borderRadius:10, padding:'1rem 1.25rem', marginBottom:'1rem' }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:8 }}>
              {info && <span style={{ fontSize:32 }}>{info.icon}</span>}
              <div>
                <div style={{ fontStyle:'italic', fontSize:20, fontWeight:700, color:'#e0ecc0', marginBottom:4 }}>{selected}</div>
                <div style={{ fontSize:11, color:accent, textTransform:'uppercase', letterSpacing:'0.05em' }}>{filterBy === 'order' ? 'Order' : 'Family'}</div>
              </div>
            </div>
            {info
              ? <p style={{ fontSize:13, color:'#9ab880', lineHeight:1.6, margin:0 }}>{info.desc}</p>
              : <p style={{ fontSize:13, color:'#5a7050', lineHeight:1.6, margin:0 }}>Contains {matchedAnimals.length} species in the Planet Zoo database.</p>
            }
          </div>

          {/* Animal list */}
          <div style={{ fontSize:11, color:'#7a9460', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8, fontWeight:600 }}>
            {matchedAnimals.length} animals in this {filterBy}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:8 }}>
            {matchedAnimals.map(a => {
              const sc = IUCN_COLOR[a.conservationStatus] || '#7a9460';
              return (
                <button key={a.name}
                  onClick={() => onSelectAnimal && onSelectAnimal(a.name)}
                  style={{ background:'#111a0f', border:'1px solid #1e2a18', borderRadius:9, padding:'10px', cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:9 }}>
                  <AnimalImage src={a.image} alt={a.name} type={a.type} conservationStatus={a.conservationStatus}
                    style={{ width:38, height:38, borderRadius:6, flexShrink:0, fontSize:'1.2rem' }} />
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, color:'#c8d8a8', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize:10, fontStyle:'italic', color:'#5a7050', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.genus} {a.species}</div>
                    <div style={{ display:'flex', gap:5, marginTop:2 }}>
                      <span style={{ fontSize:10, color:sc, fontWeight:600 }}>{a.conservationStatus?.replace('Critically Endangered','CR').replace('Endangered','EN').replace('Vulnerable','VU').replace('Near Threatened','NT').replace('Least Concern','LC') || '?'}</span>
                      {a.appeal && <span style={{ fontSize:10, color:'#5a7050' }}>★{Number(a.appeal).toLocaleString()}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
