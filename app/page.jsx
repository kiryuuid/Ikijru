import { getHomeData } from '@/lib/api';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Navbar from '@/components/Navbar';
import TrendingSlider from '@/components/TrendingSlider';
import MangaSection from '@/components/MangaSection';
import AdBanner from '@/components/AdBanner';
import Footer from '@/components/Footer';
import Link from 'next/link';

// Konten manga di-cache 5 menit agar performa optimal
export const revalidate = 300;

export const metadata = {
  title: `${process.env.NEXT_PUBLIC_SITE_NAME} - Baca & Download Doujinshi Bahasa Indonesia`,
  description: `Baca & Download Doujinshi Bahasa Indonesia Update chapter terbaru setiap hari di ${process.env.NEXT_PUBLIC_SITE_NAME}!`,
};

export default async function HomePage() {
  // homeData: cached 5 menit (via revalidate = 300 di atas)
  const homeRes = await getHomeData();


  const data = homeRes?.data || {};
  const { recents = [], trending = [], manhwas = [], doujinshis = [], mangas = [] } = data;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />

      <main className="pt-16 md:pt-20 pb-safe max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trending Hero Slider */}
        <TrendingSlider trending={trending} />

        {/* Iklan — di bawah slider, sebelum filter */}
        <AdBanner slot="HEADER_BANNER" className="my-3 md:my-5" />

        {/* Quick type filters */}
        <div className="flex items-center gap-2 sm:gap-2.5 py-3 overflow-x-auto my-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Terbaru', href: '/manga?order=latest' },
            { label: 'Populer', href: '/manga?order=popular' },
            { label: 'Manga', href: '/manga?type=manga' },
            { label: 'Manhwa', href: '/manga?type=manhwa' },
            { label: 'Doujinshi', href: '/manga?type=doujinshi' },
            { label: 'Semua Genre', href: '/genres' },
            { label: 'Changelog', href: '/changelog' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-none text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl bg-bg-card border border-border text-text-secondary hover:border-accent-red hover:text-accent-red hover:bg-bg-elevated transition-all shadow-sm whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Update Terbaru (Recents) */}
        {recents.length > 0 && (
          <MangaSection
            title="UPDATE TERBARU"
            mangas={recents}
            href="/manga?order=latest"
            accent
          />
        )}

        {/* Manhwa */}
        {manhwas.length > 0 && (
          <MangaSection
            title="MANHWA POPULER"
            mangas={manhwas}
            href="/manga?type=manhwa"
          />
        )}

        {/* Iklan — di antara section konten */}
        <AdBanner slot="IN_CONTENT" className="my-4" />

        {/* Doujinshi */}
        {doujinshis.length > 0 && (
          <MangaSection
            title="DOUJINSHI TERBARU"
            mangas={doujinshis}
            href="/manga?type=doujinshi"
          />
        )}

        {/* Manga */}
        {mangas.length > 0 && (
          <MangaSection
            title="MANGA JEPANG"
            mangas={mangas}
            href="/manga?type=manga"
          />
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
