import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Pojokmanga';

export const metadata = {
  title: 'Terms of Service',
  description: `Syarat dan Ketentuan layanan ${SITE_NAME}.`,
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-16 md:pt-20 pb-safe max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-bg-card border border-border rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent-red">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-text-primary tracking-widest">TERMS OF SERVICE</h1>
          </div>
          <p className="text-text-muted text-xs mt-1 ml-12">Syarat & Ketentuan Penggunaan Layanan · Terakhir diperbarui: 28 Februari 2026</p>
        </div>

        {/* Content Card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-8 text-text-secondary text-sm leading-relaxed space-y-6 shadow-xl mb-8">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              1. Penerimaan Syarat
            </h2>
            <p>
              Dengan mengakses dan menggunakan website {SITE_NAME}, kamu setuju untuk terikat oleh Syarat dan Ketentuan Layanan ini serta Kebijakan Privasi kami. Jika kamu tidak setuju, mohon untuk tidak menggunakan layanan ini.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              2. Penggunaan Layanan
            </h2>
            <p className="mb-2">
              Layanan ini disediakan hanya untuk keperluan hiburan pribadi. Kamu setuju untuk tidak:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
              <li>Menggunakan layanan ini untuk tujuan ilegal atau melanggar hukum.</li>
              <li>Mencoba mengganggu kinerja server atau keamanan website kami.</li>
              <li>Membuat banyak akun palsu untuk menyalahgunakan sistem kuota atau promosi.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              3. Akun Pengguna
            </h2>
            <p>
              Kamu bertanggung jawab untuk menjaga kerahasiaan akun kamu. Kami berhak menangguhkan atau menghapus akun yang terbukti melanggar aturan penggunaan layanan.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              4. Penafian (Disclaimer)
            </h2>
            <p>
              Layanan disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apa pun. Kami tidak menjamin bahwa website akan selalu bebas dari gangguan teknis atau error. Konten yang disediakan dikumpulkan dari berbagai sumber di internet.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              5. Perubahan Ketentuan
            </h2>
            <p>
              Kami dapat memperbarui Ketentuan Layanan ini sewaktu-waktu. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              6. Kontak
            </h2>
            <p>
              Untuk pertanyaan terkait ketentuan layanan, silakan hubungi kami melalui:{' '}
              <a href={`mailto:support-${SITE_NAME.toLowerCase()}@googlegroups.com`} className="text-accent-red font-semibold hover:underline">
                support-{SITE_NAME.toLowerCase()}@googlegroups.com
              </a>
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}