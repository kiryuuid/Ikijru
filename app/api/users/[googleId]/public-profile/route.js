import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// GET: Get public profile data 
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;

    const user = await User.findOne({ googleId })
      .select('googleId displayName photoURL bio library isPremium isAdmin premiumUntil dailyDownloads createdAt hasUsedTrial pendingPremiumOrders')
      .lean();

    if (!user) return errorResponse('User not found', 404);

    const library = user.library || [];
    const stats = library.reduce((acc, item) => {
      const status = item.mangaData?.readingStatus || 'reading';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const today = new Date().toISOString().split('T')[0];
    const MAX_DOWNLOAD_LIMIT = 6;
    const usedToday = user.dailyDownloads?.date === today ? user.dailyDownloads?.count || 0 : 0;

    return successResponse({
      googleId: user.googleId,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      bio: user.bio || '',
      isPremium: user.isPremium || false,
      isAdmin: user.isAdmin || false,
      premiumUntil: user.premiumUntil || null,
      createdAt: user.createdAt || null,
      downloadUsed: usedToday,
      downloadLimit: MAX_DOWNLOAD_LIMIT,
      hasUsedTrial: user.hasUsedTrial || false,
      pendingPremiumOrders: (user.pendingPremiumOrders || []).map(o => ({
        orderId: o.orderId,
        days: o.days,
        amount: o.amount,
        createdAt: o.createdAt,
      })),
      library,
      stats: {
        reading: stats.reading || 0,
        to_read: stats.to_read || 0,
        finished: stats.finished || 0,
        dropped: stats.dropped || 0,
        total: library.length,
      },
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
