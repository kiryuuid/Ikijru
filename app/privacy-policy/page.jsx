import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Kebijakan Privasi untuk layanan Doujindesu.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-16 md:pt-20 pb-safe max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-bg-card border border-border rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent-red">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-text-primary tracking-widest">PRIVACY POLICY</h1>
          </div>
          <p className="text-text-muted text-xs mt-1 ml-12">Kebijakan Privasi & Perlindungan Data Pengguna · Terakhir diperbarui: 28 Februari 2026</p>
        </div>

        {/* Content Card */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-8 text-text-secondary text-sm leading-relaxed space-y-6 shadow-xl mb-8">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p>
              Saat kamu menggunakan layanan login menggunakan akun Google (Google OAuth), kami hanya meminta akses ke informasi profil dasar kamu. Informasi tersebut meliputi:{' '}
              <strong className="text-text-primary">Alamat Email, Nama, dan Foto Profil</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              2. Penggunaan Informasi
            </h2>
            <p className="mb-2">
              Data yang kami dapatkan dari Google hanya digunakan secara eksklusif untuk:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-text-secondary">
              <li>Membuat dan mengelola akun pengguna kamu di website doujindesu.</li>
              <li>Menyimpan preferensi membaca, riwayat, dan bookmark komik kamu.</li>
              <li>Mengidentifikasi sesi login kamu agar tetap aman.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              3. Keamanan dan Berbagi Data
            </h2>
            <p>
              Kami <strong className="text-accent-red">tidak pernah</strong> menjual, menyewakan, atau membagikan data pribadi kamu kepada pihak ketiga mana pun. Data kamu disimpan dengan aman di database kami dan hanya digunakan untuk keperluan internal website.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              4. Penghapusan Data
            </h2>
            <p>
              Jika kamu ingin menghapus akun dan seluruh data yang terkait dari server kami, kamu dapat menghubungi kami melalui email dukungan di bawah ini.
            </p>
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary mb-2 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-red rounded-full" />
              5. Kontak Kami
            </h2>
            <p>
              Jika kamu memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di:{' '}
              <a href="mailto:support-doujindesu@googlegroups.com" className="text-accent-red font-semibold hover:underline">
                support-doujindesu@googlegroups.com
              </a>
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}