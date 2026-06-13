// Vercel serverless API — ES module version
// GET  /api/sheets?tab=Animals&zoo_id=zoo_001  → rows
// POST /api/sheets  { tab, zoo_id, rows }       → write

import { createSign } from 'crypto';

const SHEET_ID = process.env.VITE_SHEET_ID || '1rhKqONXzIC5iyGye6Z4e1mSmhWpM31ZH-A2sqQxjEoE';

function b64url(input) {
  return Buffer.from(typeof input === 'string' ? input : JSON.stringify(input))
    .toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}

async function getAccessToken() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_PRIVATE_KEY || '';
  // Normalize: strip surrounding quotes Vercel sometimes adds, convert \n to real newlines
  key = key.replace(/\\n/g, '\n');
  if (key.startsWith('"')) key = key.slice(1);
  if (key.endsWith('"'))  key = key.slice(0, -1);
  key = key.replace(/\\n/g, '\n');

  if (!email || !key) throw new Error(`Missing credentials: email=${email ? 'set' : 'MISSING'}, key=${key ? 'set' : 'MISSING'}`);

  const now = Math.floor(Date.now() / 1000);
  const header  = b64url({ alg:'RS256', typ:'JWT' });
  const payload = b64url({ iss:email, scope:'https://www.googleapis.com/auth/spreadsheets', aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600 });
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key, 'base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion:`${header}.${payload}.${sig}` }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function sheetsGet(range, token) {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`, { headers:{ Authorization:`Bearer ${token}` } });
  if (!r.ok) throw new Error(`Sheets GET ${r.status}: ${await r.text()}`);
  return r.json();
}
async function sheetsClear(range, token) {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}:clear`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
}
async function sheetsUpdate(range, values, token) {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method:'PUT', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ range, majorDimension:'ROWS', values }),
  });
  if (!r.ok) throw new Error(`Sheets UPDATE ${r.status}: ${await r.text()}`);
}

const SCHEMAS = {
  Animals:      ['zoo_id','id','species','habitat','males','females','conservationStatus','notes'],
  Roster:       ['zoo_id','id','species','name','sex','ageStage','fertility','immunity','size','longevity','appeal','mate','offspring','disposition','isAlpha','isBonded','isOutsider','socialStructure'],
  Conservation: ['zoo_id','id','species','goalPop','currentPop','releaseGoal','released'],
  Habitats:     ['zoo_id','id','name','species','regions','biomes','habitatType','actualLandSpace','actualWaterSpace','baseSpace','perAdditionalSpace','adultCount','guestRating','features','status','socialStructure','fenceGrade','fenceHeight'],
  Bloodlines:   ['zoo_id','id','name','father','mother','species','generation','disposition'],
  Peeps:        ['zoo_id','data'],
  Zoos:         ['id','name','customStats','createdAt'],
};

function rowToObj(headers, row) {
  const o = {}; headers.forEach((h,i) => { o[h] = row[i] ?? ''; }); return o;
}
function objToRow(headers, obj) {
  return headers.map(h => { const v = obj[h]; if (v===null||v===undefined) return ''; if (typeof v==='object') return JSON.stringify(v); return String(v); });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const token = await getAccessToken();

    if (req.method === 'GET') {
      const { tab, zoo_id } = req.query;
      if (!tab || !SCHEMAS[tab]) return res.status(400).json({ error:`Unknown tab: ${tab}` });
      const data = await sheetsGet(`${tab}!A:ZZ`, token);
      const rows = data.values || [];
      if (rows.length <= 1) return res.json({ rows:[] });
      const headers = rows[0];
      let result = rows.slice(1).map(r => rowToObj(headers, r));
      if (zoo_id) result = result.filter(r => r.zoo_id === zoo_id);
      return res.json({ rows:result });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
      const { tab, zoo_id, rows:newRows = [] } = body || {};
      if (!tab || !SCHEMAS[tab]) return res.status(400).json({ error:`Unknown tab: ${tab}` });
      const headers = SCHEMAS[tab];
      const existing = await sheetsGet(`${tab}!A:ZZ`, token);
      const existingRaw = existing.values || [];
      let allRows;
      if (existingRaw.length === 0) {
        allRows = [headers, ...newRows.map(r => objToRow(headers, {...r, zoo_id}))];
      } else {
        const exH = existingRaw[0];
        const zIdx = exH.indexOf('zoo_id');
        const otherRows = zIdx >= 0 ? existingRaw.slice(1).filter(r => r[zIdx] !== zoo_id && r[zIdx] !== '__all__') : existingRaw.slice(1);
        allRows = [headers, ...otherRows, ...newRows.map(r => objToRow(headers, {...r, zoo_id}))];
      }
      await sheetsClear(`${tab}!A:ZZ`, token);
      if (allRows.length > 0) await sheetsUpdate(`${tab}!A1`, allRows, token);
      return res.json({ ok:true, written:newRows.length });
    }

    return res.status(405).json({ error:'Method not allowed' });
  } catch(err) {
    console.error('[sheets]', err.message);
    return res.status(500).json({ error:err.message });
  }
}
