'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Rss,
  ArrowLeft,
  Loader2,
  Menu,
  X,
  Database,
  Smartphone,
} from 'lucide-react';

const ADMIN_LINKS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Manga & Chapters', href: '/admin/mangas', icon: BookOpen },
  { name: 'Pengguna', href: '/admin/users', icon: Users },
  { name: 'Broadcast', href: '/admin/broadcast', icon: Rss },
  { name: 'Database', href: '/admin/database', icon: Database },
  { name: 'Versi Aplikasi', href: '/admin/app-version', icon: Smartphone },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Redirect if not loading and user is not an admin
    if (!loading && (!user || !user.isAdmin)) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary">
        <Loader2 className="w-10 h-10 animate-spin text-accent-red mb-3" />
        <p className="text-text-muted text-sm font-semibold">
          {loading ? "Memverifikasi akses Admin..." : "Akses ditolak. Mengalihkan ke beranda..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-primary text-text-primary overflow-hidden">

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-xl font-display font-bold text-accent-red tracking-wide">
              ADMIN PANEL
            </h1>
            <p className="text-xs text-text-muted mt-1">{process.env.NEXT_PUBLIC_SITE_NAME || 'Pojokmanga'} Control Center</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-text-muted hover:text-text-primary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/admin');

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive
                  ? 'bg-accent-red/10 text-accent-red'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Web
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-bg-primary min-w-0 w-full">
        <header className="h-16 flex-shrink-0 border-b border-border bg-bg-card flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary hover:bg-bg-elevated rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-bold text-text-primary hidden sm:block">
              {ADMIN_LINKS.find(link => link.href === pathname)?.name || 'Admin'}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-xs font-semibold text-text-muted hidden sm:inline truncate max-w-[180px] md:max-w-xs">
              Login sebagai: <span className="text-text-primary">{user.displayName}</span>
            </span>
            <div className="w-8 h-8 rounded-full bg-accent-red flex items-center justify-center text-white text-xs font-bold ring-2 ring-accent-red/20 flex-shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Admin" className="w-full h-full rounded-full object-cover" />
              ) : (
                user.displayName?.[0] || 'A'
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
