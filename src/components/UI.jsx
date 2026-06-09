import { useState } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#1a2318', border: '1px solid #2e4028', borderRadius: 12, width: '100%', maxWidth: wide ? 780 : 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #2e4028', flexShrink: 0 }}>
          <h3 style={{ margin: 0, color: '#c8d8a8', fontSize: 16, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4, display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1.25rem', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, half }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <label style={{ display: 'block', fontSize: 11, color: '#7a9460', marginBottom: 4, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return <input {...props} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none', ...props.style }} />;
}

export function Select({ options, placeholder, ...props }) {
  return (
    <select {...props} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: props.value ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none', cursor: 'pointer', ...props.style }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

export function Textarea({ ...props }) {
  return <textarea {...props} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 60, ...props.style }} />;
}

export function Btn({ variant = 'primary', size = 'md', children, ...props }) {
  const base = { borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500, border: '1px solid', transition: 'opacity 0.15s' };
  const variants = {
    primary: { background: '#58673f', color: '#e8f0d0', borderColor: '#6a7d4a' },
    ghost:   { background: 'transparent', color: '#7a9460', borderColor: '#2e4028' },
    danger:  { background: 'transparent', color: '#c96060', borderColor: '#5a2828' },
    warn:    { background: '#2e2a10', color: '#c8a030', borderColor: '#5a4a10' },
  };
  const sizes = { sm: { padding: '3px 9px', fontSize: 12 }, md: { padding: '6px 13px', fontSize: 13 }, lg: { padding: '8px 18px', fontSize: 14 } };
  return <button {...props} style={{ ...base, ...variants[variant], ...sizes[size], ...props.style }}>{children}</button>;
}

export function Badge({ status }) {
  const map = {
    'Least Concern':        { bg: '#1a3020', c: '#6ab87a' },
    'Near Threatened':      { bg: '#1e2e12', c: '#9ab84a' },
    'Vulnerable':           { bg: '#2e2a10', c: '#c8a030' },
    'Endangered':           { bg: '#2e1c10', c: '#c87030' },
    'Critically Endangered':{ bg: '#2e1010', c: '#c84040' },
    'Extinct in the Wild':  { bg: '#1a1020', c: '#9060a0' },
    'Keep':    { bg: '#1a3020', c: '#6ab87a' },
    'Sell':    { bg: '#2e2a10', c: '#c8a030' },
    'Release': { bg: '#102030', c: '#4090c0' },
    'Active':             { bg: '#1a3020', c: '#6ab87a' },
    'Planning':           { bg: '#102030', c: '#4090c0' },
    'Under Construction': { bg: '#2e2a10', c: '#c8a030' },
    'Needs Upgrade':      { bg: '#2e1010', c: '#c84040' },
  };
  const s = map[status] || { bg: '#1e2a18', c: '#7a9460' };
  return <span style={{ background: s.bg, color: s.c, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{status}</span>;
}

export function ToggleBadge({ label, active, color, onClick, icon }) {
  return (
    <button onClick={onClick} style={{ background: active ? `${color}22` : 'transparent', border: `1px solid ${active ? color : '#2e4028'}`, borderRadius: 20, padding: '2px 9px', color: active ? color : '#3a5030', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
      {icon && <span style={{ marginRight: 3 }}>{icon}</span>}{label}
    </button>
  );
}

export function ScoreBar({ value, max = 100 }) {
  const pct = Math.min(100, ((+value || 0) / max) * 100);
  const color = pct >= 85 ? '#6ab87a' : pct >= 65 ? '#c8a030' : '#c84040';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ flex: 1, height: 5, background: '#1e2a18', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, color: '#7a9460', minWidth: 26, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 100 ? '#6ab87a' : pct >= 50 ? '#c8a030' : '#c84040';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
        <span style={{ color: '#7a9460' }}>{label || `${value} / ${max}`}</span>
        <span style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 7, background: '#1e2a18', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#5a7050' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 13 }}>{message}</p>
    </div>
  );
}

export function Alert({ type = 'warn', children }) {
  const styles = {
    warn:  { bg: '#2a2208', border: '#c8a030', icon: '⚠️', color: '#c8a030' },
    error: { bg: '#280808', border: '#c84040', icon: '🚨', color: '#c84040' },
    info:  { bg: '#081828', border: '#4090c0', icon: 'ℹ️', color: '#4090c0' },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 12px', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ fontSize: 12, color: s.color, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

export function MultiSelectPills({ options, selected, onChange, icons }) {
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const on = selected.includes(o);
        return (
          <button key={o} onClick={() => toggle(o)} style={{ background: on ? '#2a3e20' : '#111a0f', border: `1px solid ${on ? '#58673f' : '#2e4028'}`, borderRadius: 20, padding: '4px 12px', color: on ? '#c8d8a8' : '#5a7050', fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
            {icons?.[o] ? `${icons[o]} ` : ''}{o}
          </button>
        );
      })}
    </div>
  );
}

export function KpiCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#111a0f', border: `1px solid ${accent || '#2e4028'}`, borderRadius: 10, padding: '0.9rem 1.1rem' }}>
      <div style={{ fontSize: 11, color: '#7a9460', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent || '#c8d8a8', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#5a7050', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
