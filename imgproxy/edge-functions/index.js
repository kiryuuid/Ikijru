/**
 * Tencent Cloud EdgeOne Pages Function - Image Proxy
 * 
 * File ini dipetakan secara otomatis ke root URL (/) situs EdgeOne Pages Anda.
 * Format: ES Modules dengan ekspor default `onRequest`.
 */

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

export default async function onRequest(context) {
  const request = context.request;

  // Header CORS dasar untuk semua respons
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Pragma',
  };

  // 1. Tangani request preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Hanya izinkan metode GET
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  const url = new URL(request.url);

  // 3. Endpoint pengecekan kesehatan (Health Check)
  if (url.pathname === '/health') {
    return new Response('OK', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  // 4. Ambil query parameter 'url' dan lakukan normalisasi
  const rawUrl = url.searchParams.get('url');
  const imageUrl = normalizeTargetUrl(rawUrl);

  if (!imageUrl) {
    return new Response('url parameter diperlukan', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  // 5. Validasi format URL target
  let target;
  try {
    target = new URL(imageUrl);
  } catch {
    return new Response('URL tidak valid', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  // 6. Validasi protokol (hanya http/https)
  if (!['http:', 'https:'].includes(target.protocol)) {
    return new Response('Protokol tidak didukung', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  // 7. Validasi domain (apakah masuk whitelist atau pola yang diizinkan)
  if (!isAllowedHost(target.hostname)) {
    return new Response('Domain tidak diizinkan', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }

  // 8. Lakukan request ke server gambar asli (upstream)
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

    // Jika upstream gagal merespons dengan sukses
    if (!upstream.ok) {
      return new Response(`Gagal fetch gambar: ${upstream.status}`, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          ...corsHeaders,
        },
      });
    }

    const contentType = upstream.headers.get('content-type') || 'image/webp';

    // Buat header respons baru
    const responseHeaders = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'X-Proxied': 'true',
    });

    // Tambahkan header CORS ke respons akhir
    for (const [key, value] of Object.entries(corsHeaders)) {
      responseHeaders.set(key, value);
    }

    // Kembalikan stream body agar hemat memori di edge node
    return new Response(upstream.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[img-proxy] Error:', error.message);
    return new Response('Gagal mengambil gambar', {
      status: 502,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ...corsHeaders,
      },
    });
  }
}
