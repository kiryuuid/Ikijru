'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Send, Loader2, BellRing, History } from 'lucide-react';

export default function AdminBroadcast() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!user?.googleId) return;

    if (!title.trim() || !message.trim()) {
      alert('Judul dan Pesan wajib diisi!');
      return;
    }

    if (!confirm('Kirim pengumuman ini ke seluruh pengguna terdaftar?')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adminId: user.googleId, 
          title: title.trim(), 
          message: message.trim() 
        })
      });

      const json = await res.json();
      
      if (json.success) {
        // Simpan log ke tabel riwayat lokal UI
        setHistory(prev => [{ title, message, date: new Date(), result: json.data.message }, ...prev]);
        alert('Berhasil: ' + json.data.message);
        setTitle('');
        setMessage('');
      } else {
        alert('Gagal: ' + json.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
          <BellRing className="w-5 h-5 sm:w-6 sm:h-6 text-accent-red flex-shrink-0" />
          Sistem Broadcast Notifikasi
        </h1>
        <p className="text-text-muted text-xs sm:text-sm mt-0.5">
          Kirim pengumuman sistem (contoh: Update Versi, Event Premium) ke seluruh pengguna.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full min-w-0">
        {/* Kolom Kiri: Form */}
        <form onSubmit={handleBroadcast} className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col gap-4 min-w-0">
           <div>
             <label className="text-sm font-semibold text-text-primary mb-1.5 block">Judul Pengumuman</label>
             <input 
               required
               value={title}
               onChange={e => setTitle(e.target.value)}
               placeholder="Cth: Server Maintenance Selesai"
               className="w-full min-w-0 bg-bg-primary border border-border rounded-xl px-4 py-2.5 focus:border-accent-red outline-none text-text-primary transition-all text-sm"
             />
           </div>

           <div>
             <label className="text-sm font-semibold text-text-primary mb-1.5 block">Isi Pesan / Keterangan</label>
             <textarea 
               required
               rows={5}
               value={message}
               onChange={e => setMessage(e.target.value)}
               placeholder="Tulis pesan lengkap Anda di sini..."
               className="w-full min-w-0 bg-bg-primary border border-border rounded-xl px-4 py-2.5 focus:border-accent-red outline-none text-text-primary transition-all leading-relaxed text-sm"
             />
           </div>

           <div className="pt-2 border-t border-border mt-2">
             <button 
               type="submit" 
               disabled={loading}
               className="w-full bg-accent-red hover:bg-accent-redDark text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
             >
               {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Send className="w-5 h-5"/> Kirim ke Semua User</>}
             </button>
           </div>
        </form>

        {/* Kolom Kanan: History Sinkronisasi Sementara */}
        <div className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm min-h-[350px] min-w-0">
           <h3 className="font-bold flex items-center gap-2 mb-4 text-text-primary border-b border-border pb-3 text-base">
             <History className="w-5 h-5 text-accent-red flex-shrink-0" /> Riwayat Sesi Ini
           </h3>

           {history.length === 0 ? (
             <div className="h-48 flex flex-col items-center justify-center text-text-muted/50">
                <BellRing className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm font-semibold">Belum ada broadcast yang dikirim hari ini.</p>
             </div>
           ) : (
             <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
               {history.map((log, idx) => (
                 <div key={idx} className="bg-bg-primary border border-border p-4 rounded-xl relative">
                   <div className="absolute top-2 right-2 text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold uppercase">Terkirim</div>
                   <h4 className="font-bold text-sm text-text-primary w-4/5">{log.title}</h4>
                   <p className="text-xs text-text-secondary mt-1 line-clamp-2">{log.message}</p>
                   <p className="text-[10px] text-text-muted mt-3 font-mono border-t border-border pt-2">
                     {log.date.toLocaleTimeString('id-ID')} — {log.result}
                   </p>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
