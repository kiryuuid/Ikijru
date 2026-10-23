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

export default function BookmarkButton({ manga }) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [checked, setChecked] = useState(false);
  const [readingStatus, setReadingStatus] = useState(READING_STATUS.READING);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cek status bookmark saat mount
  useEffect(() => {
    if (!user || !manga?.slug) { setChecked(true); return; }
    let cancelled = false;
    getBookmarkData(user.googleId, manga.slug)
      .then((data) => {
        if (!cancelled) {
          setSaved(!!data);
          if (data?.readingStatus) setReadingStatus(data.readingStatus);
          setChecked(true);
        }
      })
      .catch(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [user, manga?.slug]);

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

  const handleToggle = async () => {
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    try {
      const nowSaved = await toggleBookmark(user.googleId, {
        slug: manga.slug,
        title: manga.title,
        coverImage: manga.coverImage || manga.thumb || '',
        type: manga.type || '',
        status: manga.status || '',
        rating: manga.rating || 0,
        last_chapter: manga.chapters?.[0]?.title || '',
        last_chapter_slug: manga.chapters?.[0]?.slug || '',
      }, readingStatus);

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

  const handleStatusChange = async (newStatus) => {
    setDropdownOpen(false);
    if (!user) return;
    setReadingStatus(newStatus);
    if (saved) {
      try {
        await updateReadingStatus(user.googleId, manga.slug, newStatus);
      } catch (err) {
        console.error('[Bookmark] Update status gagal:', err.message);
      }
    }
  };

  if (!checked && user) {
    return <div className="h-12 w-40 rounded-xl bg-bg-elevated border border-border animate-pulse" />;
  }

  const currentOption = STATUS_OPTIONS.find(o => o.key === readingStatus) || STATUS_OPTIONS[0];

  return (
    <div className="flex items-stretch gap-0" ref={dropdownRef}>
      {/* Tombol utama */}
      <button
        onClick={handleToggle}
        disabled={loading}
        aria-label={saved ? 'Hapus bookmark' : 'Tambah bookmark'}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-l-xl border-y border-l font-bold text-sm transition-all duration-300 disabled:opacity-50 select-none flex-1 ${saved
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
          className={`h-full px-3 rounded-r-xl border flex items-center justify-center transition-colors ${saved
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
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    handleStatusChange(opt.key);
                    if (!saved) setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-bg-elevated ${readingStatus === opt.key ? opt.color : 'text-text-secondary'
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