import Link from 'next/link';
import MangaCard from './MangaCard';

export default function MangaSection({ title, mangas = [], href, accent = false }) {
  if (!mangas?.length) return null;

  return (
    <section className="mb-8 md:mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-5 bg-accent-red rounded-full" />
          <h2 className={`font-display text-xl sm:text-2xl tracking-widest ${accent ? 'text-accent-red' : 'text-text-primary'}`}>
            {title}
          </h2>
        </div>
        {href && (
          <Link href={href} className="text-xs sm:text-sm font-bold text-text-muted hover:text-accent-red transition-colors flex items-center gap-1 group">
            <span>Lihat Semua</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        )}
      </div>

      {/* Mobile Horizontal Scroll */}
      <div className="md:hidden -mx-3 px-3">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {mangas.map((manga) => (
            <div key={manga._id || manga.slug} className="flex-none w-[130px] sm:w-[145px] snap-start">
              <MangaCard manga={manga} size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Grid Layout (4 to 6 columns) */}
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5">
        {mangas.slice(0, 12).map((manga) => (
          <MangaCard key={manga._id || manga.slug} manga={manga} />
        ))}
      </div>
    </section>
  );
}

export function MangaGrid({ mangas = [] }) {
  if (!mangas?.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
      {mangas.map((manga) => (
        <MangaCard key={manga._id || manga.slug} manga={manga} />
      ))}
    </div>
  );
}
