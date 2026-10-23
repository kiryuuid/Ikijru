import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// Helper to check if requester is admin
async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const tokenGoogleId = authHeader.split('Bearer ')[1];
  const ADMIN_GOOGLE_IDS = (process.env.NEXT_PUBLIC_ADMIN_GOOGLE_IDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  if (!tokenGoogleId || !ADMIN_GOOGLE_IDS.includes(tokenGoogleId)) {
    return false;
  }
  return true;
}

export async function GET(request) {
  try {
    await dbConnect();

    // Verify admin
    if (!(await isAdmin(request))) {
      return errorResponse('Akses Ditolak. Anda tidak disahkan sebagai Admin.', 403);
    }

    // Run aggregate queries concurrently for speed
    const [totalMangas, totalChapters, totalUsers, premiumUsers, recentTrials] = await Promise.all([
      Manga.countDocuments(),
      Chapter.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.find({ hasUsedTrial: true })
        .select('displayName email premiumAt photoURL')
        .sort({ premiumAt: -1 })
        .limit(10)
        .lean()
    ]);

    return successResponse({
      totalMangas,
      totalChapters,
      totalUsers,
      premiumUsers,
      recentTrials
    });

  } catch (error) {
    console.error('Admin Stats Error:', error);
    return errorResponse('Gagal mengambil statistik admin: ' + error.message, 500);
  }
}
