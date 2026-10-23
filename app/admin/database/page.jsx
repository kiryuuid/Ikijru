'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DownloadCloud, UploadCloud, AlertTriangle, CheckCircle2, Loader2, Database } from 'lucide-react';

export default function DatabasePage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('gz'); // 'gz' or 'json'
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  // 1. Download Backup
  const handleDownload = async () => {
    setIsDownloading(true);
    setMessage('');
    setError(false);
    
    try {
      const res = await fetch(`/api/admin/database/backup?format=${downloadFormat}`, {
        headers: {
          'Authorization': `Bearer ${user.googleId}` // Using googleId for consistent user identification
        }
      });
      
      if (!res.ok) {
        throw new Error('Gagal mendownload backup. Pastikan Anda adalah Admin.');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_doujindesu_${new Date().toISOString().slice(0, 10)}${downloadFormat === 'gz' ? '.json.gz' : '.json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setMessage('Backup berhasil diunduh!');
    } catch (err) {
      setError(true);
      setMessage(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  // 2. Select File
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.json') || selected.name.endsWith('.gz') || selected.type === "application/gzip")) {
      setFile(selected);
      setMessage('');
      setError(false);
    } else {
      setFile(null);
      setError(true);
      setMessage('Harap pilih file berekstensi .json atau .json.gz');
    }
  };

  // 3. Restore Backup
  const handleRestore = async () => {
    if (!file) return;
    
    if (!window.confirm("PERINGATAN BAHAYA!\n\nProses ini akan MENGHAPUS SEMUA DATA LAMA di database dan menimpanya dengan isi dari file backup ini. Anda yakin ingin melanjutkan?")) return;

    setIsRestoring(true);
    setMessage('');
    setError(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/database/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.googleId}`
        },
        body: formData
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memulihkan database.');
      }

      setError(false);
      setMessage(`Berhasil! Direstore: ${data.data.mangas} Manga, ${data.data.chapters} Chapter, ${data.data.users} User.`);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(true);
      setMessage(err.message || 'File Corrupted / Format tidak valid.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-display text-text-primary tracking-wider mb-1">DATABASE MANAGEMENT</h1>
        <p className="text-text-muted text-xs sm:text-sm">Backup dan Restore data komik, chapter, dan pengguna.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${error ? 'bg-red-500/10 border border-red-500/50 text-red-400' : 'bg-green-500/10 border border-green-500/50 text-green-400'}`}>
          {error ? <AlertTriangle className="w-5 h-5 flex-shrink-0" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* --- Card Backup --- */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
            <DownloadCloud className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Export Data (Backup)</h2>
          <p className="text-sm text-text-muted mb-4 leading-relaxed">
            Unduh seluruh database (Manga, Chapters, dan Users) ke komputer lokal Anda untuk diamankan.
          </p>
          
          <div className="flex items-center gap-3 mb-6 bg-bg-elevated p-2 rounded-xl">
            <button
              onClick={() => setDownloadFormat('gz')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${downloadFormat === 'gz' ? 'bg-accent-red text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
            >
              .JSON.GZ (Kecil)
            </button>
            <button
              onClick={() => setDownloadFormat('json')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${downloadFormat === 'json' ? 'bg-accent-red text-white shadow-md' : 'text-text-muted hover:text-text-primary'}`}
            >
               .JSON (Besar)
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-500/20"
          >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-4 h-4" />}
            {isDownloading ? 'Menyiapkan Data...' : 'Download Full Backup'}
          </button>
        </div>

        {/* --- Card Restore --- */}
        <div className="bg-bg-card border border-border outline outline-1 outline-accent-red/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 py-1.5 px-3 bg-accent-red text-white text-[10px] font-bold uppercase rounded-bl-lg">Danger Zone</div>
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-6 h-6 text-accent-red" />
          </div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Import Data (Restore)</h2>
          <p className="text-sm text-text-muted mb-4 leading-relaxed">
            Upload file backup <code>.json</code> atau <code>.json.gz</code> untuk <strong>menggantikan semua data</strong> yang ada di sistem saat ini.
          </p>
          
          <div className="mb-6">
            <div className="relative">
              <input
                type="file"
                accept=".json,application/json,.gz,application/gzip"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <div className={`w-full border-2 border-dashed rounded-xl p-4 text-center transition-colors ${file ? 'border-accent-red bg-accent-red/5' : 'border-border bg-bg-elevated hover:bg-bg-primary'}`}>
                <p className="text-sm font-semibold text-text-secondary truncate">
                  {file ? file.name : 'Pilih File .json / .gz Backup...'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRestore}
            disabled={isRestoring || !file}
            className="w-full flex items-center justify-center gap-2 py-3 bg-accent-red hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg shadow-red-500/20"
          >
            {isRestoring ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {isRestoring ? 'Menimpa Database...' : 'Mulai Restore Data'}
          </button>
        </div>

      </div>
    </div>
  );
}
