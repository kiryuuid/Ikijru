/**
 * ============================================================
 *  KONFIGURASI IKLAN — lib/ads.js
 * ============================================================
 */

export const ADS_CONFIG = {

  // ─── AKTIFKAN / MATIKAN SEMUA IKLAN ──────────────────────
  ENABLED: true,

  // ─── PILIH JARINGAN IKLAN ────────────────────────────────
  NETWORK: 'custom',

  // ─── GOOGLE ADSENSE ──────────────────────────────────────
  ADSENSE: {
    CLIENT_ID: 'ca-pub-XXXXXXXXXXXXXXXX',
    SLOTS: {
      HEADER_BANNER: '',
      IN_CONTENT: '',
      BEFORE_CHAPTERS: '',
      READER_TOP: '',
      READER_BOTTOM: '',
      BROWSE_BANNER: '',
      STICKY_BOTTOM: '',
    },
  },

  // ─── ADSTERRA / CUSTOM HTML ──────────────────────────────
  CUSTOM: {
    // SLOTS: Untuk iklan banner (tanpa tag script)
    SLOTS: {
      HEADER_BANNER: ``,
      IN_CONTENT: ``,
      READER_TOP: ``,
      READER_BOTTOM: ``,
      BEFORE_CHAPTERS: ``,
      BROWSE_BANNER: ``,
      STICKY_BOTTOM: ``,
    },

    // SCRIPT_GLOBAL: URL script saja (bukan tag HTML lengkap)
    SCRIPT_GLOBAL: {
      SRC: 'https://js.wpadmngr.com/static/adManager.js', // URL script
      DATA_ATTRIBUTES: { 'data-admpid': '314095' } // Data attributes jika ada
    },

    // Atau jika script inline:
    // INLINE_SCRIPT: `(function(){ ... })()`,
  },
};