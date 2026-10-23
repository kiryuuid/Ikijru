'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  BookPlus,
  Loader2,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ListChecks,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminAddManga() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Scraper states
  const [scraperUrl, setScraperUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [scrapedChapters, setScrapedChapters] = useState([]);
  const [selectedChapters, setSelectedChapters] = useState(new Set());
  const [importChaptersWithImages, setImportChaptersWithImages] = useState(true);

  // Import Progress state
  const [importProgress, setImportProgress] = useState({
    active: false,
    current: 0,
    total: 0,
    title: '',
    successCount: 0,
  });

  // Form states based on Schema
  const [formData, setFormData] = useState({
    title: '',
    alternativeTitle: '',
    slug: '',
    thumb: '',
    views: 0,
    synopsis: '',
    metadata: {
      status: 'Publishing',
      type: 'manga',
      series: '',
      author: '',
      rating: '0',
      created: '',
    },
    tags: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('metadata.')) {
      const metaKey = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metaKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        // Auto-generate slug from title if slug is empty
        ...(name === 'title' &&
          !prev.slug && {
            slug: value
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)+/g, ''),
          }),
      }));
    }
  };

  // --------------------------------------------------------------------------
  // Auto Scraper Handler
  // --------------------------------------------------------------------------
  const handleScrape = async () => {
    const url = scraperUrl.trim();
    if (!url) {
      setError('Masukkan URL komik Doujindesu terlebih dahulu!');
      return;
    }
    if (!user?.googleId) return;

    setScraping(true);
    setError(null);
    setScrapeMessage('');

    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.googleId}`,
        },
        body: JSON.stringify({ action: 'manga', url }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Gagal mengambil data dari URL tersebut.');
        return;
      }

      const d = json.data;
      setFormData({
        title: d.title || '',
        alternativeTitle: d.alternativeTitle || '',
        slug: d.slug || '',
        thumb: d.thumb || '',
        views: 0,
        synopsis: d.synopsis || '',
        metadata: {
          status: d.metadata?.status || 'Publishing',
          type: d.metadata?.type || 'manga',
          series: d.metadata?.series || '',
          author: d.metadata?.author || '',
          rating: d.metadata?.rating || '0',
          created: d.metadata?.created || '',
        },
        tags: d.tags || '',
      });

      const chs = d.chapters || [];
      setScrapedChapters(chs);
      setSelectedChapters(new Set(chs.map((c) => c.slug)));
      setScrapeMessage(
        `✅ Berhasil mengambil data "${d.title}" beserta ${chs.length} chapter!`
      );
    } catch (err) {
      setError('Terjadi kesalahan saat scraping: ' + err.message);
    } finally {
      setScraping(false);
    }
  };

  const toggleChapter = (chSlug) => {
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chSlug)) next.delete(chSlug);
      else next.add(chSlug);
      return next;
    });
  };

  const selectAllChapters = () => {
    setSelectedChapters(new Set(scrapedChapters.map((c) => c.slug)));
  };

  const deselectAllChapters = () => {
    setSelectedChapters(new Set());
  };

  // --------------------------------------------------------------------------
  // Submit Handler
  // --------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.googleId) return;

    if (!formData.title || !formData.slug) {
      setError('Judul dan Slug wajib diisi!');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      views: Number(formData.views) || 0,
      rating: parseFloat(formData.metadata?.rating) || 0,
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      // 1. Simpan Manga ke database
      const res = await fetch('/api/admin/mangas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.googleId}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.message);
        setLoading(false);
        return;
      }

      const newManga = json.data;
      const mangaId = newManga._id;

      // 2. Import chapter jika dipilih
      const chaptersToImport = scrapedChapters.filter((c) =>
        selectedChapters.has(c.slug)
      );

      if (importChaptersWithImages && chaptersToImport.length > 0) {
        setImportProgress({
          active: true,
          current: 0,
          total: chaptersToImport.length,
          title: 'Mempersiapkan import chapter...',
          successCount: 0,
        });

        let successCount = 0;
        for (let i = 0; i < chaptersToImport.length; i++) {
          const ch = chaptersToImport[i];
          setImportProgress({
            active: true,
            current: i + 1,
            total: chaptersToImport.length,
            title: `Mengambil gambar & menyimpan ${ch.title}...`,
            successCount,
          });

          try {
            const chRes = await fetch('/api/admin/scrape', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.googleId}`,
              },
              body: JSON.stringify({
                action: 'import-chapter',
                manga_id: mangaId,
                chapter: ch,
              }),
            });
            const chJson = await chRes.json();
            if (chJson.success) {
              successCount++;
            }
          } catch (err) {
            console.error(`Gagal import chapter ${ch.title}:`, err);
          }
        }

        setImportProgress((prev) => ({
          ...prev,
          title: `Selesai! ${successCount} dari ${chaptersToImport.length} chapter berhasil disimpan.`,
          successCount,
        }));

        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      alert('✅ Manga dan chapter berhasil ditambahkan!');
      router.push(`/admin/mangas/${mangaId}`);
    } catch (err) {
      setError('Terjadi kesalahan jaringan: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full min-w-0 space-y-5 sm:space-y-6 pb-16">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3 sm:gap-4 mb-2 min-w-0">
        <Link
          href="/admin/mangas"
          className="p-2 transition-colors rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated flex-shrink-0 border border-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2 truncate">
            <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 text-accent-red flex-shrink-0" />
            <span className="truncate">Tambah Manga Baru</span>
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5 truncate">
            Gunakan scraper otomatis atau isi detail manual ke database
          </p>
        </div>
      </div>

      {/* ── AUTO SCRAPER CARD ── */}
      <div className="bg-gradient-to-br from-accent-red/10 via-bg-card to-bg-card border border-accent-red/30 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 min-w-0">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-accent-red/20 text-accent-red flex-shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-text-primary text-sm sm:text-base">
              Auto Scraper Doujindesu
            </h2>
            <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
              Cukup tempelkan link komik dari Doujindesu untuk mengisi seluruh formulir dan mengambil chapternya secara instan.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <input
            type="url"
            value={scraperUrl}
            onChange={(e) => setScraperUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleScrape();
              }
            }}
            placeholder="https://doujindesu.ws/manga/pet-beastman/"
            className="w-full sm:flex-1 min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-4 py-3 text-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={handleScrape}
            disabled={scraping}
            className="w-full sm:w-auto bg-accent-red text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent-redDark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0 shadow-md shadow-accent-red/20"
          >
            {scraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scraping Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scrape Manga</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Example */}
        <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap min-w-0">
          <span className="flex-shrink-0">Contoh cepat:</span>
          <button
            type="button"
            onClick={() =>
              setScraperUrl('https://doujindesu.ws/manga/pet-beastman/')
            }
            className="text-accent-red hover:underline font-mono truncate max-w-[260px] sm:max-w-md text-left"
            title="Klik untuk mengisi link contoh"
          >
            https://doujindesu.ws/manga/pet-beastman/
          </button>
        </div>

        {scrapeMessage && (
          <div className="p-3 sm:p-3.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 break-words">{scrapeMessage}</span>
          </div>
        )}
      </div>

      {/* ── CHAPTERS PREVIEW (JIKA ADA DARI SCRAPE) ── */}
      {scrapedChapters.length > 0 && (
        <div className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-4 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border pb-3.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <ListChecks className="w-5 h-5 text-accent-red flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-text-primary text-sm sm:text-base truncate">
                  Daftar Chapter Ditemukan ({scrapedChapters.length})
                </h3>
                <p className="text-xs text-text-muted">
                  {selectedChapters.size} chapter terpilih untuk disimpan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={selectAllChapters}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent-red transition-colors"
              >
                Pilih Semua
              </button>
              <button
                type="button"
                onClick={deselectAllChapters}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-muted hover:text-text-primary transition-colors"
              >
                Batalkan Semua
              </button>
            </div>
          </div>

          <label className="flex items-start sm:items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-bg-elevated/70 border border-border cursor-pointer hover:border-accent-red/40 transition-colors">
            <input
              type="checkbox"
              checked={importChaptersWithImages}
              onChange={(e) => setImportChaptersWithImages(e.target.checked)}
              className="w-4 h-4 mt-0.5 sm:mt-0 accent-accent-red rounded cursor-pointer flex-shrink-0"
            />
            <span className="text-xs sm:text-sm font-semibold text-text-primary leading-snug">
              Ambil & simpan semua gambar chapter ke database secara otomatis saat tombol &ldquo;Simpan Manga&rdquo; ditekan
            </span>
          </label>

          <div
            className="max-h-72 sm:max-h-80 overflow-y-auto space-y-2 pr-1.5"
            style={{ scrollbarWidth: 'thin' }}
          >
            {scrapedChapters.map((ch) => {
              const isSelected = selectedChapters.has(ch.slug);
              return (
                <div
                  key={ch.slug}
                  onClick={() => toggleChapter(ch.slug)}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-sm cursor-pointer transition-colors gap-2 ${
                    isSelected
                      ? 'bg-accent-red/10 border-accent-red/40 text-text-primary'
                      : 'bg-bg-primary border-border text-text-muted opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 accent-accent-red rounded flex-shrink-0"
                    />
                    <span className="font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-secondary flex-shrink-0">
                      Ch. {ch.chapter_index}
                    </span>
                    <span className="font-semibold truncate text-xs sm:text-sm">
                      {ch.title}
                    </span>
                  </div>
                  {ch.link && (
                    <a
                      href={ch.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-muted hover:text-accent-red p-1 flex-shrink-0"
                      title="Lihat halaman asli"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MANGA DETAIL FORM ── */}
      <form
        onSubmit={handleSubmit}
        className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm space-y-5 sm:space-y-6 min-w-0"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-xs sm:text-sm p-3.5 sm:p-4 rounded-xl font-medium">
            Error: {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 min-w-0">
          {/* Judul Komik */}
          <div className="space-y-1.5 sm:col-span-2 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Judul Komik <span className="text-accent-red">*</span>
            </label>
            <input
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Cth: Pet Beastman"
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all"
            />
          </div>

          {/* Judul Alternatif */}
          <div className="space-y-1.5 sm:col-span-2 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Judul Alternatif (Opsional)
            </label>
            <input
              name="alternativeTitle"
              value={formData.alternativeTitle}
              onChange={handleChange}
              placeholder="Cth: 애완수인, SOO IN"
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all"
            />
          </div>

          {/* Slug URL */}
          <div className="space-y-1.5 sm:col-span-2 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Slug URL (Unik) <span className="text-accent-red">*</span>
            </label>
            <input
              required
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="pet-beastman"
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red focus:ring-1 focus:ring-accent-red outline-none transition-all font-mono"
            />
            <p className="text-[11px] text-text-muted">
              Akan menjadi URL: /manga/<strong>{formData.slug || '...'}</strong>
            </p>
          </div>

          {/* Cover / Thumbnail URL */}
          <div className="space-y-1.5 sm:col-span-2 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              URL Cover / Thumbnail
            </label>
            <div className="flex items-center gap-3 min-w-0">
              <input
                name="thumb"
                value={formData.thumb}
                onChange={handleChange}
                placeholder="https://.../thumb.webp"
                className="w-full sm:flex-1 min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all font-mono"
              />
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-border overflow-hidden flex-shrink-0 bg-bg-elevated flex items-center justify-center">
                {formData.thumb ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={formData.thumb}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-text-muted" />
                )}
              </div>
            </div>
          </div>

          {/* Penulis */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Penulis / Author
            </label>
            <input
              name="metadata.author"
              value={formData.metadata.author}
              onChange={handleChange}
              placeholder="Oh Iron, Osure"
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all"
            />
          </div>

          {/* Seri / Penerbit */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Seri / Penerbit
            </label>
            <input
              type="text"
              placeholder="Toptoon"
              name="metadata.series"
              value={formData.metadata.series}
              onChange={handleChange}
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all"
            />
          </div>

          {/* Tipe Komik */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Tipe Komik
            </label>
            <select
              name="metadata.type"
              value={formData.metadata.type}
              onChange={handleChange}
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all cursor-pointer"
            >
              <option value="manga">Manga</option>
              <option value="manhwa">Manhwa</option>
              <option value="doujinshi">Doujinshi</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Status Komik
            </label>
            <select
              name="metadata.status"
              value={formData.metadata.status}
              onChange={handleChange}
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all cursor-pointer"
            >
              <option value="Publishing">Publishing (Ongoing)</option>
              <option value="Finished">Finished (Tamat)</option>
            </select>
          </div>

          {/* Rating */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Rating (Skala 1 - 10)
            </label>
            <input
              type="text"
              placeholder="8.8"
              name="metadata.rating"
              value={formData.metadata.rating}
              onChange={handleChange}
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all"
            />
          </div>

          {/* Tahun Rilis */}
          <div className="space-y-1.5 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Tahun Rilis
            </label>
            <input
              type="text"
              placeholder="2026"
              name="metadata.created"
              value={formData.metadata.created}
              onChange={handleChange}
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all"
            />
          </div>

          {/* Genre / Tags */}
          <div className="space-y-1.5 sm:col-span-2 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Genre / Tags (Pisahkan dengan koma)
            </label>
            <input
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Action, Full Color, Webtoon, Romance"
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm focus:border-accent-red outline-none transition-all"
            />
          </div>

          {/* Sinopsis */}
          <div className="space-y-1.5 sm:col-span-2 min-w-0">
            <label className="text-xs sm:text-sm font-semibold text-text-primary">
              Sinopsis Cerita
            </label>
            <textarea
              name="synopsis"
              value={formData.synopsis}
              onChange={handleChange}
              rows={4}
              placeholder="Sinopsis singkat komik..."
              className="w-full min-w-0 bg-bg-primary border border-border text-text-primary rounded-xl px-3.5 sm:px-4 py-3 text-sm focus:border-accent-red outline-none transition-all leading-relaxed resize-y min-h-[100px]"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 sm:pt-6 border-t border-border flex flex-col sm:flex-row justify-end gap-3">
          <Link
            href="/admin/mangas"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors text-center border border-border sm:border-transparent"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-accent-red text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent-redDark transition-colors flex items-center justify-center min-w-[170px] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg shadow-accent-red/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Manga</span>
            )}
          </button>
        </div>
      </form>

      {/* ── MODAL PROGRES IMPORT CHAPTER ── */}
      {importProgress.active && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 mx-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent-red/20 text-accent-red flex items-center justify-center mx-auto">
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-text-primary">
                Mengimport Chapter & Gambar
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {importProgress.title}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                <span>
                  Chapter {importProgress.current} dari {importProgress.total}
                </span>
                <span>
                  {importProgress.total > 0
                    ? Math.round(
                        (importProgress.current / importProgress.total) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-bg-elevated h-2.5 sm:h-3 rounded-full overflow-hidden border border-border">
                <div
                  className="bg-gradient-to-r from-accent-red to-orange-500 h-full transition-all duration-300"
                  style={{
                    width: `${
                      importProgress.total > 0
                        ? (importProgress.current / importProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-text-muted">
              Mohon tunggu sejenak dan jangan menutup halaman ini...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
