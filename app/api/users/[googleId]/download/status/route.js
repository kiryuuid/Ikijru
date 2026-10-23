import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// GET: Get download status
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    if (user.isPremium || user.isAdmin) {
      return successResponse({ unlimited: true, used: 0, limit: 0 });
    }

    const today = new Date().toISOString().split('T')[0];
    const MAX_LIMIT = 6;

    const usedToday = user.dailyDownloads?.date === today ? user.dailyDownloads?.count || 0 : 0;

    return successResponse({
      unlimited: false,
      used: usedToday,
      limit: MAX_LIMIT,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
