export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).end('Missing url');
  if (!url.startsWith('https://static.wikia.nocookie.net/') && !url.startsWith('https://vignette.wikia.nocookie.net/'))
    return res.status(403).end('Blocked domain');
  try {
    const upstream = await fetch(url, { headers: { 'User-Agent':'Mozilla/5.0','Referer':'https://planetzoo.fandom.com/' } });
    if (!upstream.ok) return res.status(upstream.status).end(`Upstream: ${upstream.status}`);
    const ct = upstream.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control','public,max-age=604800,immutable');
    res.setHeader('Access-Control-Allow-Origin','*');
    return res.status(200).send(buf);
  } catch(e) { return res.status(500).end(e.message); }
}
