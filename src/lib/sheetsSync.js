// Google Sheets sync layer
// Writes go to Sheets immediately (debounced). Cache prevents blank screens on load.

const API = '/api/sheets';
const CACHE_KEY = 'pzt_cache_v2';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

export async function readTab(tab, zoo_id) {
  const r = await fetch(`${API}?tab=${tab}&zoo_id=${encodeURIComponent(zoo_id)}`);
  if (!r.ok) throw new Error(`Read failed: ${r.status}`);
  const { rows } = await r.json();
  const c = loadCache(); c[`${tab}:${zoo_id}`] = { rows, ts: Date.now() }; saveCache(c);
  return rows;
}

export async function writeTab(tab, zoo_id, rows) {
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab, zoo_id, rows }),
  });
  if (!r.ok) throw new Error(`Write failed: ${r.status}`);
  const c = loadCache(); c[`${tab}:${zoo_id}`] = { rows, ts: Date.now() }; saveCache(c);
  return r.json();
}

export function readCache(tab, zoo_id) {
  return loadCache()[`${tab}:${zoo_id}`]?.rows || null;
}

export async function readZoos() {
  const r = await fetch(`${API}?tab=Zoos`);
  if (!r.ok) return [];
  const { rows } = await r.json();
  return rows;
}

export async function writeZoos(zoos) {
  return fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab: 'Zoos', zoo_id: '__all__', rows: zoos }),
  });
}

const timers = {};
export function debouncedWrite(tab, zoo_id, rows, delay = 1500) {
  const key = `${tab}:${zoo_id}`;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => writeTab(tab, zoo_id, rows).catch(console.error), delay);
}
