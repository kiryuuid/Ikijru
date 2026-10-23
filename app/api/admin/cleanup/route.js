import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

const INACTIVE_DAYS = 7;
const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam
const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;       // 1 hari

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const tokenGoogleId = authHeader.split('Bearer ')[1];
  const ADMIN_GOOGLE_IDS = (process.env.NEXT_PUBLIC_ADMIN_GOOGLE_IDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return ADMIN_GOOGLE_IDS.includes(tokenGoogleId);
}

/**
 * POST /api/admin/cleanup
 * Jalankan cleanup rutin database. Dipanggil manual oleh admin
 * (atau via Vercel Cron: https://vercel.com/docs/cron-jobs).
 *
 * Operasi yang dilakukan:
 * 1. Hapus user non-admin yang tidak login > 7 hari
 * 2. Hapus pendingPremiumOrders yang expired > 24 jam
 * 3. Hapus history item yang sudah > 1 hari
 */
export async function POST(request) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const now = Date.now();
    const inactiveCutoff = new Date(now - INACTIVE_DAYS * 24 * 60 * 60 * 1000);
    const orderExpiredCutoff = new Date(now - PENDING_ORDER_TTL_MS);
    const historyExpiredCutoff = new Date(now - HISTORY_TTL_MS);

    const [deletedUsers, cleanedOrders, cleanedHistory] = await Promise.all([
      // 1. Hapus user non-admin yang tidak login > 7 hari
      User.deleteMany({
        isAdmin: { $ne: true },
        $or: [
          { lastLoginAt: { $lt: inactiveCutoff } },
          { lastLoginAt: { $exists: false } },
        ],
      }),

      // 2. Hapus expired pending orders dari semua user
      User.updateMany(
        { 'pendingPremiumOrders.0': { $exists: true } },
        { $pull: { pendingPremiumOrders: { createdAt: { $lt: orderExpiredCutoff } } } }
      ),

      // 3. Hapus history item yang sudah > 1 hari
      User.updateMany(
        { 'history.0': { $exists: true } },
        { $pull: { history: { lastRead: { $lt: historyExpiredCutoff } } } }
      ),
    ]);

    return successResponse({
      message: 'Cleanup selesai.',
      stats: {
        deletedUsers: deletedUsers.deletedCount,
        usersWithCleanedOrders: cleanedOrders.modifiedCount,
        usersWithCleanedHistory: cleanedHistory.modifiedCount,
      },
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
