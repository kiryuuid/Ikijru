import Link from 'next/link';
import Image from 'next/image';

export default function MangaCard({ manga, size = 'md' }) {
  if (!manga) return null;

  // Normalisasi field — pastikan coverImage selalu tersedia
  const coverImage = manga.coverImage || manga.thumb || '';
  const type = manga.type || manga.metadata?.type || '';
  const status = manga.status || manga.metadata?.status || '';
  const rating = parseFloat(manga.metadata?.rating) || manga.rating || 0;

  return (
    <Link
      href={`/manga/${manga.slug}`}
      className="group block rounded-xl overflow-hidden bg-bg-card border border-border hover:border-accent-red transition-all duration-300 hover:shadow-card-hover hover:shadow-black/70 hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[2/3] overflow-hidden flex-shrink-0 bg-bg-elevated">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={manga.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-text-muted">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M8 7h8M8 12h8M8 17h5" />
            </svg>
          </div>
        )}

        {/* Gradient overlay - blends seamlessly into bg-card */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-card/95 via-transparent to-transparent pointer-events-none" />

        {/* Type badge */}
        {type && (
          <div className="absolute top-2 left-2">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider leading-none shadow-md backdrop-blur-sm ${type?.toLowerCase() === 'manga'
              ? 'bg-orange-500 text-white'
              : type?.toLowerCase() === 'manhwa'
                ? 'bg-purple-600 text-white'
                : type?.toLowerCase() === 'doujinshi'
                  ? 'bg-pink-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
              {type}
            </span>
          </div>
        )}

        {/* Status badge */}
        {status && (
          <div className="absolute top-2 right-2">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider leading-none shadow-md backdrop-blur-sm ${status?.toLowerCase() === 'publishing' || status?.toLowerCase() === 'ongoing'
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-800/90 text-zinc-300 border border-zinc-700/50'
              }`}>
              {status?.toLowerCase() === 'publishing' || status?.toLowerCase() === 'ongoing' ? 'ONG' : 'END'}
            </span>
          </div>
        )}

        {/* Chapter count & Rating overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 pt-6 bg-gradient-to-t from-bg-card to-transparent">
          <div className="flex items-center justify-between">
            <p className="text-white text-[11px] font-bold truncate leading-none drop-shadow">
              {manga.chapter_count > 0 ? `${manga.chapter_count} Chapter` : ''}
            </p>
            {rating > 0 && (
              <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                <svg viewBox="0 0 24 24" fill="#fbbf24" className="w-3 h-3 flex-shrink-0">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-[10px] text-white font-bold leading-none">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="p-2.5 flex-1 flex flex-col justify-between bg-bg-card">
        <h3 className="text-xs sm:text-[13px] font-bold text-text-primary group-hover:text-accent-red transition-colors line-clamp-2 leading-snug">
          {manga.title}
        </h3>
        {manga.views > 0 && (
          <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>{formatViews(manga.views)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
