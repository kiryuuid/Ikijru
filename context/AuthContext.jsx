'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { trackLogin, trackSignUp } from '@/lib/analytics';

// ─── DAFTAR GOOGLE ID ADMIN ──────────────────────────────────
// Sumber kebenaran tunggal untuk pengecekan admin (dipakai di seluruh app)
export const getAdminGoogleIds = () => {
  const idsStr = process.env.NEXT_PUBLIC_ADMIN_GOOGLE_IDS || '';
  return idsStr.split(',').map(id => id.trim()).filter(Boolean);
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Jika login dengan email (bukan Google) dan belum verifikasi, skip sync & set null
        const isEmailProvider = firebaseUser.providerData?.some(p => p.providerId === 'password');
        if (isEmailProvider && !firebaseUser.emailVerified) {
          setUser(null);
          setLoading(false);
          return;
        }

        // 1. Cek admin berdasarkan GoogleID (fallback: email saja, bukan UID)
        const googleProvider = firebaseUser.providerData?.find(p => p.providerId === 'google.com');
        const consistentId = googleProvider?.uid ?? firebaseUser.uid;
        const candidateIds = [consistentId, firebaseUser.email].filter(Boolean);

        const adminList = getAdminGoogleIds();
        const isAdminByGoogleId = candidateIds.some(id => adminList.includes(id));

        // Set user dengan default isAdmin & isPremium = false dulu
        const baseUser = {
          ...firebaseUser,
          googleId: consistentId, // Tambah googleId untuk API calls
          isAdmin: isAdminByGoogleId,
          isPremium: false,
        };

        try {

          // 3. Sync ke backend & ambil status premium
          const res = await fetch(`/api/users/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: consistentId,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              downloadLimit: 6
            })
          });
          const dbData = await res.json();

          // 4. Gabungkan: admin dari Google ID lokal, premium dari backend
          if (dbData.success && dbData.data) {
            setUser({
              ...baseUser,
              // Sinkronkan nama & foto dari backend (hasil edit profil)
              displayName: dbData.data.displayName || baseUser.displayName,
              photoURL: dbData.data.photoURL || baseUser.photoURL,
              isAdmin: isAdminByGoogleId || !!dbData.data.isAdmin,
              isPremium: !!dbData.data.isPremium,
            });
          } else {
            setUser(baseUser);
          }
        } catch (error) {
          console.error("Gagal mengambil status premium:", error);
          setUser(baseUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Login Google
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    trackLogin('google');
    return result;
  };

  // Login Email — blokir jika belum verifikasi email
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Reload untuk mendapat status emailVerified terbaru dari Firebase
    await reload(result.user);
    if (!result.user.emailVerified) {
      // Logout otomatis agar sesi tidak aktif
      await signOut(auth);
      const err = new Error('Email belum diverifikasi.');
      err.code = 'auth/email-not-verified';
      throw err;
    }
    trackLogin('email');
    return result;
  };

  // Register Email — kirim email verifikasi, lalu logout agar tidak otomatis masuk
  const registerWithEmail = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await sendEmailVerification(cred.user);
    // Logout agar user tidak langsung masuk sebelum verifikasi
    await signOut(auth);
    trackSignUp('email');
    return cred;
  };

  // Kirim ulang email verifikasi (untuk user yang belum verifikasi)
  const resendVerificationEmail = async (email, password) => {
    // Login sementara untuk kirim ulang email verifikasi
    const result = await signInWithEmailAndPassword(auth, email, password);
    await reload(result.user);
    if (!result.user.emailVerified) {
      await sendEmailVerification(result.user);
    }
    // Selalu logout setelah selesai — mencegah user masuk tanpa verifikasi
    await signOut(auth);
    return result;
  };

  // Reset password
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // Logout
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, resendVerificationEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// [FIX] Fallback yang aman: Jika hook dipanggil di luar AuthProvider, 
// jangan lempar error yang membuat layar mati, cukup kembalikan user: null
export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx || { user: null, loading: false };
}