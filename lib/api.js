// ==========================================
// KONFIGURASI BASE URL
// ==========================================

const getBase = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  // Server-side
  const isDev = process.env.NODE_ENV === 'development';
  const siteUrl = isDev ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return `${siteUrl.replace(/\/+$/, '')}/api`;
};

// ==========================================
// NORMALISASI DATA
// ==========================================

export function normalizeManga(m) {
  if (!m) return null;
  const rating = parseFloat(m.metadata?.rating) || parseFloat(m.rating) || 0;
  return {
    ...m,
    coverImage: m.coverImage || m.thumb || '',
    type: m.type || m.metadata?.type || '',
    status: m.status || m.metadata?.status || '',
    author: m.author || m.metadata?.author || m.metadata?.Artist || '',
    synopsis: m.synopsis || m.metadata?.synopsis || m.metadata?.description || '',
    genres: m.genres || m.tags || [],
    tags: m.tags || m.genres || [],
    rating,
    last_update: m.last_update || m.updatedAt || null,
  };
}

export function normalizeMangaList(list = []) {
  return list.map(normalizeManga);
}

// ==========================================
// FETCH WRAPPER
// ==========================================

async function fetchAPI(endpoint, options = {}) {
  const base = getBase();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  try {
    const res = await fetch(`${base}${cleanEndpoint}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'API Error');

    return json;
  } catch (err) {
    console.error(`[API] ${endpoint}:`, err.message);
    return { success: false, data: null, pagination: null, error: err.message };
  }
}

// ==========================================
// 1. HOME PAGE DATA
// ==========================================
export async function getHomeData() {
  const res = await fetchAPI('/home');
  if (!res.success || !res.data) return res;

  return {
    ...res,
    data: {
      recents: normalizeMangaList(res.data.recents || []),
      trending: normalizeMangaList(res.data.trending || []),
      manhwas: normalizeMangaList(res.data.manhwas || []),
      doujinshis: normalizeMangaList(res.data.doujinshis || []),
      mangas: normalizeMangaList(res.data.mangas || []),
    },
  };
}

// ==========================================
// 2. MANGA LIST — Smart routing ke backend yang sesuai
// Backend:
//   GET /manga-list?page=&limit=         → semua manga A-Z
//   GET /search?q=...&page=&limit=       → cari by judul
//   GET /filter/genre/:val?page=&limit=  → filter genre
//   GET /filter/type/:val?page=&limit=   → filter type
//   GET /filter/status/:val?page=&limit= → filter status
// ==========================================
export async function getMangaList(params = {}) {
  const { q, genre, type, status, order, page = 1, limit = 24 } = params;

  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('limit', String(limit));

  if (q?.trim()) qs.set('q', q.trim());
  if (genre && genre !== 'all') qs.set('genre', genre);
  if (type && type !== 'all') qs.set('type', type);
  if (status && status !== 'all') qs.set('status', status);
  if (order && order !== 'latest') qs.set('order', order);

  const endpoint = `/manga-list?${qs.toString()}`;

  const res = await fetchAPI(endpoint);
  if (!res.success || !res.data) return res;

  const mangasData = Array.isArray(res.data) ? res.data : res.data.mangas || [];
  return {
    ...res,
    data: normalizeMangaList(mangasData),
  };
}

// ==========================================
// 3. MANGA DETAIL
// Backend: GET /manga/:slug → { info, chapters }
// ==========================================
export async function getMangaDetail(slug) {
  const res = await fetchAPI(`/manga/${encodeURIComponent(slug)}`);
  if (!res.success || !res.data) return res;

  return {
    ...res,
    data: {
      info: normalizeManga(res.data.info),
      chapters: res.data.chapters || [],
      recommendations: normalizeMangaList(res.data.recommendations || []),
    },
  };
}

// ==========================================
// 4. READ CHAPTER
// Backend: GET /read/:slug/:chapterSlug → { chapter, manga, navigation }
// ==========================================
export async function getChapter(slug, chapterSlug) {
  const res = await fetchAPI(
    `/read/${encodeURIComponent(slug)}/${encodeURIComponent(chapterSlug)}`
  );
  if (!res.success || !res.data) return res;

  return {
    ...res,
    data: {
      chapter: res.data.chapter,
      manga: normalizeManga(res.data.manga),
      navigation: res.data.navigation || { next: null, prev: null },
    },
  };
}

// ==========================================
// 5. GENRE LIST
// Backend: GET /genres → [{ name, count }]
// ==========================================
export async function getGenres() {
  return fetchAPI('/genres');
}

// ==========================================
// 6. USER API
// ==========================================

export async function syncUser(userData) {
  return fetchAPI('/users/sync', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getUser(googleId) {
  return fetchAPI(`/users/${googleId}`);
}

export async function getUserLibrary(googleId) {
  return fetchAPI(`/users/${googleId}/library`);
}

export async function addToLibrary(googleId, { slug, mangaData }) {
  return fetchAPI(`/users/${googleId}/library`, {
    method: 'POST',
    body: JSON.stringify({ slug, mangaData }),
  });
}

export async function removeFromLibrary(googleId, slug) {
  return fetchAPI(`/users/${googleId}/library/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

// Ambil semua riwayat baca
export async function getUserHistory(googleId) {
  return fetchAPI(`/users/${googleId}/history`);
}

export async function addToHistory(googleId, historyData) {
  return fetchAPI(`/users/${googleId}/history`, {
    method: 'POST',
    body: JSON.stringify(historyData),
  });
}

// Hapus satu item history berdasarkan slug manga
export async function removeFromHistory(googleId, slug) {
  return fetchAPI(`/users/${googleId}/history/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  });
}

// Hapus semua history (opsional filter by type)
export async function clearHistory(googleId, type = null) {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  return fetchAPI(`/users/${googleId}/history${qs}`, { method: 'DELETE' });
}

export async function getUserNotifications(googleId) {
  return fetchAPI(`/users/${googleId}/notifications`);
}

export async function markNotificationsRead(googleId) {
  return fetchAPI(`/users/${googleId}/notifications/read`, {
    method: 'PUT',
  });
}

export async function getPublicProfile(googleId) {
  return fetchAPI(`/users/${googleId}/public-profile`);
}

export async function updateBio(googleId, bio) {
  return fetchAPI(`/users/${googleId}/bio`, {
    method: 'PATCH',
    body: JSON.stringify({ bio }),
  });
}

// Ambil daftar user premium (untuk homepage showcase)
export async function getPremiumUsers() {
  return fetchAPI(`/users/premium`);
}

// Cek dan tambah hitungan download harian dari backend
// Return: { allowed, current?, max?, isPremium?, message? }
export async function checkDownloadLimit(googleId) {
  return fetchAPI(`/users/${googleId}/download`, {
    method: 'POST',
  });
}

// ==========================================
// 7. SITEMAP
// ==========================================
export async function getAllMangaSlugs() {
  const res = await fetchAPI(`/manga-list?page=1&limit=1000`);
  if (!res.success || !res.data) return [];
  return normalizeMangaList(Array.isArray(res.data) ? res.data : []);
}
