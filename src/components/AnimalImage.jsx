import { useState } from 'react';

const TYPE_ICONS = { Habitat:'🦁', Exhibit:'🦎', Aviary:'🦜', Aquarium:'🐠' };
const STATUS_COLORS = {
  'Critically Endangered':'#c84040','Endangered':'#c87030','Vulnerable':'#c8a030',
  'Near Threatened':'#9ab84a','Least Concern':'#6ab87a',
  'Data Deficient':'#7a9460','Domesticated':'#4a9ab8',
};

// Route Fandom images through our proxy to bypass hotlink protection
function proxyUrl(src) {
  if (!src) return null;
  if (src.includes('wikia.nocookie.net') || src.includes('wikia.net')) {
    return `/api/img?url=${encodeURIComponent(src)}`;
  }
  return src;
}

export function AnimalImage({ src, alt, type, conservationStatus, style = {} }) {
  const [failed, setFailed] = useState(false);
  const icon  = TYPE_ICONS[type] || '🐾';
  const color = STATUS_COLORS[conservationStatus] || '#2e4028';
  const proxied = proxyUrl(src);

  if (!proxied || failed) {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background:`${color}18`, border:`1px solid ${color}44`,
        color, borderRadius: style.borderRadius ?? 8,
        ...style,
      }}>
        <span style={{ fontSize: typeof style.height === 'number' && style.height > 50 ? '2rem' : '1.2rem' }}>{icon}</span>
        {typeof style.height === 'number' && style.height > 70 && (
          <span style={{ fontSize:10, color:'#3a5030', marginTop:4, textAlign:'center', padding:'0 4px', lineHeight:1.3 }}>{alt}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={proxied}
      alt={alt || ''}
      style={{ objectFit:'cover', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
