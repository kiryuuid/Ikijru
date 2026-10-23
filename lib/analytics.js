/**
 * Analytics Events — Komikcast
 * Semua event tracking terpusat di sini.
 * Gunakan fungsi ini di komponen/page, jangan panggil logEvent langsung.
 */
import { logEvent } from './firebase';

// ─── Page Views ────────────────────────────────────────────
export const trackPageView = (pageName, pageUrl) =>
  logEvent('page_view', { page_title: pageName, page_location: pageUrl });

// ─── Manga Events ──────────────────────────────────────────
/** Saat user membuka halaman detail manga */
export const trackMangaView = (manga) =>
  logEvent('view_item', {
    item_id: manga.slug,
    item_name: manga.title,
    item_category: manga.type || 'unknown',
    item_variant: manga.status || 'unknown',
    value: manga.rating || 0,
  });

/** Saat user mulai baca chapter */
export const trackReadChapter = (manga, chapterSlug) =>
  logEvent('read_chapter', {
    manga_slug: manga.slug,
    manga_title: manga.title,
    chapter_slug: chapterSlug,
    manga_type: manga.type || 'unknown',
  });

/** Saat user selesai baca (progress > 90%) */
export const trackReadComplete = (manga, chapterSlug) =>
  logEvent('read_complete', {
    manga_slug: manga.slug,
    manga_title: manga.title,
    chapter_slug: chapterSlug,
  });

// ─── Search Events ─────────────────────────────────────────
/** Saat user melakukan pencarian */
export const trackSearch = (keyword, resultCount = 0) =>
  logEvent('search', {
    search_term: keyword,
    result_count: resultCount,
  });

/** Saat user klik hasil pencarian */
export const trackSearchClick = (keyword, mangaSlug) =>
  logEvent('select_search_result', {
    search_term: keyword,
    item_id: mangaSlug,
  });

// ─── Bookmark Events ───────────────────────────────────────
/** Saat user menambah bookmark */
export const trackBookmarkAdd = (manga) =>
  logEvent('add_to_wishlist', {
    item_id: manga.slug,
    item_name: manga.title,
  });

/** Saat user menghapus bookmark */
export const trackBookmarkRemove = (mangaSlug) =>
  logEvent('remove_from_wishlist', { item_id: mangaSlug });

// ─── Auth Events ───────────────────────────────────────────
/** Saat user login */
export const trackLogin = (method) =>
  logEvent('login', { method }); // method: 'google' | 'email'

/** Saat user register */
export const trackSignUp = (method) =>
  logEvent('sign_up', { method });

// ─── Filter & Genre Events ─────────────────────────────────
/** Saat user pilih genre */
export const trackGenreClick = (genre) =>
  logEvent('select_genre', { genre_name: genre });

/** Saat user filter manga */
export const trackFilter = (filterType, filterValue) =>
  logEvent('apply_filter', {
    filter_type: filterType,  // 'type' | 'status' | 'order'
    filter_value: filterValue,
  });

// ─── Share Events ──────────────────────────────────────────
export const trackShare = (mangaSlug, method) =>
  logEvent('share', { item_id: mangaSlug, method });
