import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#1a2318', border: '1px solid #2e4028', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #2e4028' }}>
          <h3 style={{ margin: 0, color: '#c8d8a8', fontSize: 16, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7a9460', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '1.25rem', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: 12, color: '#7a9460', marginBottom: 4, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

export function Input({ ...props }) {
  return (
    <input {...props} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none', ...props.style }} />
  );
}

export function Select({ options, placeholder, ...props }) {
  return (
    <select {...props} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: props.value ? '#c8d8a8' : '#5a7050', fontSize: 14, boxSizing: 'border-box', outline: 'none', appearance: 'none', cursor: 'pointer', ...props.style }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  );
}

export function Textarea({ ...props }) {
  return (
    <textarea {...props} style={{ width: '100%', background: '#111a0f', border: '1px solid #2e4028', borderRadius: 6, padding: '7px 10px', color: '#c8d8a8', fontSize: 14, boxSizing: 'border-box', outline: 'none', resize: 'vertical', minHeight: 70, ...props.style }} />
  );
}

export function Btn({ variant = 'primary', children, ...props }) {
  const styles = {
    primary: { background: '#58673f', color: '#e8f0d0', border: '1px solid #6a7d4a' },
    ghost: { background: 'transparent', color: '#7a9460', border: '1px solid #2e4028' },
    danger: { background: 'transparent', color: '#c96060', border: '1px solid #5a2828' },
  };
  return (
    <button {...props} style={{ ...styles[variant], borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, ...props.style }}>
      {children}
    </button>
  );
}

export function Badge({ status }) {
  const colors = {
    'Least Concern': { bg: '#1a3020', color: '#6ab87a' },
    'Near Threatened': { bg: '#1e2e12', color: '#9ab84a' },
    'Vulnerable': { bg: '#2e2a10', color: '#c8a030' },
    'Endangered': { bg: '#2e1c10', color: '#c87030' },
    'Critically Endangered': { bg: '#2e1010', color: '#c84040' },
    'Extinct in the Wild': { bg: '#1a1020', color: '#9060a0' },
    'Keep': { bg: '#1a3020', color: '#6ab87a' },
    'Sell': { bg: '#2e2a10', color: '#c8a030' },
    'Release': { bg: '#102030', color: '#4090c0' },
    'Active': { bg: '#1a3020', color: '#6ab87a' },
    'Planning': { bg: '#102030', color: '#4090c0' },
    'Under Construction': { bg: '#2e2a10', color: '#c8a030' },
    'Needs Upgrade': { bg: '#2e1010', color: '#c84040' },
  };
  const c = colors[status] || { bg: '#1e2a18', color: '#7a9460' };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.02em' }}>{status}</span>
  );
}

export function ScoreBar({ value, max = 100 }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 85 ? '#6ab87a' : pct >= 65 ? '#c8a030' : '#c84040';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: '#1e2a18', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color: '#7a9460', minWidth: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export function ProgressBar({ value, max }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 100 ? '#6ab87a' : pct >= 50 ? '#c8a030' : '#c84040';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: '#7a9460' }}>{value} / {max}</span>
        <span style={{ color }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 8, background: '#1e2a18', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem', color: '#5a7050' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 14 }}>{message}</p>
    </div>
  );
}
