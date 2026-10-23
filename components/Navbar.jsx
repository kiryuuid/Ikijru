'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { TagsIcon } from 'lucide-react';

const NOTIF_CACHE_TTL_MS = 15000;
const notificationsCache = new Map();

// ─── Icons ────────────────────────────────────────────────
function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GridIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.95" strokeLinecap="round" />
      <polyline points="12 7 12 12 16 14" />
    </svg>
  );
}

function GenreIcon({ active }) {
  return (
    <TagsIcon
      className="w-6 h-6"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
    />
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ─── Theme Toggle ─────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />;

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary hover:border-accent-red hover:text-accent-red transition-colors"
      aria-label="Toggle Theme"
      title="Toggle Light/Dark Mode"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      )}
    </button>
  );
}

// ─── User Menu Dropdown ───────────────────────────────────
function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push('/');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-accent-red flex items-center justify-center text-white text-sm font-bold bg-accent-red/20"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{user.displayName?.[0] || user.email?.[0] || '?'}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-52 bg-bg-card border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-slide-up">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-bold text-text-primary text-sm truncate">
                {user.displayName || 'Pengguna'}
              </p>
              <p className="text-text-muted text-xs truncate">{user.email}</p>
            </div>
            <Link href={`/user/${user.googleId}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              Profil Saya
            </Link>
            <Link href="/bookmarks" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
              Bookmark Saya
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 transition-colors text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Smart Search Modal ───────────────────────────────────
function SmartSearchModal({ open, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input saat modal dibuka
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setQuery('');
      setResults([]);
      setSearched(false);
    }
  }, [open]);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/manga-list?q=${encodeURIComponent(q.trim())}&limit=8`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setResults(json.data);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/manga?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleSelect = (slug) => {
    router.push(`/manga/${slug}`);
    onClose();
  };

  if (!open) return null;

  const typeBadgeColor = (type) => {
    const t = type?.toLowerCase();
    if (t === 'manhwa') return 'bg-purple-500/20 text-purple-300';
    if (t === 'manhua') return 'bg-orange-500/20 text-orange-300';
    if (t === 'doujinshi') return 'bg-pink-500/20 text-pink-300';
    return 'bg-blue-500/20 text-blue-300';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-16 md:pt-24 px-4" onClick={onClose}>
      <div className="w-full max-w-lg md:max-w-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 bg-bg-card border border-border rounded-2xl px-4 py-3 shadow-2xl">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-text-muted flex-shrink-0"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleChange}
              placeholder="Cari manga, manhwa, doujinshi..."
              className="flex-1 bg-transparent text-text-primary placeholder-text-muted outline-none text-base"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin flex-shrink-0" />
            )}
            {query && !loading && (
              <button type="button" onClick={() => { setQuery(''); setResults([]); setSearched(false); }} className="text-text-muted hover:text-text-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            )}
          </div>
        </form>

        {/* Search Results */}
        {searched && (
          <div className="mt-2 bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto">
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <div className="w-5 h-5 border-2 border-accent-red/30 border-t-accent-red rounded-full animate-spin" />
                <span className="text-text-muted text-xs">Mencari...</span>
              </div>
            ) : results.length > 0 ? (
              <>
                {results.map((manga) => (
                  <button
                    key={manga.slug}
                    onClick={() => handleSelect(manga.slug)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-colors text-left border-b border-border last:border-b-0"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-10 h-14 rounded-lg overflow-hidden bg-bg-elevated">
                      {manga.thumb || manga.coverImage ? (
                        <img
                          src={manga.thumb || manga.coverImage}
                          alt={manga.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-text-muted">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 7h8M8 12h8M8 17h5" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-semibold line-clamp-1">{manga.title}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {(manga.metadata?.type || manga.type) && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${typeBadgeColor(manga.metadata?.type || manga.type)}`}>
                            {manga.metadata?.type || manga.type}
                          </span>
                        )}
                        {(manga.metadata?.status || manga.status) && (
                          <span className={`text-[9px] font-semibold ${(manga.metadata?.status || manga.status)?.toLowerCase() === 'ongoing' ? 'text-green-400' : 'text-gray-400'}`}>
                            {manga.metadata?.status || manga.status}
                          </span>
                        )}
                        {manga.chapter_count > 0 && (
                          <span className="text-[9px] text-text-muted">{manga.chapter_count} ch</span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted flex-shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                ))}

                {/* See all button */}
                {query.trim() && (
                  <button
                    onClick={() => { router.push(`/manga?q=${encodeURIComponent(query.trim())}`); onClose(); }}
                    className="w-full py-3 text-center text-xs font-bold text-accent-red hover:bg-bg-elevated transition-colors"
                  >
                    Lihat semua hasil untuk &quot;{query.trim()}&quot; →
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center py-8 gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-text-muted">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-text-muted text-xs">Tidak ditemukan hasil untuk &quot;{query}&quot;</p>
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        {!searched && (
          <p className="text-text-muted text-xs text-center mt-3">
             Ketik untuk mencari • Tekan Enter untuk hasil lengkap
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // ==========================================
  // [FIX] STATE & LOGIKA NOTIFIKASI
  // ==========================================
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const googleId = user?.googleId;
    if (!googleId) {
      setNotifications([]);
      return;
    }

    const cached = notificationsCache.get(googleId);
    if (cached && Date.now() - cached.fetchedAt < NOTIF_CACHE_TTL_MS) {
      setNotifications(cached.data);
      return;
    }

    let cancelled = false;
    fetch(`/api/users/${googleId}/notifications`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) {
          setNotifications(data.data);
          notificationsCache.set(googleId, { data: data.data, fetchedAt: Date.now() });
        }
      })
      .catch(err => {
        if (!cancelled) console.error('Gagal load notif:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.googleId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async () => {
    if (!user?.googleId || unreadCount === 0) return;
    try {
      await fetch(`/api/users/${user.googleId}/notifications/read`, { method: 'PUT' });
      setNotifications(prev => {
        const next = prev.map(n => ({ ...n, isRead: true }));
        notificationsCache.set(user.googleId, { data: next, fetchedAt: Date.now() });
        return next;
      });
    } catch (err) { console.error(err); }
  };
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (pathname?.startsWith('/read/')) return null;
  if (pathname?.startsWith('/login')) return null;

  const NAV_ITEMS = [
    { href: '/', icon: HomeIcon, label: 'Home' },
    { href: '/manga', icon: GridIcon, label: 'Semua Komik' },
    { href: '/genres', icon: GenreIcon, label: 'Genre' },
    { href: '/bookmarks', icon: BookmarkIcon, label: 'Tersimpan' },
    { href: '/history', icon: HistoryIcon, label: 'Riwayat' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8 h-14 md:h-16 min-w-0 gap-3">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-3 lg:gap-6 min-w-0">
            <Link href="/" className="flex items-center gap-2 min-w-0 flex-shrink-0 group">
              <img
                src="/logo.png"
                alt="Pojokmanga"
                className="w-8 h-8 md:w-9 md:h-9 object-contain rounded-lg transition-transform group-hover:scale-105"
              />
              <span className="font-display text-2xl md:text-3xl text-accent-red tracking-wider">
                {process.env.NEXT_PUBLIC_SITE_NAME || 'POJOKMANGA'}
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
                const needsAuth = href === '/bookmarks' || href === '/history';
                return (
                  <Link
                    key={href}
                    href={needsAuth && !user ? '/login' : href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all relative ${
                      active
                        ? 'bg-accent-red/10 text-accent-red shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                    }`}
                  >
                    <Icon active={active} />
                    <span>{label}</span>
                    {needsAuth && !user && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Search, Theme, Notif, Admin, User */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Desktop Quick Search Input */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2.5 bg-bg-elevated border border-border hover:border-accent-red/50 rounded-xl px-3.5 py-1.5 lg:py-2 text-xs text-text-muted hover:text-text-primary transition-all w-40 md:w-48 lg:w-60 group shadow-sm"
              title="Cari komik (Ctrl + K)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted group-hover:text-accent-red transition-colors flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span className="truncate">Cari komik...</span>
              <span className="ml-auto text-[10px] bg-bg-card border border-border px-1.5 py-0.5 rounded text-text-muted font-mono hidden md:inline">Ctrl K</span>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary hover:border-accent-red hover:text-accent-red transition-colors"
              title="Pencarian"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Quick Admin Panel Button if admin */}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-red/30 bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white transition-all text-xs font-bold shadow-sm"
                title="Buka Admin Panel"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Admin</span>
              </Link>
            )}

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotif(!showNotif);
                    if (!showNotif) handleMarkAsRead();
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-bg-elevated border border-border text-text-secondary hover:border-accent-red hover:text-accent-red transition-colors"
                  title="Notifikasi"
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                    <div className="absolute right-0 top-11 z-50 w-72 md:w-80 bg-bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                      <div className="px-4 py-3 border-b border-border bg-bg-elevated flex justify-between items-center">
                        <h3 className="font-bold text-text-primary text-sm">Notifikasi</h3>
                      </div>
                      <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-text-muted text-xs">Belum ada notifikasi.</div>
                        ) : (
                          notifications.map((notif, i) => (
                            <div key={i} className={`p-4 border-b border-border hover:bg-bg-elevated transition-colors ${!notif.isRead ? 'bg-accent-red/5' : ''}`}>
                              <p className="text-xs font-bold text-text-primary mb-1">{notif.title}</p>
                              <p className="text-[11px] text-text-secondary leading-relaxed">{notif.message}</p>
                              <p className="text-[9px] text-text-muted mt-2">{new Date(notif.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Profile or Login */}
            {user ? (
              <UserMenu user={user} logout={logout} />
            ) : (
              <Link href="/login" className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-accent-red text-white text-xs sm:text-sm font-bold hover:bg-accent-redDark transition-colors shadow-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                <span>Masuk</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <SmartSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile-Only Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-primary/95 backdrop-blur-md border-t border-border md:hidden">
        <div className="max-w-md mx-auto flex items-center justify-around h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            const needsAuth = href === '/bookmarks' || href === '/history';
            return (
              <Link key={href} href={needsAuth && !user ? '/login' : href} className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 transition-colors duration-200 relative ${active ? 'text-accent-red' : 'text-text-muted hover:text-text-secondary'}`}>
                <Icon active={active} />
                <span className={`text-[10px] font-semibold ${active ? 'text-accent-red' : 'text-text-muted'}`}>{label}</span>
                {needsAuth && !user && <span className="absolute top-0.5 right-2 w-1.5 h-1.5 rounded-full bg-accent-red" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}