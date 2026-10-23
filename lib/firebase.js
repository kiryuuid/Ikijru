import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent as firebaseLogEvent } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // ← wajib untuk Analytics
};

// Cegah inisialisasi ganda saat hot reload
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Analytics (hanya client-side, tidak jalan di SSR) ───
let analyticsInstance = null;

export async function getAnalyticsInstance() {
  if (typeof window === 'undefined') return null;           // skip SSR
  if (analyticsInstance) return analyticsInstance;
  const supported = await isSupported();                    // cek browser support
  if (!supported) return null;
  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

/**
 * Log custom event ke Firebase Analytics
 * Aman dipanggil di mana saja — auto-skip jika SSR atau tidak didukung
 *
 * @param {string} eventName
 * @param {object} params
 */
export async function logEvent(eventName, params = {}) {
  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;
    firebaseLogEvent(analytics, eventName, params);
  } catch (err) {
    // Jangan crash app jika analytics gagal
    console.warn('[Analytics]', err.message);
  }
}
