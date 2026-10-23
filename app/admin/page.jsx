'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Files, Users, Crown, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function StatCard({ title, value, icon: Icon, colorClass, linkHref, linkText }) {
  return (
    <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-text-muted">{title}</p>
          <h3 className="text-3xl font-display font-bold text-text-primary mt-2">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {linkHref && (
        <div className="mt-4 pt-4 border-t border-border">
          <Link href={linkHref} className="text-xs font-semibold text-accent-red hover:underline">
            {linkText} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      if (!user?.googleId) return;
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${user.googleId}` }
        });
        const json = await res.json();
        
        if (json.success) {
          setStats(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError('Gagal memuat statistik database');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent-red mb-4" />
        <p className="text-text-muted text-sm delay-150">Mengambil data statistik realtime...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 flex flex-col items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <h3 className="text-lg font-bold text-red-400 mb-1">Terjadi Kesalahan</h3>
        <p className="text-sm text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0">
      <div className="mb-6 sm:mb-8 min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary truncate">Selamat Datang, {user?.displayName} 👋</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-0.5">Ini adalah ringkasan sistem database aplikasi Anda saat ini.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Manga/Komik" 
          value={stats?.totalMangas || 0} 
          icon={BookOpen} 
          colorClass="bg-blue-500/20 text-blue-400" 
          linkHref="/admin/mangas"
          linkText="Kelola Manga"
        />
        <StatCard 
          title="Total Chapter" 
          value={stats?.totalChapters || 0} 
          icon={Files} 
          colorClass="bg-purple-500/20 text-purple-400" 
        />
        <StatCard 
          title="Total Pengguna Aktif" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          colorClass="bg-green-500/20 text-green-400" 
          linkHref="/admin/users"
          linkText="Kelola Pengatur"
        />
        <StatCard 
          title="Member Premium" 
          value={stats?.premiumUsers || 0} 
          icon={Crown} 
          colorClass="bg-yellow-500/20 text-yellow-400" 
          linkHref="/admin/users"
          linkText="Lihat Member"
        />
      </div>
      
      {/* Quick Access or Logs placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 border-b border-border pb-4">Tindakan Cepat</h3>
          <div className="space-y-3">
            <Link href="/admin/mangas/add" className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-elevated hover:bg-accent-red hover:text-white transition-colors group">
              <span className="font-semibold text-sm">Upload Manga Baru</span>
              <span className="text-xl leading-none">&rarr;</span>
            </Link>
            <Link href="/admin/broadcast" className="w-full flex items-center justify-between p-4 rounded-xl bg-bg-elevated hover:bg-accent-red hover:text-white transition-colors group">
              <span className="font-semibold text-sm">Kirim Pengumuman Broadcast</span>
              <span className="text-xl leading-none">&rarr;</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-accent-red/10 flex items-center justify-center mb-4">
               <AlertCircle className="w-8 h-8 text-accent-red" />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-2">Sistem Database Standalone Aktif</h3>
            <p className="text-xs text-text-muted leading-relaxed max-w-sm">
              Sistem Anda sekarang sepenuhnya beroperasi secara standalone menggunakan Next.js API serverless function. Tidak memerlukan proxy node.js lawas.
            </p>
        </div>
      </div>
    </div>
  );
}
