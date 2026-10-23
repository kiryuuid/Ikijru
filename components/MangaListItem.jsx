import Link from 'next/link';
import Image from 'next/image';

export default function MangaListItem({ manga }) {
  if (!manga) return null;

  const coverImage = manga.coverImage || manga.thumb || '';
  const type = manga.type || manga.metadata?.type || '';
  const status = manga.status || manga.metadata?.status || '';

  return (
    <Link
      href={`/manga/${manga.slug}`}
      className="group flex items-center gap-3 p-3 rounded-xl bg-bg-card border border-border hover:border-accent-red/60 hover:shadow-lg hover:shadow-black/30 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative flex-none w-14 h-20 rounded-lg overflow-hidden bg-bg-elevated">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={manga.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="56px"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-bg-elevated" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-text-primary group-hover:text-accent-red transition-colors line-clamp-2 leading-tight mb-1.5">
          {manga.title}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          {type && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
              type.toLowerCase() === 'manhwa' ? 'bg-purple-900/40 text-purple-300 border-purple-800/60'
              : type.toLowerCase() === 'doujinshi' ? 'bg-pink-900/40 text-pink-300 border-pink-800/60'
              : type.toLowerCase() === 'manhua' ? 'bg-orange-900/40 text-orange-300 border-orange-800/60'
              : 'bg-blue-900/40 text-blue-300 border-blue-800/60'
            }`}>
              {type}
            </span>
          )}
          {status && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border ${
              status?.toLowerCase() === 'publishing' || status?.toLowerCase() === 'ongoing'
                ? 'bg-green-900/40 text-green-400 border-green-800/60'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}>
              {status?.toLowerCase() === 'publishing' || status?.toLowerCase() === 'ongoing' ? 'ONG' : 'END'}
            </span>
          )}
        </div>
        <p className="text-text-muted text-[10px]">
          {manga.chapter_count > 0 ? `${manga.chapter_count} chapter` : ''}
        </p>
      </div>

      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted group-hover:text-accent-red flex-shrink-0">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
