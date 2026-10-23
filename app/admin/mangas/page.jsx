'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Loader2, AlertCircle, BookOpen } from 'lucide-react';

export default function AdminMangasList() {
  const { user } = useAuth();
  const [mangas, setMangas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchMangas = useCallback(async () => {
    if (!user?.googleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/mangas?page=${page}&limit=12&q=${encodeURIComponent(search)}`, {
        headers: { 'Authorization': `Bearer ${user.googleId}` }
      });
      const json = await res.json();
      if (json.success) {
        setMangas(json.data);
        setTotalPages(json.pagination.totalPages);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Gagal mengambil data manga.');
    } finally {
      setLoading(false);
    }
  }, [user, page, search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMangas();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchMangas]);

  const handleDelete = async (id, title) => {
    if (!confirm(`Hapus permanen manga "${title}"? Operasi ini tidak dapat dibatalkan.`)) return;
    
    try {
      const res = await fetch(`/api/admin/mangas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.googleId}` }
      });
      const json = await res.json();
      if (json.success) {
        alert('Berhasil dihapus!');
        fetchMangas();
      } else {
        alert('Gagal menghapus: ' + json.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 min-w-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Kelola Manga</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">Daftar semua komik yang ada di database.</p>
        </div>
        <Link 
          href="/admin/mangas/add" 
          className="flex items-center justify-center gap-2 bg-accent-red text-white px-4 py-2.5 rounded-xl font-bold hover:bg-accent-redDark transition-colors w-full sm:w-auto shadow-sm flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          Tambah Manga
        </Link>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col w-full min-w-0">
        {/* Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-bg-elevated/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari judul, slug, penulis..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page on search
              }}
              className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-2 focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all placeholder:text-text-muted/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] w-full">
          {loading ? (
             <div className="flex items-center justify-center p-12">
               <Loader2 className="w-8 h-8 animate-spin text-accent-red" />
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
              <p className="text-red-400 font-semibold">{error}</p>
            </div>
          ) : mangas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <BookOpen className="w-12 h-12 text-text-muted/30 mb-3" />
              <p className="text-text-secondary font-semibold">Tidak ada manga yang ditemukan.</p>
            </div>
          ) : (
            <table className="w-full min-w-[650px] text-left text-sm text-text-secondary">
              <thead className="bg-bg-elevated text-text-muted uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold w-[60px]">Sampul</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Judul & Detail</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold w-[140px]">Status / Tipe</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right w-[100px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mangas.map((manga) => (
                  <tr key={manga._id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="w-10 h-14 bg-bg-card rounded-lg overflow-hidden relative border border-border flex-shrink-0">
                        <img 
                          src={manga.thumb || '/placeholder.jpg'} 
                          alt="Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/placeholder.jpg' }}
                        />
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0 max-w-xs sm:max-w-md">
                      <div className="font-bold text-text-primary text-sm sm:text-base truncate" title={manga.title}>
                        {manga.title}
                      </div>
                      <div className="text-xs text-text-muted mt-0.5 font-mono truncate" title={manga.slug}>{manga.slug}</div>
                      <div className="text-xs text-text-muted mt-0.5 truncate">✏️ {manga.metadata?.author || '-'}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg-card border border-border uppercase">
                          {manga.metadata?.status || 'Unknown'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                          {manga.metadata?.type || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex justify-end gap-1.5 sm:gap-2">
                        <Link
                          href={`/admin/mangas/${manga._id}`}
                          className="p-2 text-text-muted hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Edit Manga & Chapters"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(manga._id, manga.title)}
                          className="p-2 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Hapus Manga"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-3.5 sm:p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-bg-elevated/50 text-xs sm:text-sm">
             <span className="text-text-muted">Halaman {page} dari {totalPages}</span>
             <div className="flex gap-2">
               <button 
                 disabled={page === 1}
                 onClick={() => setPage(p => p - 1)}
                 className="px-3 py-1.5 rounded-lg bg-bg-card border border-border text-text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-elevated transition-colors"
               >
                 Prev
               </button>
               <button 
                 disabled={page === totalPages}
                 onClick={() => setPage(p => p + 1)}
                 className="px-3 py-1.5 rounded-lg bg-bg-card border border-border text-text-primary font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-elevated transition-colors"
               >
                 Next
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
