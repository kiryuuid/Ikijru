'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  getUserBookmarks,
  removeBookmark,
  updateReadingStatus,
  calcBookmarkStats,
  READING_STATUS,
} from '@/lib/bookmarks';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: READING_STATUS.READING, label: 'Dibaca' },
  { key: READING_STATUS.TO_READ, label: 'Mau Dibaca' },
  { key: READING_STATUS.FINISHED, label: 'Selesai' },
  { key: READING_STATUS.DROPPED, label: 'Dihentikan' },
];

const STATUS_OPTIONS = [
  { key: READING_STATUS.READING, label: 'Sedang Dibaca', },
  { key: READING_STATUS.TO_READ, label: 'Mau Dibaca', },
  { key: READING_STATUS.FINISHED, label: 'Selesai', },
  { key: READING_STATUS.DROPPED, label: 'Dihentikan', },
];

export default function BookmarkList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [statusMenu, setStatusMenu] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    fetchBookmarks();
  }, [user, authLoading]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      // getUserBookmarks sudah me-normalisasi data ke format yang dipakai komponen
      const data = await getUserBookmarks(user.googleId);
      setBookmarks(data);
    } catch (err) {
      console.error('[BookmarkList] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (mangaSlug) => {
    setRemoving(mangaSlug);
    try {
      await removeBookmark(user.googleId, mangaSlug);
      setBookmarks(prev => prev.filter(b => b.slug !== mangaSlug));
    } catch (err) {
      console.error('[BookmarkList] remove error:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleStatusChange = async (mangaSlug, newStatus) => {
    setStatusMenu(null);
    try {
      await updateReadingStatus(user.googleId, mangaSlug, newStatus);
      setBookmarks(prev =>
        prev.map(b => b.slug === mangaSlug ? { ...b, readingStatus: newStatus } : b)
      );
    } catch (err) {
      console.error('[BookmarkList] update status error:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin" />
      </div>
    );
  }

  const stats = calcBookmarkStats(bookmarks);
  const filtered = activeTab === 'all'
    ? bookmarks
    : bookmarks.filter(b => (b.readingStatus || READING_STATUS.READING) === activeTab);

  const tabCount = (key) => {
    if (key === 'all') return bookmarks.length;
    return bookmarks.filter(b => (b.readingStatus || READING_STATUS.READING) === key).length;
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-16 md:pt-20 pb-safe max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-text-primary tracking-widest">BOOKMARK</h1>
              <p className="text-text-muted text-xs md:text-sm mt-0.5">{bookmarks.length} komik tersimpan</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/user/${user?.googleId}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-text-muted text-xs font-semibold hover:border-accent-red/50 hover:text-text-primary transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Profil
              </Link>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent-red flex items-center justify-center text-white text-xs font-bold">
                  {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex items-center gap-4 mt-3 text-xs md:text-sm">
            <span className="text-accent-red font-bold">{stats.reading} <span className="text-text-muted font-normal">dibaca</span></span>
            <span className="text-blue-400 font-bold">{stats.toRead} <span className="text-text-muted font-normal">mau dibaca</span></span>
            <span className="text-green-400 font-bold">{stats.finished} <span className="text-text-muted font-normal">selesai</span></span>
            <span className="text-gray-400 font-bold">{stats.dropped} <span className="text-text-muted font-normal">dihentikan</span></span>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 mt-4 -mx-1 px-1 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === tab.key
                    ? 'bg-accent-red text-white shadow-lg shadow-accent-red/30'
                    : 'bg-bg-card border border-border text-text-muted hover:border-accent-red/40'
                  }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-bg-elevated text-text-muted'
                  }`}>
                  {tabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-text-muted">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="font-display text-xl text-text-secondary tracking-wider">BELUM ADA BOOKMARK</p>
            <p className="text-text-muted text-sm">Tap tombol "Simpan" di halaman detail manga untuk menyimpannya di sini.</p>
            <Link href="/manga" className="mt-2 px-6 py-3 bg-accent-red text-white font-bold rounded-xl text-sm hover:bg-accent-redDark transition-colors">
              Jelajahi Komik
            </Link>
          </div>
        )}

        {/* Bookmark list */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((b) => {
              // b sudah dinormalisasi oleh normalizeLibraryItem di lib/bookmarks.js
              // Field: slug, mangaSlug, title, coverImage, type, status, readingStatus,
              //        lastChapter (=lastChapterTitle), lastChapterSlug
              const statusOpt = STATUS_OPTIONS.find(o => o.key === (b.readingStatus || READING_STATUS.READING));
              return (
                <div
                  key={b.slug}
                  className="flex gap-3 bg-bg-card border border-border rounded-2xl p-3 hover:border-accent-red/40 transition-all hover:shadow-lg hover:shadow-black/20"
                >
                  {/* Cover */}
                  <Link href={`/manga/${b.slug}`} className="flex-none group">
                    <div className="rounded-xl overflow-hidden bg-bg-elevated w-16 h-24 md:w-20 md:h-28 relative">
                      {b.coverImage ? (
                        <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-text-muted">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7h8M8 12h8M8 17h5" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <Link href={`/manga/${b.slug}`}>
                        <h3 className="font-bold text-text-primary text-sm md:text-base line-clamp-2 leading-tight hover:text-accent-red transition-colors">
                          {b.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {b.type && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${b.type?.toLowerCase() === 'manhwa' ? 'bg-blue-900/50 border-blue-700 text-blue-300'
                              : b.type?.toLowerCase() === 'manhua' ? 'bg-orange-900/50 border-orange-700 text-orange-300'
                                : 'bg-blue-900/50 border-blue-700 text-blue-300'
                            }`}>{b.type}</span>
                        )}
                        {b.status && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${b.status?.toLowerCase() === 'ongoing'
                              ? 'bg-green-900/50 border-green-700 text-green-300'
                              : 'bg-gray-800 border-gray-600 text-gray-400'
                            }`}>{b.status}</span>
                        )}
                        {statusOpt && (
                          <span className="text-[10px] font-semibold text-text-muted">
                            {statusOpt.icon} {statusOpt.label}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="min-w-0">
                        {b.lastChapter && (
                          <p className="text-text-muted text-[11px] truncate">{b.lastChapter}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 relative">

                        {/* Tombol ganti status */}
                        <button
                          onClick={() => setStatusMenu(statusMenu === b.slug ? null : b.slug)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border text-text-muted hover:border-accent-red/40 hover:text-text-primary transition-colors flex items-center gap-1"
                        >
                          {statusOpt?.icon}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 transition-transform ${statusMenu === b.slug ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {/* Status dropdown */}
                        {statusMenu === b.slug && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setStatusMenu(null)} />
                            <div className="absolute right-0 bottom-full mb-1 z-50 w-40 bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/60 overflow-hidden animate-slide-up">
                              {STATUS_OPTIONS.map(opt => (
                                <button
                                  key={opt.key}
                                  onClick={() => handleStatusChange(b.slug, opt.key)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-bg-elevated transition-colors ${(b.readingStatus || READING_STATUS.READING) === opt.key ? 'text-accent-red' : 'text-text-secondary'
                                    }`}
                                >
                                  <span>{opt.icon}</span>{opt.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Baca chapter terakhir */}
                        {b.lastChapterSlug && (
                          <Link
                            href={`/read/${b.slug}/${b.lastChapterSlug}`}
                            className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-accent-red text-white hover:bg-accent-redDark transition-colors"
                          >
                            Baca
                          </Link>
                        )}

                        {/* Hapus */}
                        <button
                          onClick={() => handleRemove(b.slug)}
                          disabled={removing === b.slug}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-text-muted hover:border-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
                          aria-label="Hapus bookmark"
                        >
                          {removing === b.slug ? (
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                              <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Footer />
      </main>
    </div>
  );
}
