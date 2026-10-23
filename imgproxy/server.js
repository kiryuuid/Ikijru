const http = require('http');
const { URL } = require('url');
const { Readable } = require('stream');

const PORT = process.env.PORT || 3003;

const ALLOWED_HOSTS = new Set([
  'desu.photos',
  'images.manhwaland.email',
  'img.manhwaland.email',
  'cdn-images.doujindesu.fun',
  'datagambar.web.id',
  'drive.google.com',
  'docs.google.com',
  'lh3.googleusercontent.com',
  'img.komiku.org',
  'img.komiku.id',
  'komiku.org',
  'cdn.komiku.org',
  'komikcast.id',
  'cdn.komikcast.id',
  'i.ibb.co',
  'cdn.statically.io',
]);

function normalizeTargetUrl(rawUrl) {
  if (!rawUrl) return null;

  let url = String(rawUrl).trim();
  url = url.replace(
    /^https?:\/\/cdn\.manhwature\.com\/desu\.photos\//i,
    'https://desu.photos/'
  );
  url = url.replace(
    /^https?:\/\/desu\.photos\/uploads\//i,
    'https://desu.photos/storage/uploads/'
  );
  url = url.replace(
    /^https?:\/\/desu\.photos\/storage\/storage\/uploads\//i,
    'https://desu.photos/storage/uploads/'
  );

  const driveMatch = url.match(/https?:\/\/(?:drive|docs)\.google\.com\/uc\?id=([a-zA-Z0-9_-]+)/i);
  if (driveMatch) {
    url = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
  }

  return url;
}

function isAllowedHost(hostname) {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  for (const host of ALLOWED_HOSTS) {
    if (hostname.endsWith(`.${host}`)) return true;
  }
  if (
    hostname.endsWith('.top') ||
    hostname.endsWith('.cfd') ||
    hostname.includes('doujin') ||
    hostname.includes('manhwa') ||
    hostname.includes('hentai')
  ) {
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method Not Allowed');
    return;
  }

  // Parse query parameters
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  
  // Basic health check endpoint
  if (reqUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('OK');
    return;
  }

  const rawUrl = reqUrl.searchParams.get('url');
  const imageUrl = normalizeTargetUrl(rawUrl);

  if (!imageUrl) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('url parameter diperlukan');
    return;
  }

  let target;
  try {
    target = new URL(imageUrl);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('URL tidak valid');
    return;
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Protokol tidak didukung');
    return;
  }

  if (!isAllowedHost(target.hostname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Domain tidak diizinkan');
    return;
  }

  try {
    // Tentukan referer & origin terbaik berdasarkan target host / path
    let primaryReferer = 'https://desu.photos/';
    let primaryOrigin = 'https://desu.photos';

    if (
      target.hostname.endsWith('.top') ||
      target.hostname.includes('doujin') ||
      target.pathname.includes('picdn')
    ) {
      primaryReferer = 'https://doujindesu.ws/';
      primaryOrigin = 'https://doujindesu.ws';
    } else if (target.hostname.includes('manhwaland')) {
      primaryReferer = 'https://img.manhwaland.email/';
      primaryOrigin = 'https://img.manhwaland.email';
    } else if (target.hostname.includes('komiku') || target.hostname.includes('komikcast')) {
      primaryReferer = target.origin;
      primaryOrigin = target.origin;
    }

    let upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
        Referer: primaryReferer,
        Origin: primaryOrigin,
      },
    });

    // Fallback jika belum berhasil
    if (!upstream.ok && primaryReferer !== 'https://doujindesu.ws/') {
      upstream = await fetch(target.toString(), {
        method: 'GET',
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
          Referer: 'https://doujindesu.ws/',
          Origin: 'https://doujindesu.ws',
        },
      });
    }

    if (!upstream.ok) {
      res.writeHead(upstream.status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Gagal fetch gambar: ${upstream.status}`);
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/webp';
    
    // Set headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'X-Proxied': 'true',
    });

    // Stream response body if possible to save memory
    if (upstream.body) {
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      const buffer = await upstream.arrayBuffer();
      res.end(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('[img-proxy] Error:', error.message);
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Gagal mengambil gambar');
  }
});

server.listen(PORT, () => {
  console.log(`Image proxy server running on port ${PORT}`);
});
