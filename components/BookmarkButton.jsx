'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  toggleBookmark,
  updateReadingStatus,
  getBookmarkData,
  READING_STATUS,
} from '@/lib/bookmarks';
import { trackBookmarkAdd, trackBookmarkRemove } from '@/lib/analytics';

const STATUS_OPTIONS = [
  { key: READING_STATUS.READING, label: 'Sedang Dibaca', color: 'text-accent-red' },
  { key: READING_STATUS.TO_READ, label: 'Mau Dibaca', color: 'text-blue-400' },
  { key: READING_STATUS.FINISHED, label: 'Selesai', color: 'text-green-400' },
  { key: READING_STATUS.DROPPED, label: 'Dihentikan', color: 'text-gray-400' },
];

export default function BookmarkButton({ manga, chapters }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [checked, setChecked] = useState(false);
  const [readingStatus, setReadingStatus] = useState(READING_STATUS.READING);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Helper untuk membuat payload data komik yang konsisten
  const getMangaPayload = (customStatus = readingStatus) => {
    const chList = chapters || manga?.chapters || [];
    const latestCh = chList[0] || manga?.latestChapter || null;

    return {
      slug: manga?.slug,
      title: manga?.title || '',
      coverImage: manga?.coverImage || manga?.thumb || '',
      type: manga?.metadata?.type || manga?.type || '',
      status: manga?.metadata?.status || manga?.status || '',
      rating: parseFloat(manga?.metadata?.rating || manga?.rating) || 0,
      last_chapter: latestCh?.title || manga?.last_chapter || manga?.lastChapterTitle || '',
      last_chapter_slug: latestCh?.slug || manga?.last_chapter_slug || manga?.lastChapterSlug || '',
      readingStatus: customStatus,
    };
  };

  // Cek status bookmark saat mount atau saat user/manga berubah
  useEffect(() => {
    const userId = user?.googleId || user?.uid;
    if (!userId || !manga?.slug) {
      setSaved(false);
      setChecked(true);
      return;
    }

    let cancelled = false;
    getBookmarkData(userId, manga.slug)
      .then((data) => {
        if (!cancelled) {
          setSaved(!!data);
          if (data?.readingStatus) setReadingStatus(data.readingStatus);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.googleId, user?.uid, manga?.slug]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Handler toggle tombol utama (Simpan / Hapus)
  const handleToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const userId = user?.googleId || user?.uid;
    if (!userId || !manga?.slug) return;

    setLoading(true);
    try {
      const nowSaved = await toggleBookmark(userId, getMangaPayload(), readingStatus);
      setSaved(nowSaved);
      if (nowSaved) {
        trackBookmarkAdd(manga);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } else {
        trackBookmarkRemove(manga.slug);
      }
    } catch (err) {
      console.error('[Bookmark] Toggle gagal:', err.message);
      alert('Gagal menyimpan bookmark. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handler ubah status di dropdown
  const handleStatusChange = async (newStatus) => {
    setDropdownOpen(false);
    if (!user) {
      router.push('/login');
      return;
    }
    const userId = user?.googleId || user?.uid;
    if (!userId || !manga?.slug) return;

    setReadingStatus(newStatus);

    if (saved) {
      // Jika sudah tersimpan, update status bacanya di backend
      try {
        await updateReadingStatus(userId, manga.slug, newStatus);
      } catch (err) {
        console.error('[Bookmark] Update status gagal:', err.message);
      }
    } else {
      // Jika belum tersimpan ("Simpan Sebagai"), langsung simpan dengan status baru
      setLoading(true);
      try {
        const payload = getMangaPayload(newStatus);
        const nowSaved = await toggleBookmark(userId, payload, newStatus);
        setSaved(nowSaved);
        if (nowSaved) {
          trackBookmarkAdd(manga);
          setPulse(true);
          setTimeout(() => setPulse(false), 600);
        }
      } catch (err) {
        console.error('[Bookmark] Simpan sebagai gagal:', err.message);
        alert('Gagal menyimpan bookmark. Coba lagi.');
      } finally {
        setLoading(false);
      }
    }
  };

  const userId = user?.googleId || user?.uid;
  if (!checked && userId) {
    return <div className="h-12 w-full rounded-xl bg-bg-elevated border border-border animate-pulse" />;
  }

  const currentOption = STATUS_OPTIONS.find((o) => o.key === readingStatus) || STATUS_OPTIONS[0];

  return (
    <div className="flex items-stretch gap-0 w-full" ref={dropdownRef}>
      {/* Tombol utama */}
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={saved ? 'Hapus bookmark' : 'Tambah bookmark'}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-l-xl border-y border-l font-bold text-sm transition-all duration-300 disabled:opacity-50 select-none flex-1 ${
          saved
            ? 'bg-accent-red/15 border-accent-red text-accent-red'
            : 'bg-bg-elevated border-border text-text-secondary hover:border-accent-red hover:text-accent-red'
        } ${pulse ? 'scale-105' : 'scale-100'}`}
      >
        {loading ? 'Menyimpan...' : saved ? currentOption.label : 'Simpan'}
      </button>

      {/* Dropdown toggle — status */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`h-full px-3 rounded-r-xl border flex items-center justify-center transition-colors ${
            saved
              ? 'border-accent-red bg-accent-red/15 text-accent-red hover:bg-accent-red/25'
              : 'border-border bg-bg-elevated text-text-muted hover:border-accent-red hover:text-accent-red'
          }`}
          aria-label="Pilih status baca"
        >
          <span className={`text-[10px] transition-transform duration-200 inline-block ${dropdownOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 z-50 w-44 bg-bg-card border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
              <p className="px-3 py-2 text-[10px] text-text-muted font-bold uppercase tracking-wider border-b border-border">
                {saved ? 'Status Baca' : 'Simpan Sebagai'}
              </p>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleStatusChange(opt.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-bg-elevated ${
                    readingStatus === opt.key ? opt.color : 'text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}