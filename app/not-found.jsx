import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-16 md:pt-20 pb-safe max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <p className="font-display text-8xl text-accent-red tracking-widest mb-4">404</p>
        <h1 className="font-display text-2xl text-text-primary tracking-widest mb-2">HALAMAN TIDAK DITEMUKAN</h1>
        <p className="text-text-muted text-sm mb-8">Komik atau chapter yang kamu cari mungkin sudah dihapus atau tidak ada.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-accent-red text-white font-bold rounded-xl hover:bg-accent-redDark transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </main>
    </div>
  );
}
