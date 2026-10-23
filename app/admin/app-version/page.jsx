'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Smartphone, Save, Loader2, CheckCircle2, AlertCircle,
  RefreshCw, Megaphone, AlertTriangle, Info, Pencil
} from 'lucide-react';

export default function AppVersionPage() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    versionName: '',
    versionCode: '',
    changelog: '',
    forceUpdate: false,
    downloadUrl: 'https://play.google.com/store',
    broadcast: false,
  });

  const [currentVersion, setCurrentVersion] = useState(null);
  const versionNameRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message }

  const fetchCurrentVersion = useCallback(async () => {
    if (!user?.googleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/app-version?adminId=${user.googleId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const v = json.data;
        setCurrentVersion(v);
        setForm((prev) => ({
          ...prev,
          versionName: v.versionName || '',
          versionCode: v.versionCode?.toString() || '',
          changelog: v.changelog || '',
          forceUpdate: v.forceUpdate || false,
          downloadUrl: v.downloadUrl || 'https://play.google.com/store',
        }));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.googleId]);

  useEffect(() => {
    fetchCurrentVersion();
  }, [fetchCurrentVersion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.googleId) return;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/app-version', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.googleId, ...form }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({
          type: 'success',
          message: `Versi berhasil diperbarui ke v${json.data.version?.versionName}.` +
            (json.data.broadcast ? ` ${json.data.broadcast}` : ''),
        });
        fetchCurrentVersion();
        // Reset broadcast checkbox setelah kirim
        setForm((prev) => ({ ...prev, broadcast: false }));
      } else {
        setFeedback({ type: 'error', message: json.message || 'Gagal menyimpan versi.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Terjadi kesalahan jaringan.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent-red" />
        <p className="text-text-muted text-sm">Memuat data versi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent-red/10 flex-shrink-0">
            <Smartphone className="w-6 h-6 text-accent-red" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary">Versi Aplikasi</h1>
            <p className="text-xs text-text-muted mt-0.5">Kelola versi APK Android</p>
          </div>
        </div>
        <button
          onClick={fetchCurrentVersion}
          className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-bg-elevated flex-shrink-0 border border-border"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Current Version Badge */}
      {currentVersion && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-bg-card border border-border rounded-xl min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <p className="text-sm text-text-secondary">
              Versi aktif saat ini:{' '}
              <span className="font-bold text-text-primary">
                v{currentVersion.versionName}
              </span>{' '}
              <span className="text-text-muted">(code: {currentVersion.versionCode})</span>
              {currentVersion.forceUpdate && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" /> Force Update
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              versionNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => versionNameRef.current?.focus(), 300);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors flex-shrink-0 ml-auto sm:ml-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${feedback.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
        >
          {feedback.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 space-y-5 min-w-0">
        <h2 className="text-base font-bold text-text-primary border-b border-border pb-4">
          Update Versi Terbaru
        </h2>

        {/* Version Name */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5" htmlFor="versionName">
            Version Name <span className="text-red-400">*</span>
          </label>
          <input
            id="versionName"
            name="versionName"
            type="text"
            required
            ref={versionNameRef}
            placeholder="contoh: 1.2.3"
            value={form.versionName}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red transition-colors"
          />
        </div>

        {/* Version Code */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5" htmlFor="versionCode">
            Version Code <span className="text-red-400">*</span>
          </label>
          <input
            id="versionCode"
            name="versionCode"
            type="number"
            required
            min={1}
            placeholder="contoh: 12"
            value={form.versionCode}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red transition-colors"
          />
          <p className="text-xs text-text-muted mt-1">Integer yang selalu bertambah setiap rilis.</p>
        </div>

        {/* Download URL */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5" htmlFor="downloadUrl">
            URL Download / Play Store
          </label>
          <input
            id="downloadUrl"
            name="downloadUrl"
            type="url"
            placeholder="https://play.google.com/store/apps/details?id=..."
            value={form.downloadUrl}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red transition-colors"
          />
        </div>

        {/* Changelog */}
        <div>
          <label className="block text-xs font-semibold text-text-muted mb-1.5" htmlFor="changelog">
            Changelog / Catatan Rilis
          </label>
          <textarea
            id="changelog"
            name="changelog"
            rows={4}
            placeholder="Daftar perubahan pada versi ini..."
            value={form.changelog}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-red transition-colors resize-none"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-1">
          {/* Force Update Toggle */}
          <label className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated border border-border cursor-pointer hover:border-red-500/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Force Update</p>
                <p className="text-xs text-text-muted">Paksa semua user untuk update sebelum bisa menggunakan app.</p>
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                name="forceUpdate"
                id="forceUpdate"
                checked={form.forceUpdate}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                onClick={() => setForm((prev) => ({ ...prev, forceUpdate: !prev.forceUpdate }))}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${form.forceUpdate ? 'bg-accent-red' : 'bg-border'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${form.forceUpdate ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </div>
            </div>
          </label>

          {/* Broadcast Toggle */}
          <label className="flex items-center justify-between p-4 rounded-xl bg-bg-elevated border border-border cursor-pointer hover:border-blue-500/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Megaphone className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Broadcast Notifikasi</p>
                <p className="text-xs text-text-muted">Kirim notifikasi update ke semua pengguna terdaftar.</p>
              </div>
            </div>
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                name="broadcast"
                id="broadcast"
                checked={form.broadcast}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                onClick={() => setForm((prev) => ({ ...prev, broadcast: !prev.broadcast }))}
                className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${form.broadcast ? 'bg-blue-500' : 'bg-border'
                  }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow ${form.broadcast ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </div>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4" /> Simpan & Update Versi</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
