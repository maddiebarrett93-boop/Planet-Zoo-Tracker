// Image proxy — fetches Fandom wiki images server-side to bypass hotlink protection
// Usage: /api/img?url=https://static.wikia.nocookie.net/...

module.exports = async function handler(req, res) {
  const { url } = req.query;

  if (!url) return res.status(400).end('Missing url param');

  // Only allow Fandom/wikia image CDN
  if (!url.startsWith('https://static.wikia.nocookie.net/') &&
      !url.startsWith('https://vignette.wikia.nocookie.net/')) {
    return res.status(403).end('Blocked domain');
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        // Pretend to be a browser visiting the wiki page directly
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'Referer': 'https://planetzoo.fandom.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).end(`Upstream: ${upstream.status}`);
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 1 week
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buffer);

  } catch (err) {
    console.error('[img proxy error]', err.message);
    return res.status(500).end(err.message);
  }
};
