import { useState } from 'react';

const TYPE_ICONS = { Habitat:'🦁', Exhibit:'🦎', Aviary:'🦜', Aquarium:'🐠' };
const STATUS_COLORS = {
  'Critically Endangered':'#c84040','Endangered':'#c87030','Vulnerable':'#c8a030',
  'Near Threatened':'#9ab84a','Least Concern':'#6ab87a',
  'Data Deficient':'#7a9460','Domesticated':'#4a9ab8',
};

export function AnimalImage({ src, alt, type, conservationStatus, style = {} }) {
  const [failed, setFailed] = useState(false);
  const icon  = TYPE_ICONS[type] || '🐾';
  const color = STATUS_COLORS[conservationStatus] || '#2e4028';
  const name  = alt || '';

  // Fallback: stylized card with animal name + type icon
  if (!src || failed) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background:`linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border:`1px solid ${color}33`,
        color, borderRadius: style.borderRadius ?? 8,
        overflow:'hidden',
        ...style,
      }}>
        <span style={{ fontSize: typeof style.height === 'number' && style.height > 50 ? '2rem' : '1.4rem', lineHeight:1 }}>{icon}</span>
        {typeof style.height === 'number' && style.height > 60 && name && (
          <span style={{ fontSize:9, color:`${color}aa`, marginTop:4, textAlign:'center', padding:'0 4px', lineHeight:1.2, maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
        )}
      </div>
    );
  }

  // Load directly from Fandom CDN — works fine browser-side, only blocked server-side
  // Add crossOrigin anonymous so errors are caught properly
  return (
    <img
      src={src}
      alt={name}
      style={{ objectFit:'cover', ...style }}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
