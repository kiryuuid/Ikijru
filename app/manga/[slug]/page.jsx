import { getMangaDetail } from '@/lib/api';
import Navbar from '@/components/Navbar';
import MangaCard from '@/components/MangaCard';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import BookmarkButton from '@/components/BookmarkButton';
import AdBanner from '@/components/AdBanner';
import ChapterList from '@/components/ChapterList';
import Footer from '@/components/Footer';

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const res = await getMangaDetail(params.slug);
  const manga = res?.data?.info;
  if (!manga) return { title: 'Komik Tidak Ditemukan' };

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://doujindesu.online';
  const coverImage = manga.coverImage || manga.thumb || '';
  const type = manga.type || '';
  const status = manga.status || '';
  const synopsis = manga.synopsis || '';

  return {
    title: `${manga.title} Bahasa Indonesia`,
    description: `Baca ${manga.title} - ${type || 'Komik'} ${status}. ${synopsis?.slice(0, 120) || ''}`,
    openGraph: {
      title: manga.title,
      description: `Baca ${manga.title} di ${process.env.NEXT_PUBLIC_SITE_NAME} gratis!`,
      images: [{ url: coverImage, alt: manga.title }],
      type: 'book',
    },
    alternates: { canonical: `${SITE_URL}/manga/${params.slug}` },
  };
}

function formatNum(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function parsePositiveInt(...values) {
  for (const value of values) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

export default async function MangaDetailPage({ params }) {
  const res = await getMangaDetail(params.slug);
  if (!res?.data?.info) notFound();

  const { info: manga, chapters = [], recommendations = [] } = res.data;

  // Ambil field dari normalizeManga (sudah diproses di lib/api.js)
  const coverImage = manga.coverImage || manga.thumb || '';
  const type = manga.type || '';
  const status = manga.status || '';
  const author = manga.author || '';
  const parody = manga.parody || '';
  const character = manga.character || '';
  const datePublished = manga.datePublished || manga.createdAt || '';
  const synopsis = manga.synopsis || '';
  const rating = manga.rating || 0;
  const genres = manga.tags || manga.genres || [];
  const ratingCount = parsePositiveInt(
    manga.ratingCount,
    manga.reviewCount,
    manga.votes,
    manga.voteCount,
    manga.totalVotes,
    manga.metadata?.ratingCount,
    manga.metadata?.reviewCount,
    manga.metadata?.votes,
    manga.metadata?.voteCount,
    manga.metadata?.totalVotes
  );
  const reviewCount = parsePositiveInt(
    manga.reviewCount,
    manga.ratingCount,
    manga.reviews,
    manga.reviewTotal,
    manga.metadata?.reviewCount,
    manga.metadata?.ratingCount,
    manga.metadata?.reviews,
    manga.metadata?.reviewTotal
  );

  const firstChapter = chapters[chapters.length - 1];
  const latestChapter = chapters[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: manga.title,
    image: coverImage,
    author: { '@type': 'Organization', name: author || 'Unknown' },
    genre: genres?.join(', '),
    ...(rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        bestRating: 10,
        ratingCount: ratingCount || 1,
        reviewCount: reviewCount || ratingCount || 1,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="pt-16 md:pt-20 pb-safe max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* ── HERO BANNER ─── */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl mb-6" style={{ minHeight: '220px' }}>
          {coverImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={coverImage}
                alt={`${manga.title} cover`}
                fill
                className="object-cover scale-110 opacity-25 md:opacity-20 blur-10"
                referrerPolicy="no-referrer"
                unoptimized
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-bg-primary via-bg-primary/80 to-bg-primary/40" />
            </div>
          )}

          {/* Mobile Header (md:hidden) */}
          <div className="relative z-10 px-4 pt-5 pb-5 flex gap-4 md:hidden">
            {/* Cover Mobile */}
            <div className="flex-none w-24 rounded-xl overflow-hidden border-2 border-accent-red shadow-xl shadow-accent-red/20 self-start">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={manga.title}
                  width={96}
                  height={136}
                  className="object-cover w-full"
                  style={{ aspectRatio: '2/3' }}
                  referrerPolicy="no-referrer"
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full bg-bg-elevated" style={{ aspectRatio: '2/3' }} />
              )}
            </div>

            {/* Info Mobile */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h1 className="font-display text-xl text-text-primary leading-tight tracking-wide mb-2">
                {manga.title}
              </h1>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {type && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${type?.toLowerCase() === 'manhwa' ? 'bg-purple-900/50 border-purple-700 text-purple-300'
                    : type?.toLowerCase() === 'manhua' ? 'bg-orange-900/50 border-orange-700 text-orange-300'
                      : type?.toLowerCase() === 'doujinshi' ? 'bg-pink-900/50 border-pink-700 text-pink-300'
                        : 'bg-blue-900/50 border-blue-700 text-blue-300'
                    }`}>
                    {type}
                  </span>
                )}
                {status && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${status?.toLowerCase() === 'ongoing' || status?.toLowerCase() === 'publishing'
                    ? 'bg-green-900/50 border-green-700 text-green-300'
                    : 'bg-gray-800 border-gray-600 text-gray-400'
                    }`}>
                    {status}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {rating > 0 && (
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="#ffd700" className="w-3.5 h-3.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="font-bold text-accent-gold">{rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-text-muted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{formatNum(manga.views)}</span>
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                  <span>{chapters.length} Ch</span>
                </div>
              </div>

              {author && (
                <p className="text-text-muted text-xs mt-1 truncate">
                  Author: <span className="text-text-secondary font-semibold">{author}</span>
                </p>
              )}
              {parody && (
                <p className="text-text-muted text-xs mt-0.5 truncate">
                  Parody: <span className="text-accent-red font-semibold">{parody}</span>
                </p>
              )}
              {character && (
                <p className="text-text-muted text-xs mt-0.5 truncate">
                  Character: <span className="text-text-secondary font-semibold">{character}</span>
                </p>
              )}
            </div>
          </div>

          {/* Desktop Banner Content (hidden on mobile) */}
          <div className="hidden md:flex relative z-10 p-6 lg:p-8 items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {type && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${type?.toLowerCase() === 'manhwa' ? 'bg-purple-900/50 border-purple-700 text-purple-300'
                    : type?.toLowerCase() === 'manhua' ? 'bg-orange-900/50 border-orange-700 text-orange-300'
                      : type?.toLowerCase() === 'doujinshi' ? 'bg-pink-900/50 border-pink-700 text-pink-300'
                        : 'bg-blue-900/50 border-blue-700 text-blue-300'
                    }`}>
                    {type}
                  </span>
                )}
                {status && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${status?.toLowerCase() === 'ongoing' || status?.toLowerCase() === 'publishing'
                    ? 'bg-green-900/50 border-green-700 text-green-300'
                    : 'bg-gray-800 border-gray-600 text-gray-400'
                    }`}>
                    {status}
                  </span>
                )}
                {author && (
                  <span className="text-xs text-text-muted border border-border bg-bg-card/60 px-3 py-1 rounded-full">
                    Penulis: <strong className="text-text-primary">{author}</strong>
                  </span>
                )}
                {parody && (
                  <span className="text-xs text-text-muted border border-border bg-bg-card/60 px-3 py-1 rounded-full">
                    Parody: <strong className="text-accent-red">{parody}</strong>
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl lg:text-5xl text-text-primary tracking-wide leading-tight mb-3">
                {manga.title}
              </h1>

              {/* Stats Bar Desktop */}
              <div className="flex items-center gap-5 text-sm">
                {rating > 0 && (
                  <div className="flex items-center gap-1.5 bg-bg-card/70 border border-border px-3 py-1 rounded-xl">
                    <svg viewBox="0 0 24 24" fill="#ffd700" className="w-4 h-4">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="font-bold text-accent-gold text-base">{rating.toFixed(1)}</span>
                    <span className="text-xs text-text-muted">/ 10</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-text-muted bg-bg-card/70 border border-border px-3 py-1 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{formatNum(manga.views)} views</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted bg-bg-card/70 border border-border px-3 py-1 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                  </svg>
                  <span>{chapters.length} Total Chapter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT (DESKTOP TWO COLUMNS) ── */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">

          {/* LEFT SIDEBAR (STICKY ON DESKTOP) */}
          <div className="w-full md:w-64 lg:w-72 flex-shrink-0 md:sticky md:top-24 space-y-4">
            {/* Desktop Cover */}
            <div className="hidden md:block rounded-2xl overflow-hidden border-2 border-accent-red shadow-2xl shadow-accent-red/20 aspect-[2/3] relative bg-bg-card">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={manga.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full h-full bg-bg-elevated flex items-center justify-center text-text-muted">No Image</div>
              )}
            </div>

            {/* Tombol Baca CTA */}
            {chapters.length > 0 && (
              <div className="flex flex-col gap-2.5">
                {firstChapter && (
                  <Link
                    href={`/read/${manga.slug}/${firstChapter.slug}`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-accent-red text-white font-bold rounded-xl text-sm hover:bg-accent-redDark transition-colors shadow-lg shadow-accent-red/20"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    Mulai Baca (Ch. {firstChapter.chapter_index || '1'})
                  </Link>
                )}
                {latestChapter && latestChapter.slug !== firstChapter?.slug && (
                  <Link
                    href={`/read/${manga.slug}/${latestChapter.slug}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-bg-elevated border border-border text-text-primary font-bold rounded-xl text-xs hover:border-accent-red transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                    </svg>
                    Chapter Terbaru ({latestChapter.title || latestChapter.chapter_index})
                  </Link>
                )}
              </div>
            )}

            {/* Bookmark Button */}
            <div className="w-full">
              <BookmarkButton manga={manga} />
            </div>

            {/* Metadata Specs Box */}
            <div className="bg-bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3 text-xs">
              <h3 className="font-bold text-text-primary text-sm border-b border-border pb-2">Informasi Komik</h3>
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-text-muted">Status</span>
                <span className="font-bold text-text-primary">{status || 'Publishing'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-text-muted">Tipe</span>
                <span className="font-bold uppercase text-accent-red">{type || 'Manga'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-text-muted">Penulis</span>
                <span className="font-bold text-text-primary truncate max-w-[140px] text-right">{author || '-'}</span>
              </div>
              {parody && (
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-text-muted">Parody</span>
                  <span className="font-bold text-accent-red truncate max-w-[140px] text-right">{parody}</span>
                </div>
              )}
              {character && (
                <div className="flex justify-between items-start py-1 border-b border-border">
                  <span className="text-text-muted flex-shrink-0">Character</span>
                  <span className="font-bold text-text-primary text-right pl-2 leading-relaxed">{character}</span>
                </div>
              )}
              {datePublished && (
                <div className="flex justify-between items-center py-1 border-b border-border">
                  <span className="text-text-muted">Rilis</span>
                  <span className="font-bold text-text-primary">
                    {new Date(datePublished).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-text-muted">Total Chapter</span>
                <span className="font-bold text-text-primary">{chapters.length}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-muted">Total Pembaca</span>
                <span className="font-bold text-text-primary">{formatNum(manga.views)}</span>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="flex-1 min-w-0 space-y-6 w-full">

            {/* Mobile-Only CTA Buttons */}
            {chapters.length > 0 && (
              <div className="md:hidden flex gap-2.5">
                {firstChapter && (
                  <Link
                    href={`/read/${manga.slug}/${firstChapter.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-accent-red text-white font-bold rounded-xl text-xs hover:bg-accent-redDark transition-colors shadow-lg"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    Mulai Baca
                  </Link>
                )}
                {latestChapter && (
                  <Link
                    href={`/read/${manga.slug}/${latestChapter.slug}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-bg-elevated border border-border text-text-primary font-bold rounded-xl text-xs hover:border-accent-red transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                    Ch. Terbaru
                  </Link>
                )}
              </div>
            )}

            {/* Mobile-Only Bookmark */}
            <div className="md:hidden">
              <BookmarkButton manga={manga} />
            </div>

            {/* Genres / Tags */}
            {genres?.length > 0 && (
              <div className="bg-bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2.5">Genre & Kategori</h2>
                <div className="flex flex-wrap gap-2">
                  {genres.map((g) => (
                    <Link
                      key={g}
                      href={`/manga?genre=${encodeURIComponent(g)}`}
                      className="text-xs font-bold px-3 py-1.5 bg-bg-elevated text-text-secondary rounded-xl border border-border hover:text-white hover:bg-accent-red hover:border-accent-red transition-all shadow-sm"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Synopsis */}
            {synopsis && (
              <div className="bg-bg-card border border-border rounded-2xl p-5 md:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-4 bg-accent-red rounded-full" />
                  <h2 className="font-display text-lg tracking-widest text-text-primary">SINOPSIS</h2>
                </div>
                <p className="text-text-secondary text-sm md:text-base leading-relaxed whitespace-pre-line">{synopsis}</p>
              </div>
            )}

            <AdBanner slot="BEFORE_CHAPTERS" className="my-2" />

            {/* Chapter List */}
            {chapters.length > 0 && (
              <div className="bg-bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
                <ChapterList chapters={chapters} mangaSlug={manga.slug} />
              </div>
            )}
          </div>
        </div>

        {/* ── REKOMENDASI ── */}
        {recommendations.length > 0 && (
          <div className="mt-12 mb-8 border-t border-border pt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-5 bg-accent-red rounded-full" />
                <h2 className="font-display text-xl sm:text-2xl tracking-widest text-text-primary">REKOMENDASI LAINNYA</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {recommendations.map((rec) => (
                <MangaCard key={rec.slug} manga={rec} size="sm" />
              ))}
            </div>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
