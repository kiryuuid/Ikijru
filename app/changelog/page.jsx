'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const CHANGELOGS = [
  {
    version: 'v2.0.1',
    date: '2026-03-06',
    label: 'hotfix',
    labelColor: 'bg-red-500/20 border-red-500/40 text-red-400',
    dotColor: 'bg-accent-red',
    changes: [
      {
        type: 'fix',
        title: 'Perbaikan Halaman Manga',
        desc: 'Menambahkan pencarian di halaman manga untuk mempermudah pencarian chapter, dan menambahkan short berdasarkan terbaru dan terlama.',
      },
      {
        type: 'fix',
        title: 'Perbaikan Data Bookmark, History & Profil',
        desc: 'Menghapus cache pada halaman Bookmark, History, dan Profil Publik. Sekarang semua data selalu diambil langsung dari server tanpa cache.',
      },
      {
        type: 'fix',
        title: 'Perbaikan Login',
        desc: 'Memperbaiki bug yang menyebabkan data user dikirim dua kali ke backend saat login. Sekarang sinkronisasi hanya dilakukan sekali.',
      },
      {
        type: 'fix',
        title: 'Pembersihan Iklan',
        desc: 'Menghapus semua slot iklan custom yang tidak terpakai agar halaman lebih bersih dan ringan.',
      },
      {
        type: 'fix',
        title: 'Limit Download Sekarang dari Server',
        desc: 'Mengganti sistem limit download, Sekarang member biasa dibatasi 6 download per hari, dan hitungan reset otomatis setiap hari.',
      },
      {
        type: 'feature',
        title: 'Pencarian Pintar (Live Search)',
        desc: 'Fitur pencarian sekarang menampilkan hasil secara langsung saat kamu mengetik, lengkap dengan cover, judul, dan status manga tanpa perlu berpindah halaman.',
      },
      {
        type: 'feature',
        title: 'Mode Terang (Light Theme)',
        desc: 'Akhirnya fitur yang ditunggu-tunggu tiba! Sekarang kamu bisa mengganti tema ke Mode Terang langsung dari tombol matahari/bulan di pojok kanan atas.',
      },
      {
        type: 'feature',
        title: 'Tombol Scroll Cepat di Reader',
        desc: 'Menambahkan tombol navigasi Up & Down mengambang (floating) di halaman baca komik untuk memudahkan scroll langsung ke atas atau ke bawah.',
      },
      {
        type: 'fix',
        title: 'Pembersihan Riwayat Otomatis (1 Hari)',
        desc: 'Riwayat bacaan komik akan tersimpan maksimal 1 hari (24 jam) untuk mencegah server dan database kelebihan beban. Data yang sudah kadaluarsa otomatis dibersihkan.',
      },
      {
        type: 'fix',
        title: 'Limit Download untuk Pengguna Baru',
        desc: 'Setiap anggota yang baru mendaftar atau login akan otomatis menerima alokasi kuota 6 kali unduhan per hari secara Default dari sisi server.',
      },
      {
        type: 'feature',
        title: 'Bebas Iklan (Ad-Free) untuk Premium',
        desc: 'Sistem iklan telah diperbarui! Semua iklan sekarang akan otomatis disembunyikan jika Anda Member Premium, memberi pengalaman baca yang sangat bersih.',
      },
      {
        type: 'fix',
        title: 'Perbaikan Tema',
        desc: 'Sistem tampilan warna sudah diperbaiki total. Bagian Reader dan elemen aplikasi yang sebelumnya terkunci di mode Gelap/Hardcoded telah disesuaikan agar bisa berganti secara cantik saat Mode Terang dinyalakan.',
      },
    ],
  },
];

// ── Icon per type ─────────────────────────────────────────
function TypeIcon({ type }) {
  if (type === 'feature') return (
    <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-green-400">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
  return (
    <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-yellow-400">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-16 md:pt-20 pb-safe max-w-4xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-bg-card border border-border rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-accent-red">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-text-primary tracking-widest">CHANGELOG</h1>
          </div>
          <p className="text-text-muted text-xs mt-1 ml-12">Riwayat pembaruan dan perbaikan Doujindesu</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Fitur Baru
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />Perbaikan
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />Hotfix
          </span>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-8">
            {CHANGELOGS.map((log, i) => (
              <div key={log.version} className="relative pl-7">
                {/* Dot */}
                <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-bg-primary ${log.dotColor} shadow-lg`} />

                {/* Version header */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="font-display text-lg text-text-primary tracking-wider">{log.version}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${log.labelColor}`}>
                    {log.label}
                  </span>
                  <span className="text-text-muted text-[10px] ml-auto">
                    {new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Changes */}
                <div className="space-y-2.5">
                  {log.changes.map((change, j) => (
                    <div key={j} className="flex gap-2.5 bg-bg-card border border-border rounded-xl p-3 hover:border-accent-red/20 transition-colors">
                      <TypeIcon type={change.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-text-primary text-xs font-bold leading-snug">{change.title}</p>
                        <p className="text-text-muted text-[11px] mt-1 leading-relaxed">{change.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
