// Google Sheets sync layer — with retry, cache-busting, and robust parsing

const API = '/api/sheets';
const CACHE_KEY = 'pzt_cache_v3';
const CACHE_TTL = 30_000; // 30s — stale after this, always re-fetch on tab switch

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

// ── Fetch with retry (3 attempts, exponential backoff) ────────────────────
async function fetchWithRetry(url, options = {}, attempts = 3) {
  // Guard: don't fire requests with no meaningful params
  if (url === '/api/sheets' || url === '/api/sheets?') return { ok: false, json: async () => ({ rows: [] }) };
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const sep = url.includes('?') ? '&' : '?';
      const r = await fetch(`${url}${sep}_=${Date.now()}`, options);
      if (r.ok) return r;
      // 4xx = don't retry (bad request), 5xx = retry
      if (r.status < 500) throw new Error(`HTTP ${r.status}`);
      lastError = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastError = e;
    }
    if (i < attempts - 1) await new Promise(res => setTimeout(res, 600 * Math.pow(2, i)));
  }
  throw lastError;
}

export async function readTab(tab, zoo_id) {
  const r = await fetchWithRetry(`${API}?tab=${tab}&zoo_id=${encodeURIComponent(zoo_id)}`);
  const { rows } = await r.json();
  const c = loadCache();
  c[`${tab}:${zoo_id}`] = { rows, ts: Date.now() };
  saveCache(c);
  return rows;
}

export async function writeTab(tab, zoo_id, rows) {
  const r = await fetchWithRetry(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab, zoo_id, rows }),
  });
  const c = loadCache();
  c[`${tab}:${zoo_id}`] = { rows, ts: Date.now() };
  saveCache(c);
  return r.json();
}

export function readCache(tab, zoo_id) {
  const entry = loadCache()[`${tab}:${zoo_id}`];
  if (!entry) return null;
  // Return null if stale so tab switch triggers a fresh fetch
  if (Date.now() - entry.ts > CACHE_TTL) return null;
  return entry.rows;
}

export function readCacheAny(tab, zoo_id) {
  // Like readCache but ignores TTL — for offline fallback
  return loadCache()[`${tab}:${zoo_id}`]?.rows || null;
}

export async function readZoos() {
  try {
    const r = await fetchWithRetry(`${API}?tab=Zoos`);
    const { rows } = await r.json();
    return rows;
  } catch { return []; }
}

export async function writeZoos(zoos) {
  return fetchWithRetry(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tab: 'Zoos', zoo_id: '__all__', rows: zoos }),
  });
}

// Retry queue for failed writes — flushes on next successful connection
const retryQueue = [];
let retryTimer = null;

function scheduleRetryFlush() {
  if (retryTimer) return;
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    while (retryQueue.length) {
      const { tab, zoo_id, rows } = retryQueue[0];
      try {
        await writeTab(tab, zoo_id, rows);
        retryQueue.shift();
      } catch {
        scheduleRetryFlush(); // try again later
        break;
      }
    }
  }, 10_000);
}

const timers = {};
export function debouncedWrite(tab, zoo_id, rows, delay = 1500) {
  const key = `${tab}:${zoo_id}`;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(async () => {
    try {
      await writeTab(tab, zoo_id, rows);
    } catch (e) {
      console.warn(`[sync] Write failed for ${tab}, queued for retry:`, e.message);
      // Queue for retry, replacing any existing queued entry for same tab+zoo
      const idx = retryQueue.findIndex(q => q.tab === tab && q.zoo_id === zoo_id);
      if (idx >= 0) retryQueue[idx].rows = rows;
      else retryQueue.push({ tab, zoo_id, rows });
      scheduleRetryFlush();
    }
  }, delay);
}
