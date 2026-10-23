import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// POST: Check and increment download count
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    if (!user.isAdmin && user.isPremium && user.premiumUntil) {
      if (new Date() > user.premiumUntil) {
        user.isPremium = false;
        user.premiumUntil = null;
      }
    }

    if (user.isPremium || user.isAdmin) {
      await user.save();
      return successResponse({ allowed: true, isPremium: true, used: 0, limit: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    const MAX_LIMIT = 6;

    if (!user.dailyDownloads) {
      user.dailyDownloads = { date: '', count: 0 };
    }

    if (user.dailyDownloads.date !== today) {
      user.dailyDownloads.date = today;
      user.dailyDownloads.count = 0;
    }

    if (user.dailyDownloads.count >= MAX_LIMIT) {
      await user.save();
      return successResponse({
        allowed: false,
        used: user.dailyDownloads.count,
        limit: MAX_LIMIT,
        message: `Batas unduhan harian (${MAX_LIMIT}) tercapai. Tunggu besok atau upgrade Premium!`,
      });
    }

    user.dailyDownloads.count += 1;
    user.downloadCount = (user.downloadCount || 0) + 1;
    await user.save();

    return successResponse({
      allowed: true,
      used: user.dailyDownloads.count,
      limit: MAX_LIMIT,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
