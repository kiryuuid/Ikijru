import { getGenres } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import AdBanner from '@/components/AdBanner';
import Footer from '@/components/Footer';

export const revalidate = 600;

export const metadata = {
  title: 'Daftar Genre',
  description: `Jelajahi komik berdasarkan genre. Action, Romance, Fantasy, Horror, dan ratusan genre lainnya tersedia di ${process.env.NEXT_PUBLIC_SITE_NAME}.`,
};

function GenreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent-red flex-shrink-0">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

export default async function GenresPage() {
  const res = await getGenres();
  const genres = res?.data || [];

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-16 md:pt-20 pb-safe max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <h1 className="font-display text-2xl sm:text-3xl text-text-primary tracking-widest">GENRE KOMIK</h1>
          <p className="text-text-muted text-xs sm:text-sm mt-0.5">{genres.length} genre komik tersedia</p>
        </div>

        <AdBanner slot="BROWSE_BANNER" className="mb-5" />

        {genres.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {genres.map((genre) => (
              <Link
                key={genre.name}
                href={`/manga?genre=${encodeURIComponent(genre.name)}`}
                className="group flex items-center gap-3 p-3.5 rounded-xl bg-bg-card border border-border hover:border-accent-red transition-all duration-200 hover:shadow-lg hover:shadow-accent-red/10 hover:-translate-y-0.5"
              >
                <GenreIcon />
                <div className="min-w-0">
                  <p className="font-bold text-text-primary capitalize text-sm truncate group-hover:text-accent-red transition-colors">
                    {genre.name}
                  </p>
                  <p className="text-text-muted text-xs">{genre.count} judul</p>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-text-muted group-hover:text-accent-red ml-auto flex-shrink-0 transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
            <div className="w-16 h-16 bg-bg-elevated rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-text-muted">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <p className="font-display text-xl text-text-secondary tracking-wider">BELUM ADA GENRE</p>
          </div>
        )}

        <Footer />
      </main>
    </div>
  );
}
