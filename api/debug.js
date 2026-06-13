import { createSign } from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const rawKey = process.env.GOOGLE_PRIVATE_KEY || '';

  let key = rawKey.replace(/\\n/g, '\n');
  if (key.startsWith('"')) key = key.slice(1);
  if (key.endsWith('"'))  key = key.slice(0, -1);
  key = key.replace(/\\n/g, '\n');

  const info = {
    email_set: !!email,
    email_preview: email ? email.slice(0, 40) : 'MISSING',
    key_raw_length: rawKey.length,
    key_normalized_length: key.length,
    key_starts_with: key.slice(0, 40),
    key_has_begin: key.includes('-----BEGIN'),
    key_has_end: key.includes('-----END'),
    key_newline_count: (key.match(/\n/g)||[]).length,
  };

  try {
    const now = Math.floor(Date.now() / 1000);
    function b64url(v) { return Buffer.from(typeof v==='string'?v:JSON.stringify(v)).toString('base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_'); }
    const h = b64url({ alg:'RS256', typ:'JWT' });
    const p = b64url({ iss:email, scope:'https://www.googleapis.com/auth/spreadsheets', aud:'https://oauth2.googleapis.com/token', iat:now, exp:now+3600 });
    const s = createSign('RSA-SHA256'); s.update(`${h}.${p}`);
    const sig = s.sign(key,'base64').replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${h}.${p}.${sig}`}) });
    const tokenData = await tokenRes.json();
    info.token_result = tokenData.access_token ? '✅ Token OK — credentials are correct!' : `❌ ${JSON.stringify(tokenData)}`;
  } catch(e) {
    info.token_error = e.message;
  }

  res.status(200).json(info);
}
