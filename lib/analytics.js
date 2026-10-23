/**
 * Analytics Events
 * Semua event tracking Firebase GA4 terpusat di sini.
 * Dilengkapi pengecekan defensive agar aman saat data masih loading/null.
 */
import { logEvent } from './firebase';

// ─── Page Views ────────────────────────────────────────────
export const trackPageView = (pageName, pageUrl) => {
  if (!pageUrl) return;
  logEvent('page_view', {
    page_title: pageName || '',
    page_location: pageUrl,
  });
};

// ─── Manga Events ──────────────────────────────────────────
/** Saat user membuka halaman detail manga */
export const trackMangaView = (manga) => {
  if (!manga || !manga.slug) return;
  const type = manga.metadata?.type || manga.type || 'unknown';
  const status = manga.metadata?.status || manga.status || 'unknown';
  const rating = parseFloat(manga.metadata?.rating || manga.rating) || 0;

  logEvent('view_item', {
    item_id: manga.slug,
    item_name: manga.title || '',
    item_category: type,
    item_variant: status,
    value: rating,
    items: [
      {
        item_id: manga.slug,
        item_name: manga.title || '',
        item_category: type,
        item_variant: status,
      },
    ],
  });
};

/** Saat user mulai baca chapter */
export const trackReadChapter = (manga, chapterSlug) => {
  if (!manga || !manga.slug || !chapterSlug) return;
  logEvent('read_chapter', {
    manga_slug: manga.slug,
    manga_title: manga.title || '',
    chapter_slug: chapterSlug,
    manga_type: manga.metadata?.type || manga.type || 'unknown',
  });
};

/** Saat user selesai baca (progress > 90%) */
export const trackReadComplete = (manga, chapterSlug) => {
  if (!manga || !manga.slug || !chapterSlug) return;
  logEvent('read_complete', {
    manga_slug: manga.slug,
    manga_title: manga.title || '',
    chapter_slug: chapterSlug,
  });
};

// ─── Search Events ─────────────────────────────────────────
/** Saat user melakukan pencarian */
export const trackSearch = (keyword, resultCount = 0) => {
  if (!keyword || typeof keyword !== 'string') return;
  logEvent('search', {
    search_term: keyword.trim(),
    result_count: Number(resultCount) || 0,
  });
};

/** Saat user klik hasil pencarian */
export const trackSearchClick = (keyword, mangaSlug) => {
  if (!mangaSlug) return;
  logEvent('select_search_result', {
    search_term: keyword || '',
    item_id: mangaSlug,
  });
};

// ─── Bookmark Events ───────────────────────────────────────
/** Saat user menambah bookmark */
export const trackBookmarkAdd = (manga) => {
  if (!manga || !manga.slug) return;
  logEvent('add_to_wishlist', {
    item_id: manga.slug,
    item_name: manga.title || '',
  });
};

/** Saat user menghapus bookmark */
export const trackBookmarkRemove = (mangaSlug) => {
  if (!mangaSlug) return;
  logEvent('remove_from_wishlist', { item_id: mangaSlug });
};

// ─── Auth Events ───────────────────────────────────────────
/** Saat user login */
export const trackLogin = (method) => {
  if (!method) return;
  logEvent('login', { method }); // method: 'google' | 'email'
};

/** Saat user register */
export const trackSignUp = (method) => {
  if (!method) return;
  logEvent('sign_up', { method });
};

// ─── Filter & Genre Events ─────────────────────────────────
/** Saat user pilih genre */
export const trackGenreClick = (genre) => {
  if (!genre) return;
  logEvent('select_genre', { genre_name: String(genre).trim() });
};

/** Saat user filter manga */
export const trackFilter = (filterType, filterValue) => {
  if (!filterType || !filterValue) return;
  logEvent('apply_filter', {
    filter_type: String(filterType), // 'type' | 'status' | 'order'
    filter_value: String(filterValue),
  });
};

// ─── Share Events ──────────────────────────────────────────
export const trackShare = (mangaSlug, method) => {
  if (!mangaSlug) return;
  logEvent('share', { item_id: mangaSlug, method: method || 'unknown' });
};
