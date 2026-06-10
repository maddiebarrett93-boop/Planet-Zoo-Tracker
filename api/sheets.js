// Vercel serverless API — Google Sheets sync
// GET  /api/sheets?tab=Animals&zoo_id=zoo_001   → rows for that zoo
// POST /api/sheets                               → { tab, zoo_id, rows } → writes all rows
// All auth via GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY env vars

const SHEET_ID = process.env.VITE_SHEET_ID || '1rhKqONXzIC5iyGye6Z4e1mSmhWpM31ZH-A2sqQxjEoE';

// ── JWT / OAuth2 helper (no external deps — pure Node crypto) ─────────────
const { createSign } = require('crypto');

function base64url(str) {
  return Buffer.from(str).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !rawKey) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY env vars');

  const now  = Math.floor(Date.now() / 1000);
  const header  = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: email, scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }));
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(rawKey, 'base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Sheets helpers ─────────────────────────────────────────────────────────
async function sheetsGet(range, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}

async function sheetsClear(range, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:clear`;
  await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
}

async function sheetsUpdate(range, values, token) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });
}

// ── Tab schemas (header row per tab) ──────────────────────────────────────
const SCHEMAS = {
  Animals:      ['zoo_id','id','species','habitat','males','females','conservationStatus','notes'],
  Roster:       ['zoo_id','id','species','name','sex','ageStage','fertility','immunity','size','longevity','appeal','mate','offspring','disposition','isAlpha','isBonded','isOutsider','socialStructure'],
  Conservation: ['zoo_id','id','species','goalPop','currentPop','releaseGoal','released'],
  Habitats:     ['zoo_id','id','name','species','regions','biomes','habitatType','actualLandSpace','actualWaterSpace','baseSpace','perAdditionalSpace','adultCount','guestRating','features','status','socialStructure','fenceGrade','fenceHeight'],
  Bloodlines:   ['zoo_id','id','name','father','mother','species','generation','disposition'],
  Peeps:        ['zoo_id','data'],  // stores JSON blob per zoo
  Zoos:         ['id','name','customStats','createdAt'],
};

function rowToObj(headers, row) {
  const o = {};
  headers.forEach((h, i) => { o[h] = row[i] ?? ''; });
  return o;
}

function objToRow(headers, obj) {
  return headers.map(h => {
    const v = obj[h];
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  });
}

// ── Route handler ─────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = await getAccessToken();

    // ── GET: read a tab (optionally filtered by zoo_id) ──────────────────
    if (req.method === 'GET') {
      const { tab, zoo_id } = req.query;
      if (!tab || !SCHEMAS[tab]) return res.status(400).json({ error: `Unknown tab: ${tab}` });

      const data = await sheetsGet(`${tab}!A:ZZ`, token);
      const rows = data.values || [];
      if (rows.length <= 1) return res.json({ rows: [] });

      const headers = rows[0];
      let result = rows.slice(1).map(r => rowToObj(headers, r));
      if (zoo_id) result = result.filter(r => r.zoo_id === zoo_id);
      return res.json({ rows: result });
    }

    // ── POST: write all rows for a tab+zoo_id ────────────────────────────
    if (req.method === 'POST') {
      const { tab, zoo_id, rows: newRows } = req.body;
      if (!tab || !SCHEMAS[tab]) return res.status(400).json({ error: `Unknown tab: ${tab}` });

      const headers = SCHEMAS[tab];
      const sheetData = await sheetsGet(`${tab}!A:ZZ`, token);
      const existingRows = sheetData.values || [];

      let allRows;
      if (existingRows.length === 0) {
        // Fresh sheet — write header + new rows
        allRows = [headers, ...newRows.map(r => objToRow(headers, { ...r, zoo_id }))];
      } else {
        // Preserve other zoos' rows, replace this zoo's rows
        const existingHeaders = existingRows[0];
        const otherRows = existingRows.slice(1).filter(r => {
          const zooIdx = existingHeaders.indexOf('zoo_id');
          return zooIdx >= 0 && r[zooIdx] !== zoo_id;
        });
        allRows = [headers, ...otherRows, ...newRows.map(r => objToRow(headers, { ...r, zoo_id }))];
      }

      await sheetsClear(`${tab}!A:ZZ`, token);
      if (allRows.length > 0) await sheetsUpdate(`${tab}!A1`, allRows, token);
      return res.json({ ok: true, written: newRows.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Sheets API error:', err);
    return res.status(500).json({ error: err.message });
  }
};
