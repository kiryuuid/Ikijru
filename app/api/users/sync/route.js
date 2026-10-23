import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    await dbConnect();

    const { googleId, email, displayName, photoURL } = await request.json();
    if (!googleId) return errorResponse('googleId is required', 400);

    const ADMIN_GOOGLE_IDS = (process.env.NEXT_PUBLIC_ADMIN_GOOGLE_IDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const isUserAdmin = ADMIN_GOOGLE_IDS.includes(googleId) || ADMIN_GOOGLE_IDS.includes(email);

    // 1. Cari by googleId dulu
    let user = await User.findOne({ googleId });

    // 2. Jika tidak ketemu by googleId, cari by email (migrasi Firebase UID → Google OAuth ID)
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        // Hapus user lama dengan googleId yang berbeda (duplikat) jika ada
        await User.deleteOne({ googleId, _id: { $ne: user._id } });
        // Update googleId ke yang baru (Google OAuth ID)
        user.googleId = googleId;
        console.log(`[sync] Migrated user ${email}: ${user.googleId} → ${googleId}`);
      }
    }

    const today = new Date().toISOString().split('T')[0];

    if (!user) {
      user = new User({
        googleId,
        email,
        displayName,
        photoURL: photoURL || '',
        isAdmin: isUserAdmin,
        isPremium: isUserAdmin,
        premiumAt: isUserAdmin ? new Date() : null,
        dailyDownloads: { date: today, count: 0 },
        lastLoginAt: new Date(),
      });
    } else {
      user.isAdmin = isUserAdmin;

      // Jangan timpa nama/foto kustom yang sudah diset user dari halaman profil
      if (displayName && !user.displayName) user.displayName = displayName;
      if (photoURL && !user.photoURL) user.photoURL = photoURL;
      if (!user.createdAt && user._id?.getTimestamp) {
        user.createdAt = user._id.getTimestamp();
      }
      user.lastLoginAt = new Date();

      if (isUserAdmin) {
        if (!user.isPremium) user.premiumAt = new Date();
        user.isPremium = true;
      } else if (user.isPremium && user.premiumUntil) {
        if (new Date() > user.premiumUntil) {
          user.isPremium = false;
          user.premiumUntil = null;
          user.premiumAt = null;
        }
      }

      if (!user.dailyDownloads) {
        user.dailyDownloads = { date: today, count: 0 };
      } else if (user.dailyDownloads.date !== today) {
        user.dailyDownloads.date = today;
        user.dailyDownloads.count = 0;
      }
    }

    // ─── Deduplikasi history: simpan entri terbaru per slug ──────────
    if (user.history && user.history.length > 1) {
      const seen = new Map();
      // Iterasi dari terbaru → terlama, simpan hanya yang pertama per slug
      for (const entry of [...user.history].sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))) {
        if (!seen.has(entry.slug)) seen.set(entry.slug, entry);
      }
      user.history = [...seen.values()];
    }
    // ─────────────────────────────────────────────────────────────────

    await user.save();
    return successResponse(user);
  } catch (err) {
    return errorResponse(err.message);
  }
}
