'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Crown, Shield, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';

export default function AdminUsersList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [premiumDays, setPremiumDays] = useState(30);

  const fetchUsers = useCallback(async () => {
    if (!user?.googleId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=12&q=${encodeURIComponent(search)}&sort=${sort}`, {
        headers: { 'Authorization': `Bearer ${user.googleId}` }
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setTotalPages(json.pagination.totalPages);
      } else {
        setError(json.message);
      }
    } catch (err) {
      setError('Gagal mengambil data pengguna.');
    } finally {
      setLoading(false);
    }
  }, [user, page, search, sort]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchUsers]);

  const togglePremium = async (u, action) => {
    if (!user?.googleId) return;
    
    const payload = {
        isPremium: action === 'grant',
        durationDays: action === 'grant' ? premiumDays : 0
    };

    if (action === 'revoke' && !confirm(`Cabut status premium dari ${u.displayName}?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${u.googleId}/premium`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.googleId}` 
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
         fetchUsers();
         setShowModal(false);
      } else {
         alert('Gagal: ' + json.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const openPremiumModal = (u) => {
    setSelectedUser(u);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Kelola Pengguna</h1>
        <p className="text-text-muted text-xs sm:text-sm mt-0.5">Daftar member, status premium, dan akses admin.</p>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col w-full min-w-0">
        {/* Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-bg-elevated/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari user berdasarkan nama atau email..." 
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); 
              }}
              className="w-full bg-bg-primary border border-border text-text-primary text-sm rounded-xl pl-10 pr-4 py-2 focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all placeholder:text-text-muted/50"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-[220px] bg-bg-primary border border-border text-text-primary text-sm rounded-xl px-3 py-2 focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none flex-shrink-0"
            aria-label="Urutkan pengguna"
          >
            <option value="created_desc">Terbaru Dibuat</option>
            <option value="created_asc">Terlama Dibuat</option>
          </select>
        </div>

        {/* Table */}
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
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <UserIcon className="w-12 h-12 text-text-muted/30 mb-3" />
              <p className="text-text-secondary font-semibold">Tidak ada pengguna ditemukan.</p>
            </div>
          ) : (
            <table className="w-full min-w-[650px] text-left text-sm text-text-secondary">
              <thead className="bg-bg-elevated text-text-muted uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Profil</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold w-[160px]">Status Role</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold w-[130px]">Aktivitas DL</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right w-[140px]">Aksi Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-bg-primary overflow-hidden border border-border flex-shrink-0">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-full h-full p-2 text-text-muted" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-text-primary truncate max-w-[160px] sm:max-w-xs">{u.displayName || 'Tanpa Nama'}</p>
                          <p className="text-xs text-text-muted mt-0.5 truncate max-w-[160px] sm:max-w-xs font-mono">{u.email || u.googleId}</p>
                          <p className="text-[10px] text-text-muted mt-1">
                            Dibuat: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2">
                         {u.isAdmin ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase">
                              <Shield className="w-3 h-3" /> Admin Utama
                            </span>
                         ) : u.isPremium ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase">
                              <Crown className="w-3 h-3" /> Member Premium
                            </span>
                         ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-bg-card border border-border uppercase">
                              Member Biasa
                            </span>
                         )}
                      </div>
                      {u.isPremium && u.premiumUntil && (
                        <p className="text-[10px] text-text-muted mt-1.5 font-mono">
                           S/d {new Date(u.premiumUntil).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                       <p className="font-mono text-xs text-text-primary">{u.downloadCount || 0} Total DL</p>
                       <p className="text-[10px] text-text-muted mt-0.5">Hari ini: {u.dailyDownloads?.count || 0}</p>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                       {u.isAdmin ? (
                         <span className="text-xs text-text-muted italic">Tidak dapat diubah</span>
                       ) : u.isPremium ? (
                         <button 
                           onClick={() => togglePremium(u, 'revoke')}
                           className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-400/10 hover:bg-red-400/20 px-3 py-1.5 rounded-lg transition-colors"
                         >
                           Cabut Premium
                         </button>
                       ) : (
                         <button 
                           onClick={() => openPremiumModal(u)}
                           className="text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                         >
                           <Crown className="w-3.5 h-3.5" /> Beri Akses
                         </button>
                       )}
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

      {/* MODAL SET PREMIUM */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-bg-card w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-border flex flex-col min-w-0">
             <div className="p-6 text-center border-b border-border bg-bg-elevated">
               <div className="w-14 h-14 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3">
                 <Crown className="w-7 h-7 text-yellow-400" />
               </div>
               <h3 className="font-bold text-lg">Beri Akses Premium</h3>
               <p className="text-xs text-text-muted mt-1 truncate">Ke: <strong>{selectedUser.displayName}</strong></p>
             </div>
             
             <div className="p-6 space-y-4">
               <div>
                 <label className="text-sm font-semibold mb-2 block text-text-primary text-center">Durasi Langganan (Hari)</label>
                 <select 
                   value={premiumDays} 
                   onChange={(e) => setPremiumDays(e.target.value)}
                   className="w-full bg-bg-primary border border-border rounded-xl px-4 py-3 text-sm focus:border-yellow-400 outline-none text-center font-bold"
                 >
                   <option value={7}>1 Minggu (7 Hari)</option>
                   <option value={30}>1 Bulan (30 Hari)</option>
                   <option value={90}>3 Bulan (90 Hari)</option>
                   <option value={365}>1 Tahun (365 Hari)</option>
                   <option value={3650}>Seumur Hidup (Lifelong)</option>
                 </select>
               </div>
             </div>

             <div className="p-4 border-t border-border flex gap-3">
               <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 font-bold text-sm bg-bg-elevated hover:bg-bg-primary rounded-xl transition-colors text-text-primary border border-border">Batal</button>
               <button onClick={() => togglePremium(selectedUser, 'grant')} className="flex-1 py-2.5 font-bold text-sm bg-yellow-500 text-black rounded-xl hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all">Simpan</button>
             </div>
           </div>
        </div>
      )}

    </div>
  );
}
