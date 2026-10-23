'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TrendingSlider({ trending = [] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (trending.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % Math.min(trending.length, 5));
    }, 4000);
    return () => clearInterval(interval);
  }, [trending.length]);

  if (!trending?.length) return null;

  const items = trending.slice(0, 5);
  const item = items[current];

  // Normalisasi field
  const coverImage = item?.coverImage || item?.thumb || '';
  const type = item?.type || item?.metadata?.type || '';
  const status = item?.status || item?.metadata?.status || '';
  const rating = parseFloat(item?.metadata?.rating) || item?.rating || 0;

  return (
    <div className="relative w-full overflow-hidden h-[240px] sm:h-[280px] md:h-[340px] lg:h-[380px] rounded-2xl md:my-4 shadow-xl group">
      {/* Background blur */}
      <div className="absolute inset-0">
        {coverImage && (
          <Image
            src={coverImage}
            alt={item?.title || ''}
            fill
            className="object-cover scale-110 opacity-30 md:opacity-25"
            referrerPolicy="no-referrer"
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-bg-primary/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-end p-4 sm:p-6 lg:p-8">
        <div className="flex gap-4 sm:gap-6 items-end w-full">
          {/* Cover */}
          <Link href={`/manga/${item?.slug}`} className="flex-none">
            <div className="w-20 h-28 sm:w-28 sm:h-40 md:w-36 md:h-52 lg:w-44 lg:h-60 rounded-xl md:rounded-2xl overflow-hidden border-2 border-accent-red shadow-xl shadow-accent-red/20 flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={item?.title || ''}
                  width={180}
                  height={250}
                  className="object-cover w-full h-full"
                  referrerPolicy="no-referrer"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-bg-elevated" />
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0 mb-1">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className="text-xs sm:text-sm font-bold text-accent-red uppercase tracking-widest font-display flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0">
                  <path d="M12 2C9 7 6 9.5 6 13a6 6 0 0012 0c0-3.5-3-6-6-11zm0 18a4 4 0 01-4-4c0-2.5 2-4.5 4-8 2 3.5 4 5.5 4 8a4 4 0 01-4 4z" />
                </svg>
                Trending #{current + 1}
              </span>
            </div>
            <Link href={`/manga/${item?.slug}`}>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl text-text-primary line-clamp-2 leading-tight tracking-wider mb-2 hover:text-accent-red transition-colors">
                {item?.title}
              </h2>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {type && (
                <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border text-text-secondary uppercase">
                  {type}
                </span>
              )}
              {status && (
                <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${status?.toLowerCase() === 'publishing' || status?.toLowerCase() === 'ongoing'
                  ? 'bg-green-900/60 text-green-400 border border-green-800'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}>
                  {status?.toLowerCase() === 'publishing' || status?.toLowerCase() === 'ongoing' ? 'ONG' : 'END'}
                </span>
              )}
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="#ffd700" className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="text-xs sm:text-sm font-bold text-accent-gold">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Synopsis on tablet/desktop */}
            {item?.synopsis && (
              <p className="hidden md:block text-xs lg:text-sm text-text-secondary mt-2.5 line-clamp-2 max-w-3xl leading-relaxed">
                {item.synopsis}
              </p>
            )}

            {/* CTA Button on desktop */}
            <div className="hidden sm:flex items-center gap-3 mt-3">
              <Link
                href={`/manga/${item?.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-accent-red text-white text-xs md:text-sm font-bold hover:bg-accent-redDark transition-colors shadow-lg shadow-accent-red/20"
              >
                <span>Baca Komik</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next controls for desktop */}
      <div className="hidden md:flex absolute inset-y-0 left-0 right-0 items-center justify-between px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + Math.min(trending.length, 5)) % Math.min(trending.length, 5))}
          className="pointer-events-auto p-2 rounded-xl bg-bg-card/80 backdrop-blur-md border border-border text-text-primary hover:bg-accent-red hover:text-white transition-all shadow-lg"
          title="Previous"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % Math.min(trending.length, 5))}
          className="pointer-events-auto p-2 rounded-xl bg-bg-card/80 backdrop-blur-md border border-border text-text-primary hover:bg-accent-red hover:text-white transition-all shadow-lg"
          title="Next"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 right-4 sm:right-6 flex gap-1.5 z-20">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'bg-accent-red w-5 h-2' : 'bg-border hover:bg-text-muted w-2 h-2'
              }`}
          />
        ))}
      </div>
    </div>
  );
}
