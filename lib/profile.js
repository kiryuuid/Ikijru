/**
 * lib/profile.js
 *
 * Profil publik user — semua data dari BACKEND, bukan Firebase.
 * Backend endpoints:
 *   GET   /users/:googleId/public-profile  → profil + library + stats
 *   PATCH /users/:googleId/bio             → update bio
 *   POST  /users/sync                      → sinkronisasi data user (dipanggil saat login)
 */

function proxyBase() {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const isDev = process.env.NODE_ENV === 'development';
  const siteUrl = isDev ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
  return `${siteUrl.replace(/\/+$/, '')}/api`;
}

const PUBLIC_PROFILE_TTL_MS = 15000;
const publicProfileCache = new Map();
const publicProfileInFlight = new Map();

async function apiFetch(path, options = {}) {
  const res = await fetch(`${proxyBase()}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

/**
 * Sync data user ke backend setiap kali login.
 * Menggantikan updatePublicProfile (Firebase).
 * Dipanggil dari AuthContext.
 */
export async function updatePublicProfile(googleId, userData = {}) {
  if (!googleId) return;
  try {
    await apiFetch('/users/sync', {
      method: 'POST',
      body: JSON.stringify({
        googleId,
        email:       userData.email       || '',
        displayName: userData.displayName || '',
        photoURL:    userData.photoURL    || '',
      }),
    });
  } catch (err) {
    // Jangan crash app jika sync gagal
    console.warn('[Profile] sync error:', err.message);
  }
}

/**
 * Ambil profil publik user.
 * Return: { googleId, displayName, photoURL, bio, library, stats }
 */
export async function getPublicProfile(userId) {
  if (!userId) return null;

  const cached = publicProfileCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < PUBLIC_PROFILE_TTL_MS) {
    return cached.data;
  }

  const inFlight = publicProfileInFlight.get(userId);
  if (inFlight) return inFlight;

  const request = (async () => {
    try {
      const data = await apiFetch(`/users/${userId}/public-profile`);
      publicProfileCache.set(userId, { data, fetchedAt: Date.now() });
      return data;
    } catch (err) {
      console.error('[Profile] getPublicProfile error:', err.message);
      return null;
    } finally {
      publicProfileInFlight.delete(userId);
    }
  })();

  publicProfileInFlight.set(userId, request);

  try {
    return await request;
  } catch {
    return null;
  }
}

/**
 * Update bio user (maks 100 karakter).
 */
export async function updateBio(userId, bio) {
  if (!userId) return;
  await apiFetch(`/users/${userId}/bio`, {
    method: 'PATCH',
    body: JSON.stringify({ bio }),
  });
}

// Update display name dan/atau foto profil (FormData)
export async function updateProfileInfo(userId, formData, token) {
  if (!userId || !formData || !token) return null;

  const res = await fetch(`${proxyBase()}/users/${userId}/profile`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Gagal update profil (HTTP ${res.status})`);
  }
  return json.data;
}

/**
 * @deprecated Tidak lagi diperlukan — backend auto-hitung stats dari library.
 * Dibiarkan ada agar tidak error jika ada import lain.
 */
export async function updateProfileStats() {}
