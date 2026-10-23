# Panduan Deployment ke Tencent Cloud EdgeOne Pages

Berdasarkan konfigurasi proyek Anda, deployment dilakukan secara otomatis menggunakan **EdgeOne Pages** (sistem Git-integrated deployment). 

Sistem build EdgeOne Pages secara otomatis mendeteksi folder `edge-functions/` di dalam root project Anda, membundel fungsi tersebut, dan memetakan rutenya ke situs web Anda.

---

## Struktur Direktori Proyek Anda
Proyek Anda kini memiliki folder khusus untuk fungsi Edge:
```text
imgproxy/
├── edge-functions/
│   └── index.js      <-- [Fungsi Proxy Utama] Dipetakan otomatis ke "/"
├── server.js         <-- Untuk dijalankan di Node.js lokal / VPS
├── package.json
└── README_EDGEONE.md
```

---

## Langkah Deployment (Git Push)

Karena Anda menggunakan integrasi Git pada EdgeOne Pages, Anda hanya perlu meng-commit perubahan dan melakukan push ke repositori Git Anda (GitHub/GitLab):

1. Buka terminal di folder proyek Anda.
2. Tambahkan semua berkas baru ke Git:
   ```bash
   git add edge-functions/index.js README_EDGEONE.md
   ```
3. Lakukan commit perubahan:
   ```bash
   git commit -m "feat: tambah fungsi proxy untuk EdgeOne Pages"
   ```
4. Push ke repositori remote Anda:
   ```bash
   git push origin main
   ```
   *(Ganti `main` dengan nama branch default yang terhubung ke EdgeOne Pages Anda jika berbeda).*

---

## Langkah 2: Periksa Build di Konsol EdgeOne
1. Masuk ke [Konsol Tencent Cloud EdgeOne](https://console.tencent.com/).
2. Masuk ke halaman detail proyek **EdgeOne Pages** Anda.
3. Anda akan melihat build baru berjalan secara otomatis.
4. Di bagian log build, pastikan log **tidak lagi melewati (skip)** injeksi hook fungsi Edge:
   * **Dulu**: `[injectHooks] bundle file not found, skip`
   * **Sekarang**: Menunjukkan pembundelan sukses untuk `/edge-functions/index.js`.

---

## Cara Penggunaan Setelah Deploy

Fungsi proxy Anda kini dipetakan langsung ke root domain EdgeOne Pages Anda:

```http
https://<domain-pages-anda>/?url=<url_gambar_yang_ingin_diproxy>
```

**Contoh Request:**
```http
https://my-proxy-pages.example.com/?url=https://desu.photos/storage/uploads/example.jpg
```

Untuk mengecek kesehatan fungsi, akses endpoint `/health`:
```http
https://<domain-pages-anda>/health
```
Respons yang diharapkan adalah: `OK`.
