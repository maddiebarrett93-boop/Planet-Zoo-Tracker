import { useState } from 'react';

// Type-based fallback icons when image fails
const TYPE_ICONS = {
  Habitat: '🦁', Exhibit: '🦎', Aviary: '🦜', Aquarium: '🐠',
};
const STATUS_COLORS = {
  'Critically Endangered': '#c84040', 'Endangered': '#c87030',
  'Vulnerable': '#c8a030', 'Near Threatened': '#9ab84a',
  'Least Concern': '#6ab87a', 'Data Deficient': '#7a9460', 'Domesticated': '#4a9ab8',
};

export function AnimalImage({ src, alt, type, conservationStatus, style = {}, className }) {
  const [failed, setFailed] = useState(false);
  const icon = TYPE_ICONS[type] || '🐾';
  const color = STATUS_COLORS[conservationStatus] || '#2e4028';

  if (!src || failed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`, border: `1px solid ${color}44`,
        color: color, fontSize: style.fontSize || '2rem',
        borderRadius: style.borderRadius || 8,
        ...style,
      }}>
        <span>{icon}</span>
        {style.height > 60 && <span style={{ fontSize: 10, color: '#3a5030', marginTop: 4, textAlign: 'center', padding: '0 4px' }}>{alt}</span>}
      </div>
    );
  }

  return (
    <img src={src} alt={alt || ''} className={className}
      style={{ objectFit: 'cover', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
