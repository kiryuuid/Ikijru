'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { getUserHistory, removeFromHistory, clearHistory } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Format waktu relatif ─────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  if (d < 30) return `${d} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Warna badge berdasarkan tipe ────────────────────────
function typeBadgeClass(type) {
  const t = type?.toLowerCase() || '';
  if (t.includes('doujin')) return 'bg-pink-900/50 border-pink-700 text-pink-300';
  if (t.includes('manhwa')) return 'bg-purple-900/50 border-purple-700 text-purple-300';
  if (t.includes('manhua')) return 'bg-orange-900/50 border-orange-700 text-orange-300';
  return 'bg-blue-900/50 border-blue-700 text-blue-300';
}

// ─── Skeleton ─────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-3 bg-bg-card border border-border rounded-2xl p-3 animate-pulse">
          <div className="flex-none w-16 h-24 md:w-20 md:h-28 rounded-xl bg-bg-elevated" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 bg-bg-elevated rounded w-3/4" />
            <div className="h-2.5 bg-bg-elevated rounded w-1/2" />
            <div className="h-2 bg-bg-elevated rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dialog konfirmasi hapus semua ───────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-card border border-border rounded-2xl p-5 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-400">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-base">Hapus Riwayat?</h3>
            <p className="text-text-muted text-xs mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-semibold hover:border-accent-red/50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Item Card ────────────────────────────────────────────
function HistoryItem({ item, onRemove, removing }) {
  const coverImage = item.thumb || '';

  return (
    <div className="flex gap-3 bg-bg-card border border-border rounded-2xl p-3 hover:border-accent-red/30 transition-all hover:shadow-lg hover:shadow-black/20 group">
      {/* Cover */}
      <Link href={`/manga/${item.slug}`} className="flex-none">
        <div className="relative rounded-xl overflow-hidden bg-bg-elevated w-16 h-24 md:w-20 md:h-28">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={item.title || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 64px, 80px"
              referrerPolicy="no-referrer"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-text-muted">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 7h8M8 12h8M8 17h5" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <Link href={`/manga/${item.slug}`}>
            <h3 className="font-bold text-text-primary text-sm line-clamp-2 leading-tight hover:text-accent-red transition-colors">
              {item.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {item.type && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase border ${typeBadgeClass(item.type)}`}>
                {item.type}
              </span>
            )}
            {item.lastChapterTitle && (
              <span className="text-text-muted text-[10px] truncate max-w-[140px]">
                {item.lastChapterTitle}
              </span>
            )}
          </div>

          <p className="text-text-muted text-[10px] mt-1 flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {timeAgo(item.lastRead)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          {item.lastChapterSlug && (
            <Link
              href={`/read/${item.slug}/${item.lastChapterSlug}`}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-accent-red text-white hover:bg-accent-redDark transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Lanjut Baca
            </Link>
          )}
          <Link
            href={`/manga/${item.slug}`}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-red/40 hover:text-text-secondary transition-colors"
          >
            Detail
          </Link>

          <button
            onClick={() => onRemove(item.slug)}
            disabled={removing === item.slug}
            aria-label="Hapus dari riwayat"
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {removing === item.slug ? (
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function HistoryList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);   // slug yang sedang dihapus
  const [clearingAll, setClearingAll] = useState(false);
  const [confirm, setConfirm] = useState(null);   // { type: 'all' | 'item', slug? }
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Redirect jika belum login
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetchHistory();
  }, [user, authLoading]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserHistory(user.googleId);
      const rawData = Array.isArray(res.data) ? res.data : [];

      // Logic Autodelete: Filter out history older than 24 hours
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const validHistory = [];
      const expiredSlugs = [];

      rawData.forEach(item => {
        if (!item.lastRead) {
           // Jika tidak ada lastRead, kita anggap baru
           validHistory.push(item);
           return;
        }
        const diff = now - new Date(item.lastRead).getTime();
        if (diff > ONE_DAY_MS) {
           expiredSlugs.push(item.slug);
        } else {
           validHistory.push(item);
        }
      });

      // Update state hanya dengan riwayat yang valid (< 24 jam)
      setHistory(validHistory);

      // Secara asinkron (background) hapus yang expired dari backend
      // Digunakan untuk menjaga server db tetap ringan
      if (expiredSlugs.length > 0) {
        expiredSlugs.forEach(slug => {
          removeFromHistory(user.googleId, slug).catch(err => {
            console.warn(`Gagal hapus riwayat usang untuk ${slug}:`, err);
          });
        });
        console.log(`[History] Hapus ${expiredSlugs.length} item lebih dari 24 jam.`);
      }

    } catch (err) {
      console.error('[History] fetch error:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [user?.googleId]);

  // Hapus satu item
  const handleRemove = async (slug) => {
    setRemoving(slug);
    try {
      await removeFromHistory(user.googleId, slug);
      setHistory(prev => prev.filter(h => h.slug !== slug));
    } catch (err) {
      console.error('[History] remove error:', err);
    } finally {
      setRemoving(null);
    }
  };

  // Hapus semua
  const handleClearAll = async () => {
    setConfirm(null);
    setClearingAll(true);
    try {
      await clearHistory(user.googleId);
      setHistory([]);
    } catch (err) {
      console.error('[History] clear error:', err);
    } finally {
      setClearingAll(false);
    }
  };

  // Available types in history
  const uniqueTypes = Array.from(new Set(history.map(h => h.type?.toLowerCase()).filter(Boolean)));

  // Filter by search & type
  const filtered = history.filter(h => {
    const matchesSearch = !search.trim() ||
      h.title?.toLowerCase().includes(search.toLowerCase()) ||
      h.lastChapterTitle?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || h.type?.toLowerCase() === selectedType;
    return matchesSearch && matchesType;
  });

  // Render loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="pt-16 md:pt-20 pb-safe max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6">
            <div className="h-7 w-40 bg-bg-elevated rounded animate-pulse mb-1" />
            <div className="h-4 w-24 bg-bg-elevated rounded animate-pulse" />
          </div>
          <HistorySkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      {/* Dialog konfirmasi */}
      {confirm?.type === 'all' && (
        <ConfirmDialog
          message="Semua riwayat baca akan dihapus permanen."
          onConfirm={handleClearAll}
          onCancel={() => setConfirm(null)}
        />
      )}

      <main className="pt-16 md:pt-20 pb-safe max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────── */}
        <div className="pt-4 md:pt-6 pb-3">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-text-primary tracking-widest">RIWAYAT</h1>
              <p className="text-text-muted text-xs md:text-sm mt-0.5">
                {history.length} komik pernah dibaca
              </p>
            </div>

            {history.length > 0 && (
              <button
                onClick={() => setConfirm({ type: 'all' })}
                disabled={clearingAll}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-border text-text-muted hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                {clearingAll ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                  </svg>
                )}
                Hapus Semua
              </button>
            )}
          </div>

          {/* Filter Type Tabs */}
          {uniqueTypes.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-3 -mx-1 px-1">
              <button
                onClick={() => setSelectedType('all')}
                className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedType === 'all'
                    ? 'bg-accent-red text-white shadow-md shadow-accent-red/20'
                    : 'bg-bg-card border border-border text-text-muted hover:border-accent-red/40 hover:text-text-secondary'
                }`}
              >
                Semua
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  selectedType === 'all' ? 'bg-white/20 text-white' : 'bg-bg-elevated text-text-muted'
                }`}>
                  {history.length}
                </span>
              </button>
              {uniqueTypes.map(t => {
                const count = history.filter(h => h.type?.toLowerCase() === t).length;
                return (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                      selectedType === t
                        ? 'bg-accent-red text-white shadow-md shadow-accent-red/20'
                        : 'bg-bg-card border border-border text-text-muted hover:border-accent-red/40 hover:text-text-secondary'
                    }`}
                  >
                    {t}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      selectedType === t ? 'bg-white/20 text-white' : 'bg-bg-elevated text-text-muted'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Search / Filter */}
          {history.length > 3 && (
            <div className="flex items-center gap-2 bg-bg-elevated border border-border rounded-xl px-3 py-2.5 max-w-md">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari judul atau chapter..."
                className="flex-1 bg-transparent text-text-primary text-sm placeholder-text-muted outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-text-muted hover:text-text-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Empty State ─────────────────────────── */}
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-text-muted">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <p className="font-display text-xl text-text-secondary tracking-wider">BELUM ADA RIWAYAT</p>
            <p className="text-text-muted text-sm max-w-xs">
              Mulai baca komik, riwayatmu akan muncul di sini secara otomatis.
            </p>
            <Link
              href="/manga"
              className="mt-2 px-6 py-3 bg-accent-red text-white font-bold rounded-xl text-sm hover:bg-accent-redDark transition-colors"
            >
              Jelajahi Komik
            </Link>
          </div>
        )}

        {/* ── Hasil pencarian kosong ──────────────── */}
        {history.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
            <div className="w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-text-muted">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="text-text-secondary font-semibold text-sm">Tidak ada hasil untuk "{search}"</p>
            <button onClick={() => setSearch('')} className="text-accent-red text-sm font-bold">
              Reset pencarian
            </button>
          </div>
        )}

        {/* ── History List ────────────────────────── */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((item) => (
              <HistoryItem
                key={item.slug}
                item={item}
                onRemove={handleRemove}
                removing={removing}
              />
            ))}
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
