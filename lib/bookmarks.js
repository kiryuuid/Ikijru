/**
 * lib/bookmarks.js
 * 
 * Library (Bookmark) & History — semua data disimpan ke BACKEND, bukan Firebase.
 * Backend endpoints yang digunakan:
 *   POST   /users/:googleId/library           → tambah / update manga di library
 *   GET    /users/:googleId/library           → ambil semua library user
 *   DELETE /users/:googleId/library/:slug     → hapus satu manga dari library
 *   GET    /users/:googleId/public-profile    → profil publik + library
 */

// ─── Reading Status Constants ─────────────────────────────
export const READING_STATUS = {
  READING:  'reading',
  TO_READ:  'to_read',
  FINISHED: 'finished',
  DROPPED:  'dropped',
};

export const READING_STATUS_LABEL = {
  reading:  'Sedang Dibaca',
  to_read:  'Mau Dibaca',
  finished: 'Selesai',
  dropped:  'Dihentikan',
};

// ─── Helper: proxy base URL (client-side only) ────────────
function proxyBase() {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const isDev = process.env.NODE_ENV === 'development';
  const siteUrl = isDev ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return `${siteUrl.replace(/\/+$/, '')}/api`;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${proxyBase()}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

// ─── 1. TAMBAH / UPDATE BOOKMARK ─────────────────────────
// mangaData yang disimpan ke backend:
//   { title, coverImage, type, status, rating, readingStatus,
//     lastChapterTitle, lastChapterSlug }
export async function addBookmark(userId, manga, readingStatus = READING_STATUS.READING) {
  await apiFetch(`/users/${userId}/library`, {
    method: 'POST',
    body: JSON.stringify({
      slug: manga.slug,
      mangaData: {
        title:            manga.title            || '',
        coverImage:       manga.coverImage       || manga.thumb || '',
        type:             manga.type             || '',
        status:           manga.status           || '',
        rating:           manga.rating           || 0,
        readingStatus,
        lastChapterTitle: manga.last_chapter      || manga.lastChapterTitle || '',
        lastChapterSlug:  manga.last_chapter_slug || manga.lastChapterSlug  || '',
      },
    }),
  });
}

// ─── 2. HAPUS BOOKMARK ───────────────────────────────────
export async function removeBookmark(userId, mangaSlug) {
  await apiFetch(`/users/${userId}/library/${encodeURIComponent(mangaSlug)}`, {
    method: 'DELETE',
  });
}

// ─── 3. UPDATE READING STATUS ────────────────────────────
// Ambil data lama dulu, lalu kirim ulang dengan status baru
export async function updateReadingStatus(userId, mangaSlug, readingStatus) {
  // Ambil item yang ada
  const library = await apiFetch(`/users/${userId}/library`);
  const item = library.find(b => b.slug === mangaSlug);
  if (!item) return;

  // Update readingStatus di mangaData
  await apiFetch(`/users/${userId}/library`, {
    method: 'POST',
    body: JSON.stringify({
      slug: mangaSlug,
      mangaData: { ...item.mangaData, readingStatus },
    }),
  });
}

// ─── 4. CEK APAKAH SUDAH DIBOOKMARK ─────────────────────
export async function isBookmarked(userId, mangaSlug) {
  if (!userId || !mangaSlug) return false;
  try {
    const library = await apiFetch(`/users/${userId}/library`);
    return library.some(b => b.slug === mangaSlug);
  } catch {
    return false;
  }
}

// ─── 5. AMBIL DATA BOOKMARK SPESIFIK ─────────────────────
// Return format disesuaikan supaya komponen yg pakai tetap bekerja:
// { slug, mangaSlug, coverImage, title, type, status, rating,
//   readingStatus, lastChapter, lastChapterSlug, id }
export async function getBookmarkData(userId, mangaSlug) {
  if (!userId || !mangaSlug) return null;
  try {
    const library = await apiFetch(`/users/${userId}/library`);
    const item = library.find(b => b.slug === mangaSlug);
    if (!item) return null;
    return normalizeLibraryItem(item);
  } catch {
    return null;
  }
}

// ─── 6. AMBIL SEMUA BOOKMARK USER ────────────────────────
export async function getUserBookmarks(userId) {
  if (!userId) return [];
  try {
    const library = await apiFetch(`/users/${userId}/library`);
    return library.map(normalizeLibraryItem);
  } catch (err) {
    console.error('[Bookmarks] getUserBookmarks error:', err.message);
    return [];
  }
}

// ─── 7. AMBIL BOOKMARK PUBLIK (untuk profil orang lain) ──
export async function getPublicBookmarks(userId) {
  if (!userId) return [];
  try {
    const profile = await apiFetch(`/users/${userId}/public-profile`);
    return (profile.library || []).map(normalizeLibraryItem);
  } catch (err) {
    console.error('[Bookmarks] getPublicBookmarks error:', err.message);
    return [];
  }
}

// ─── 8. HITUNG STATS BOOKMARK ────────────────────────────
export function calcBookmarkStats(bookmarks) {
  return bookmarks.reduce(
    (acc, b) => {
      const s = b.readingStatus || READING_STATUS.READING;
      if      (s === READING_STATUS.READING)  acc.reading++;
      else if (s === READING_STATUS.TO_READ)  acc.toRead++;
      else if (s === READING_STATUS.FINISHED) acc.finished++;
      else if (s === READING_STATUS.DROPPED)  acc.dropped++;
      return acc;
    },
    { reading: 0, toRead: 0, finished: 0, dropped: 0 }
  );
}

// ─── 9. TOGGLE (Simpan / Hapus Otomatis) ─────────────────
export async function toggleBookmark(userId, manga, readingStatus = READING_STATUS.READING) {
  const already = await isBookmarked(userId, manga.slug);
  if (already) {
    await removeBookmark(userId, manga.slug);
    return false;
  } else {
    await addBookmark(userId, manga, readingStatus);
    return true;
  }
}

// ─── INTERNAL: Normalisasi item library dari backend ─────
// Backend mengembalikan: { slug, mangaData: { ... }, addedAt }
// Kita normalisasi supaya komponen bisa pakai field yang familiar
export function normalizeLibraryItem(item) {
  if (!item) return null;
  const d = item.mangaData || {};
  return {
    // Field lama yang dipakai komponen
    id:               item.slug,           // dulu: Firebase doc id
    mangaSlug:        item.slug,           // dulu: b.mangaSlug
    slug:             item.slug,
    title:            d.title            || '',
    coverImage:       d.coverImage       || '',
    type:             d.type             || '',
    status:           d.status           || '',
    rating:           d.rating           || 0,
    readingStatus:    d.readingStatus    || READING_STATUS.READING,
    lastChapter:      d.lastChapterTitle || '',  // dulu: b.lastChapter
    lastChapterSlug:  d.lastChapterSlug  || '',  // dulu: b.lastChapterSlug
    addedAt:          item.addedAt,
    // Simpan mangaData asli jika perlu
    mangaData:        d,
  };
}
