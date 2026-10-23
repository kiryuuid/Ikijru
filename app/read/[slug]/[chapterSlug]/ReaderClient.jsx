'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings, List, ArrowLeft, X,
  ChevronLeft, ChevronRight, Home,
  Play, Pause, CircleAlert, Download,
  ArrowUp, ArrowDown, CheckCircle2, Search, Sliders,
  Maximize, Minimize, ArrowUpDown, MessageSquare, RotateCcw
} from 'lucide-react';
import AdBanner from '@/components/AdBanner';
import { useAuth } from '@/context/AuthContext';

// Gambar dengan proteksi klik kanan, long press, skeleton loading, dan auto-retry
function ProtectedImage({ src, alt, pageNum }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const longPressTimer = useRef(null);

  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => { }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRetry = (e) => {
    e.stopPropagation();
    setError(false);
    setLoaded(false);
    setRetryKey(k => k + 1);
  };

  return (
    <div className="relative w-full min-h-[320px] sm:min-h-[520px] bg-bg-card flex items-center justify-center overflow-hidden">
      {/* Loading Skeleton Placeholder */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-card/90 text-text-muted gap-2.5 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-accent-red/30 border-t-accent-red animate-spin" />
          <span className="text-[11px] font-mono font-medium text-text-muted">
            Memuat Halaman {pageNum}...
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {error && (
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center gap-3 z-10">
          <CircleAlert size={28} className="text-accent-red" />
          <p className="text-xs font-semibold text-text-muted">
            Gagal memuat gambar halaman {pageNum}
          </p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-bg-elevated hover:bg-accent-red hover:text-white border border-border text-text-secondary text-xs font-bold transition-all shadow-sm"
          >
            <RotateCcw size={13} />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      <img
        key={retryKey}
        src={src}
        alt={alt}
        className={`w-full h-auto block select-none transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'
          }`}
        loading={pageNum <= 3 ? 'eager' : 'lazy'}
        draggable={false}
        referrerPolicy="no-referrer"
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={() => {
          setError(true);
          setLoaded(false);
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        style={{
          WebkitTouchCallout: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>
  );
}

const IMAGE_PROXY_BASE = (process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || 'https://api-imagesme-dpcfela3jjz4.edgeone.dev').replace(/\/+$/, '');
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Pojokmanga';

function normalizeChapterImageUrl(rawUrl) {
  if (!rawUrl) return '';

  let url = String(rawUrl).trim();

  // Cegah double proxy
  if (url.includes('edgeone.dev') || url.includes('/api/image-proxy')) {
    return url;
  }

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

  // Jika URL mengarah ke CDN doujindesu / desu.photos / manhwaland / google drive / pihak ketiga
  if (
    /^https?:\/\/(images|img)\.manhwaland\.email\//i.test(url) ||
    /^https?:\/\/desu\.photos\//i.test(url) ||
    /google\.com\/uc\?id=/i.test(url) ||
    /lh3\.googleusercontent\.com/i.test(url) ||
    /\.top\//i.test(url) ||
    /picdn/i.test(url) ||
    /doujindesu/i.test(url) ||
    /datagambar/i.test(url)
  ) {
    return `${IMAGE_PROXY_BASE}/?url=${encodeURIComponent(url)}`;
  }

  return url;
}

function cleanChapterTitle(rawTitle) {
  if (!rawTitle) return '';
  let str = String(rawTitle).trim();
  str = str.replace(/^((chapter|ch\.?)\s*)+/i, '').trim();
  if (/^[\d.]/.test(str)) {
    return `Chapter ${str}`;
  }
  return str ? (str.toLowerCase().startsWith('chapter') ? str : `Chapter ${str}`) : 'Chapter';
}

const WIDTH_PRESETS = [
  { label: '650px', val: 650 },
  { label: '800px', val: 800 },
  { label: '950px', val: 950 },
  { label: '1150px', val: 1150 },
];

export default function ReaderClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { slug, chapterSlug } = params;

  const [data, setData] = useState(null);
  const [chapterList, setChapterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUI, setShowUI] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // 'settings' | 'chapters' | null
  const [progress, setProgress] = useState(0);
  const [imageWidth, setImageWidth] = useState(800);
  const [fitToWidth, setFitToWidth] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadCount, setDownloadCount] = useState(null);
  const [downloadLimit, setDownloadLimit] = useState(6);
  const [toastMsg, setToastMsg] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [chapterSortDesc, setChapterSortDesc] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const lastScrollY = useRef(0);
  const scrollInterval = useRef(null);

  // Blokir klik kanan di seluruh area baca
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Listen fullscreen state change
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  };

  // Inisialisasi Reader & Data
  useEffect(() => {
    async function initReader() {
      setLoading(true);
      setError(null);
      try {
        const proxyBase = `/api`;
        const resRead = await fetch(`${proxyBase}/read/${slug}/${chapterSlug}`);
        if (!resRead.ok) throw new Error(`HTTP ${resRead.status}`);
        const jsonRead = await resRead.json();

        if (!jsonRead.success) throw new Error(jsonRead.message || 'Gagal memuat chapter');
        setData(jsonRead.data);

        // Simpan history ke backend jika login
        const readData = jsonRead.data;
        if (user?.googleId && readData?.manga && readData?.chapter) {
          const manga = readData.manga;
          const chapter = readData.chapter;
          fetch(`${proxyBase}/users/${user.googleId}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: manga.metadata?.type || manga.type || 'manga',
              slug: manga.slug,
              title: manga.title,
              thumb: manga.thumb || manga.coverImage || '',
              lastChapterTitle: chapter.title,
              lastChapterSlug: chapter.slug,
            }),
          }).catch((err) => console.warn('[History] gagal simpan:', err.message));
        }

        // Ambil daftar chapter lengkap
        try {
          const resManga = await fetch(`${proxyBase}/manga/${slug}`);
          if (resManga.ok) {
            const jsonManga = await resManga.json();
            if (jsonManga.success && jsonManga.data?.chapters) {
              setChapterList(jsonManga.data.chapters);
            }
          }
        } catch (err) {
          console.warn('Gagal load chapter list:', err.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    initReader();
  }, [slug, chapterSlug, user?.googleId]);

  // Auto scroll
  useEffect(() => {
    if (isAutoScrolling) {
      const step = () => {
        window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 5) {
          setIsAutoScrolling(false);
        }
      };
      scrollInterval.current = setInterval(step, 16);
    } else {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    }
    return () => {
      if (scrollInterval.current) clearInterval(scrollInterval.current);
    };
  }, [isAutoScrolling, scrollSpeed]);

  // Scroll handler untuk progress bar & sembunyikan/tampilkan UI
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const newProgress = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
    setProgress(newProgress);

    if (!isAutoScrolling) {
      if (scrollTop < lastScrollY.current - 12) setShowUI(true);
      else if (scrollTop > lastScrollY.current + 12 && !activeMenu) setShowUI(false);
    }
    lastScrollY.current = scrollTop;
  }, [activeMenu, isAutoScrolling]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Fetch sisa download dari backend
  useEffect(() => {
    if (!user?.googleId || user?.isPremium || user?.isAdmin) return;
    const fetchDownloadCount = async () => {
      try {
        const proxyBase = `/api`;
        const res = await fetch(`${proxyBase}/users/${user.googleId}/download/status`);
        const json = await res.json();
        if (json.success && json.data) {
          setDownloadCount(json.data.used ?? 0);
          setDownloadLimit(json.data.limit ?? 6);
        }
      } catch {
        // Skip on error
      }
    };
    fetchDownloadCount();
  }, [user?.googleId, user?.isPremium, user?.isAdmin]);

  const toggleMenu = (menu) => {
    if (activeMenu === menu) setActiveMenu(null);
    else {
      setActiveMenu(menu);
      setIsAutoScrolling(false);
      setShowUI(true);
    }
  };

  const toggleAutoScroll = () => {
    setIsAutoScrolling(!isAutoScrolling);
    if (!isAutoScrolling) setShowUI(false);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === 'ArrowLeft') {
        if (data?.navigation?.prev) {
          router.push(`/read/${slug}/${data.navigation.prev}`);
        }
      } else if (e.key === 'ArrowRight') {
        if (data?.navigation?.next) {
          router.push(`/read/${slug}/${data.navigation.next}`);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        toggleAutoScroll();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        setActiveMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data?.navigation, slug, router, isAutoScrolling]);

  const isLoggedIn = !!user?.googleId;
  const isUnlimitedMember = !!(user?.isPremium || user?.isAdmin);

  const mangaTitle = data?.manga?.title || '';
  const chapterTitle = cleanChapterTitle(data?.chapter?.title || chapterSlug || '');

  const handleDownloadPdf = async () => {
    if (isDownloadingPdf) return;
    if (!isLoggedIn) {
      showToast('Silakan login terlebih dahulu untuk mengakses fitur Download.');
      return;
    }

    if (!isUnlimitedMember && downloadCount !== null && downloadCount >= downloadLimit) {
      showToast('Batas download harian tercapai. Upgrade Premium untuk akses tanpa batas!');
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const response = await fetch(`/api/download-pdf/${slug}/${chapterSlug}?uid=${user.googleId}`);

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        showToast(json.message || 'Gagal mendownload chapter.');
        if (response.status === 429) {
          setDownloadCount(downloadLimit);
        }
      } else if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const safeTitle = `${mangaTitle || slug || 'manga'} - ${chapterTitle || 'chapter'}`
          .replace(/[\\/:*?"<>|]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        a.download = `${safeTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        if (!isUnlimitedMember) {
          setDownloadCount((prev) => (prev !== null ? prev + 1 : null));
        }
      } else {
        showToast('Gagal mendownload chapter. Status: ' + response.status);
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat mendownload chapter.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const filteredChapters = useMemo(() => {
    let list = [...chapterList];
    if (chapterFilter.trim()) {
      const q = chapterFilter.trim().toLowerCase();
      list = list.filter(
        (ch) =>
          ch.title?.toLowerCase().includes(q) ||
          ch.slug?.toLowerCase().includes(q)
      );
    }
    if (!chapterSortDesc) {
      list.reverse();
    }
    return list;
  }, [chapterList, chapterFilter, chapterSortDesc]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-accent-red border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm font-semibold tracking-wider font-display">
            MEMUAT CHAPTER...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-bg-primary gap-4 px-4 text-center">
        <CircleAlert size={48} className="text-accent-red" />
        <p className="text-text-primary font-bold text-base">{error || 'Gagal memuat chapter'}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-bg-elevated hover:bg-bg-card border border-border text-text-primary rounded-xl text-xs font-bold transition-colors"
          >
            Kembali
          </button>
          <Link
            href={`/manga/${slug}`}
            className="px-5 py-2.5 bg-accent-red hover:bg-accent-redDark text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-accent-red/20"
          >
            Detail Komik
          </Link>
        </div>
      </div>
    );
  }

  const { chapter, manga, navigation } = data;

  return (
    <div className="bg-bg-primary min-h-screen relative text-text-primary font-sans select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-bg-card/95 backdrop-blur-xl border border-accent-red text-text-primary px-5 py-3 rounded-2xl text-xs sm:text-sm font-semibold shadow-2xl shadow-accent-red/30 animate-slide-up flex items-center gap-3">
          <CircleAlert size={16} className="text-accent-red flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <header
        className={`fixed top-0 left-0 right-0 h-14 md:h-16 bg-bg-card/90 backdrop-blur-xl z-40 border-b border-border shadow-lg transition-transform duration-300 ${showUI ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Left: Back & Titles */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <Link
              href={`/manga/${manga?.slug || slug}`}
              className="p-2 -ml-1 text-text-secondary hover:text-accent-red hover:bg-bg-elevated rounded-xl transition"
              title="Kembali ke Detail Komik"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex flex-col min-w-0">
              <h1 className="font-bold text-xs sm:text-sm text-text-primary truncate max-w-[190px] sm:max-w-xs md:max-w-md">
                {mangaTitle}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-bold text-accent-red tracking-wider">
                  {chapterTitle}
                </span>
                <span className="hidden sm:inline text-text-muted text-[10px]">·</span>
                <span className="hidden sm:inline text-text-muted text-[10px]">
                  {chapter.images?.length || 0} Halaman
                </span>
              </div>
            </div>
          </div>

          {/* Center (Desktop Quick Chapter Navigator) */}
          <div className="hidden md:flex items-center gap-1.5 bg-bg-elevated border border-border rounded-xl px-2 py-1">
            {navigation?.prev ? (
              <Link
                href={`/read/${slug}/${navigation.prev}`}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition"
                title="Chapter Sebelumnya"
              >
                <ChevronLeft size={18} />
              </Link>
            ) : (
              <span className="p-1 text-text-muted/40 cursor-not-allowed">
                <ChevronLeft size={18} />
              </span>
            )}

            <button
              onClick={() => toggleMenu('chapters')}
              className="px-2.5 py-1 text-xs font-bold text-text-secondary hover:text-accent-red transition-colors flex items-center gap-1.5"
            >
              <List size={14} />
              <span>Daftar Chapter</span>
            </button>

            {navigation?.next ? (
              <Link
                href={`/read/${slug}/${navigation.next}`}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-card transition"
                title="Chapter Selanjutnya"
              >
                <ChevronRight size={18} />
              </Link>
            ) : (
              <span className="p-1 text-text-muted/40 cursor-not-allowed">
                <ChevronRight size={18} />
              </span>
            )}
          </div>

          {/* Right: Progress & Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-bg-elevated border border-border text-text-primary px-2.5 py-1 rounded-lg text-[11px] font-bold">
              <span className="text-accent-red">{progress}%</span>
              <span className="text-text-muted hidden sm:inline">baca</span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-border bg-bg-elevated text-text-secondary hover:text-accent-red hover:border-accent-red/50 transition-colors hidden sm:flex items-center justify-center"
              title={isFullscreen ? 'Keluar Fullscreen (F)' : 'Layar Penuh (F)'}
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            <button
              onClick={() => toggleMenu('settings')}
              className={`p-2 rounded-xl border border-border transition-colors hidden sm:flex items-center justify-center ${activeMenu === 'settings'
                  ? 'bg-accent-red text-white border-accent-red shadow-glow-red-sm'
                  : 'bg-bg-elevated text-text-secondary hover:text-accent-red hover:border-accent-red/50'
                }`}
              title="Pengaturan Tampilan"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Dynamic Reading Progress Bar at Header Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-bg-elevated overflow-hidden">
          <div
            className="h-full bg-accent-red shadow-[0_0_8px_rgba(244,63,94,0.7)] transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── MAIN CONTENT (IMAGES) ── */}
      <div
        className="min-h-screen w-full pb-36 pt-16 md:pt-20 cursor-pointer"
        onClick={() => {
          if (activeMenu) setActiveMenu(null);
          else setShowUI((v) => !v);
        }}
      >
        <div
          className="mx-auto transition-[max-width] duration-300 ease-out"
          style={{
            maxWidth: fitToWidth ? '100%' : `${imageWidth}px`,
            padding: fitToWidth ? '0' : '0 0.5rem',
          }}
        >
          <AdBanner slot="READER_TOP" className="mb-4" />

          {/* Manga Pages Flow */}
          {chapter.images?.length > 0 ? (
            <div className="flex flex-col items-center bg-black/40 shadow-2xl rounded-xl overflow-hidden">
              {chapter.images.map((img, idx) => (
                <ProtectedImage
                  key={idx}
                  src={normalizeChapterImageUrl(img)}
                  alt={`Halaman ${idx + 1}`}
                  pageNum={idx + 1}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <CircleAlert size={48} className="text-accent-gold" />
              <p className="text-text-muted text-sm font-semibold">
                Tidak ada gambar di chapter ini.
              </p>
            </div>
          )}

          <AdBanner slot="READER_BOTTOM" className="mt-6 mb-4" />

          {/* ── SEO KEYWORDS & INFO SECTION ── */}
          <section
            aria-label="Informasi Komik & SEO"
            className="mt-10 mb-24 sm:mb-28 bg-bg-card/40 border border-border rounded-2xl p-5 sm:p-6 text-left max-w-3xl mx-auto backdrop-blur-sm"
          >
            <h2 className="text-xs sm:text-sm font-bold text-text-primary tracking-wide mb-2 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-accent-red rounded-full" />
              <span>Baca {mangaTitle} {chapterTitle} Bahasa Indonesia</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-text-muted leading-relaxed mb-4">
              Kamu sedang membaca komik <strong className="text-text-secondary">{mangaTitle} {chapterTitle}</strong> bahasa Indonesia secara online dan gratis di <strong className="text-text-secondary">{SITE_NAME}</strong>. Jangan lupa untuk melihat seluruh daftar chapter komik ini di halaman{' '}
              <Link
                href={`/manga/${manga?.slug || slug}`}
                className="text-accent-red hover:underline font-semibold"
              >
                {mangaTitle}
              </Link>{' '}
              dan nikmati berbagai koleksi komik manga, manhwa, dan manhua pilihan terlengkap lainnya.
            </p>

            {/* Keyword Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mr-1">
                Keywords:
              </span>
              {[
                `Baca ${mangaTitle} ${chapterTitle}`,
                `Komik ${mangaTitle} ${chapterTitle}`,
                `${mangaTitle} Bahasa Indonesia`,
                `Download ${mangaTitle} PDF`,
                `Manga ${mangaTitle}`,
                SITE_NAME,
              ].map((kw, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg bg-bg-elevated/70 border border-border text-[10px] font-medium text-text-muted hover:text-text-secondary transition"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ── FLOATING SCROLL BUTTONS ── */}
      <div
        className={`fixed right-4 sm:right-6 bottom-24 z-40 flex flex-col gap-2.5 transition-opacity duration-300 ${showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <button
          onClick={scrollToTop}
          className="w-10 h-10 bg-bg-card/90 backdrop-blur-md border border-border shadow-xl rounded-full flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-bg-elevated transition-all active:scale-95"
          aria-label="Scroll to Top"
          title="Scroll ke Atas"
        >
          <ArrowUp size={18} />
        </button>
        <button
          onClick={scrollToBottom}
          className="w-10 h-10 bg-bg-card/90 backdrop-blur-md border border-border shadow-xl rounded-full flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-bg-elevated transition-all active:scale-95"
          aria-label="Scroll to Bottom"
          title="Scroll ke Bawah"
        >
          <ArrowDown size={18} />
        </button>
      </div>

      {/* ── BOTTOM DOCK ── */}
      <div
        className={`fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 transition-all duration-300 pointer-events-none ${showUI ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
      >
        <div className="pointer-events-auto bg-bg-card/95 backdrop-blur-2xl border border-border shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-full px-4 py-2 sm:px-6 sm:py-2.5 flex items-center gap-3 sm:gap-6 justify-between">
          {/* Prev Chapter */}
          {navigation?.prev ? (
            <Link
              href={`/read/${slug}/${navigation.prev}`}
              className="text-text-muted hover:text-text-primary transition active:scale-95 p-1"
              title="Chapter Sebelumnya (←)"
            >
              <ChevronLeft size={20} />
            </Link>
          ) : (
            <span className="text-text-muted/30 cursor-not-allowed p-1">
              <ChevronLeft size={20} />
            </span>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => toggleMenu('settings')}
            className={`transition active:scale-95 p-1 ${activeMenu === 'settings'
                ? 'text-accent-red'
                : 'text-text-muted hover:text-text-primary'
              }`}
            title="Pengaturan Tampilan"
          >
            <Settings size={20} />
          </button>

          {/* Auto Scroll Toggle */}
          <button
            onClick={toggleAutoScroll}
            className={`transition active:scale-95 relative p-1.5 rounded-full flex items-center gap-1 ${isAutoScrolling
                ? 'text-accent-red bg-accent-red/10 border border-accent-red/30'
                : 'text-text-muted hover:text-text-primary'
              }`}
            title="Auto Scroll (Space)"
          >
            {isAutoScrolling ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {isAutoScrolling && (
              <span className="text-[10px] font-mono font-bold pr-1">{scrollSpeed}x</span>
            )}
          </button>

          {/* Chapters Modal Toggle */}
          <button
            onClick={() => toggleMenu('chapters')}
            className={`transition active:scale-95 p-1 ${activeMenu === 'chapters'
                ? 'text-accent-red'
                : 'text-text-muted hover:text-text-primary'
              }`}
            title="Pilih Chapter"
          >
            <List size={20} />
          </button>

          {/* Home Link */}
          <Link
            href={`/manga/${manga?.slug || slug}`}
            className="text-text-muted hover:text-accent-red transition active:scale-95 p-1"
            title="Detail Komik"
          >
            <Home size={20} />
          </Link>

          {/* Next Chapter */}
          {navigation?.next ? (
            <Link
              href={`/read/${slug}/${navigation.next}`}
              className="text-text-muted hover:text-text-primary transition active:scale-95 p-1"
              title="Chapter Selanjutnya (→)"
            >
              <ChevronRight size={20} />
            </Link>
          ) : (
            <span className="text-text-muted/30 cursor-not-allowed p-1">
              <ChevronRight size={20} />
            </span>
          )}
        </div>
      </div>

      {/* ── SETTINGS MODAL ── */}
      {activeMenu === 'settings' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setActiveMenu(null)}
        >
          <div
            className="w-full max-w-md bg-bg-card border border-border rounded-2xl shadow-2xl p-5 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-accent-red" />
                <span className="text-sm font-bold text-text-primary tracking-wide">
                  Pengaturan Tampilan
                </span>
              </div>
              <button
                onClick={() => setActiveMenu(null)}
                className="text-text-muted hover:text-accent-red transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Download PDF Section */}
              <div className="p-3 rounded-xl bg-bg-elevated border border-border">
                <button
                  onClick={handleDownloadPdf}
                  disabled={
                    isDownloadingPdf ||
                    !isLoggedIn ||
                    (!isUnlimitedMember && downloadCount !== null && downloadCount >= downloadLimit)
                  }
                  className={`w-full flex items-center justify-between text-xs font-bold px-3 py-2.5 rounded-xl transition-all shadow-sm ${isDownloadingPdf ||
                      !isLoggedIn ||
                      (!isUnlimitedMember && downloadCount !== null && downloadCount >= downloadLimit)
                      ? 'text-text-muted border border-border cursor-not-allowed bg-bg-card'
                      : 'text-white bg-accent-red hover:bg-accent-redDark shadow-accent-red/20'
                    }`}
                >
                  <span>
                    {isDownloadingPdf
                      ? 'MEMPROSES PDF...'
                      : !isLoggedIn
                        ? 'LOGIN UNTUK DOWNLOAD PDF'
                        : isUnlimitedMember
                          ? 'DOWNLOAD CHAPTER PDF (∞)'
                          : !isUnlimitedMember &&
                            downloadCount !== null &&
                            downloadCount >= downloadLimit
                            ? 'BATAS DOWNLOAD TERCAPAI'
                            : 'DOWNLOAD CHAPTER PDF'}
                  </span>
                  <Download size={15} />
                </button>

                {/* Info sisa download */}
                {!isLoggedIn && (
                  <p className="text-[10px] text-accent-gold mt-2">
                    Fitur download PDF hanya untuk member terdaftar.
                  </p>
                )}
                {isLoggedIn && !isUnlimitedMember && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                        Kuota Download Hari Ini
                      </span>
                      {downloadCount !== null ? (
                        <span
                          className={`text-[10px] font-bold ${downloadLimit - downloadCount <= 0
                              ? 'text-accent-red'
                              : downloadLimit - downloadCount <= 2
                                ? 'text-accent-gold'
                                : 'text-emerald-400'
                            }`}
                        >
                          {Math.max(0, downloadLimit - downloadCount)}/{downloadLimit}
                        </span>
                      ) : (
                        <span className="text-[10px] text-text-muted">...</span>
                      )}
                    </div>
                    {downloadCount !== null && (
                      <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${downloadLimit - downloadCount <= 0
                              ? 'bg-accent-red'
                              : downloadLimit - downloadCount <= 2
                                ? 'bg-accent-gold'
                                : 'bg-emerald-500'
                            }`}
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                ((downloadLimit - downloadCount) / downloadLimit) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {isLoggedIn && isUnlimitedMember && (
                  <p className="text-[10px] text-emerald-400 mt-2 font-semibold">
                    ✓ Kuota tidak terbatas (Akun Premium/VIP)
                  </p>
                )}
              </div>

              {/* Lebar Gambar & Preset */}
              <div>
                <div className="flex justify-between items-center text-xs text-text-secondary mb-2 font-bold">
                  <span>LEBAR TAMPILAN</span>
                  <span className="text-accent-red font-mono">
                    {fitToWidth ? 'FIT (100%)' : `${imageWidth}px`}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                  {WIDTH_PRESETS.map((p) => (
                    <button
                      key={p.val}
                      onClick={() => {
                        setFitToWidth(false);
                        setImageWidth(p.val);
                      }}
                      className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${!fitToWidth && imageWidth === p.val
                          ? 'bg-accent-red text-white border-accent-red shadow-sm'
                          : 'bg-bg-elevated border-border text-text-muted hover:border-accent-red/50 hover:text-text-primary'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setFitToWidth(!fitToWidth)}
                    className={`py-1 text-[11px] font-bold rounded-lg border transition-all ${fitToWidth
                        ? 'bg-accent-red text-white border-accent-red shadow-sm'
                        : 'bg-bg-elevated border-border text-text-muted hover:border-accent-red/50 hover:text-text-primary'
                      }`}
                  >
                    FIT
                  </button>
                </div>

                <input
                  type="range"
                  min="400"
                  max="1400"
                  step="50"
                  value={imageWidth}
                  disabled={fitToWidth}
                  onChange={(e) => setImageWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-bg-elevated rounded-lg appearance-none cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Kecepatan Auto Scroll */}
              <div>
                <div className="flex justify-between items-center text-xs text-text-secondary mb-2 font-bold">
                  <span>KECEPATAN AUTO-SCROLL</span>
                  <span className="text-accent-red font-mono">{scrollSpeed}x</span>
                </div>
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 5, 8].map((s) => (
                    <button
                      key={s}
                      onClick={() => setScrollSpeed(s)}
                      className={`flex-1 py-1 text-[11px] font-bold rounded-lg border transition-all ${scrollSpeed === s
                          ? 'bg-accent-red text-white border-accent-red'
                          : 'bg-bg-elevated border-border text-text-muted hover:text-text-primary'
                        }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scrollSpeed}
                  onChange={(e) => setScrollSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-bg-elevated rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Keyboard Shortcuts Guide */}
              <div className="pt-2.5 border-t border-border text-[10px] text-text-muted flex flex-wrap justify-between gap-1">
                <span>[←] Prev · [→] Next · [Space] Scroll · [F] Fullscreen</span>
                <span className="font-mono text-text-secondary">ESC Tutup</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CHAPTER SELECTOR MODAL ── */}
      {activeMenu === 'chapters' && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
          onClick={() => setActiveMenu(null)}
        >
          <div
            className="w-full max-w-xl bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-bg-elevated">
              <div className="flex items-center gap-2">
                <List size={18} className="text-accent-red" />
                <h3 className="font-bold text-sm text-text-primary">
                  Daftar Chapter ({chapterList.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChapterSortDesc(!chapterSortDesc)}
                  className="p-1.5 text-xs text-text-muted hover:text-text-primary bg-bg-card border border-border rounded-lg flex items-center gap-1 transition"
                  title="Urutkan Chapter"
                >
                  <ArrowUpDown size={13} />
                  <span className="text-[10px] font-bold">
                    {chapterSortDesc ? 'Terbaru' : 'Terlama'}
                  </span>
                </button>
                <button
                  onClick={() => setActiveMenu(null)}
                  className="text-text-muted hover:text-accent-red transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chapter Search Filter */}
            {chapterList.length > 4 && (
              <div className="p-3 border-b border-border bg-bg-card">
                <div className="flex items-center gap-2 bg-bg-elevated border border-border rounded-xl px-3 py-2">
                  <Search size={14} className="text-text-muted" />
                  <input
                    type="text"
                    value={chapterFilter}
                    onChange={(e) => setChapterFilter(e.target.value)}
                    placeholder="Cari chapter (misal: 1, 2, prolog)..."
                    className="flex-1 bg-transparent text-text-primary text-xs outline-none placeholder:text-text-muted"
                  />
                  {chapterFilter && (
                    <button
                      onClick={() => setChapterFilter('')}
                      className="text-text-muted hover:text-text-primary"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Chapter Buttons Grid */}
            <div className="p-3.5 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-[50vh]">
              {filteredChapters.length > 0 ? (
                filteredChapters.map((ch) => {
                  const chNumber = cleanChapterTitle(ch.title || ch.slug || '?').replace(
                    /Chapter\s*/i,
                    ''
                  );
                  const isCurrent = ch.slug === chapterSlug;
                  return (
                    <Link
                      key={ch._id || ch.slug}
                      href={`/read/${slug}/${ch.slug}`}
                      className={`h-11 flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all border ${isCurrent
                          ? 'bg-accent-red text-white border-accent-red shadow-glow-red-sm scale-105'
                          : 'bg-bg-elevated border-border text-text-secondary hover:border-accent-red hover:text-accent-red hover:bg-bg-card'
                        }`}
                      title={ch.title || `Chapter ${chNumber}`}
                    >
                      <span className="text-[9px] uppercase opacity-70 leading-none">CH</span>
                      <span className="truncate max-w-[48px] text-center font-mono">
                        {chNumber}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-text-muted text-xs">
                  Tidak ada chapter ditemukan.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
