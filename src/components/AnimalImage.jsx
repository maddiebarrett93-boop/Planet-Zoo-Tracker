import { useState } from 'react';

const TYPE_ICONS = { Habitat:'🦁', Exhibit:'🦎', Aviary:'🦜', Aquarium:'🐠' };

// Color per conservation status
const STATUS_PALETTE = {
  'Critically Endangered': { bg:'#1e0808', border:'#5a2828', icon:'#c84040', text:'#c84040' },
  'Endangered':            { bg:'#1e1008', border:'#5a3818', icon:'#c87030', text:'#c87030' },
  'Vulnerable':            { bg:'#1e1a08', border:'#5a4818', icon:'#c8a030', text:'#c8a030' },
  'Near Threatened':       { bg:'#121e08', border:'#2e4818', icon:'#9ab84a', text:'#9ab84a' },
  'Least Concern':         { bg:'#0a1e0a', border:'#1e4a1e', icon:'#6ab87a', text:'#6ab87a' },
  'Data Deficient':        { bg:'#111a11', border:'#2a3a2a', icon:'#7a9460', text:'#7a9460' },
  'Domesticated':          { bg:'#08181e', border:'#183848', icon:'#4a9ab8', text:'#4a9ab8' },
};
const DEFAULT_PAL = { bg:'#111a0f', border:'#2e4028', icon:'#5a7050', text:'#5a7050' };

export function AnimalImage({ src, alt, type, conservationStatus, style = {} }) {
  const [failed, setFailed] = useState(false);
  const icon = TYPE_ICONS[type] || '🐾';
  const pal  = STATUS_PALETTE[conservationStatus] || DEFAULT_PAL;
  const h    = style.height || 40;
  const big  = h > 60;
  const name = alt || '';

  if (!src || failed) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background: pal.bg,
        border: `1px solid ${pal.border}`,
        borderRadius: style.borderRadius ?? 8,
        overflow:'hidden',
        ...style,
      }}>
        <span style={{ fontSize: big ? '2rem' : '1.3rem', lineHeight:1 }}>{icon}</span>
        {big && name && (
          <span style={{
            fontSize: h > 100 ? 10 : 9,
            color: pal.text, marginTop: 4,
            textAlign:'center', padding:'0 4px',
            lineHeight:1.2, maxWidth:'100%',
            overflow:'hidden', textOverflow:'ellipsis',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
          }}>{name}</span>
        )}
      </div>
    );
  }

  return (
    <img src={src} alt={name} style={{ objectFit:'cover', ...style }}
      onError={() => setFailed(true)} loading="lazy" />
  );
}
