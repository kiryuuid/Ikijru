import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// GET: Get user history
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const user = await User.findOne({ googleId }).select('history').lean();
    if (!user) return errorResponse('User not found', 404);
    const sorted = (user.history || []).sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));
    return successResponse(sorted);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// POST: Add or update history
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const { type, slug, title, thumb, lastChapterTitle, lastChapterSlug } = await request.json();
    if (!slug) return errorResponse('slug is required', 400);

    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    const existingIndex = user.history.findIndex(item => item.slug === slug);
    if (existingIndex >= 0) {
      user.history[existingIndex].lastChapterTitle = lastChapterTitle;
      user.history[existingIndex].lastChapterSlug = lastChapterSlug;
      user.history[existingIndex].lastRead = Date.now();
      if (title) user.history[existingIndex].title = title;
      if (thumb) user.history[existingIndex].thumb = thumb;
    } else {
      user.history.push({ type, slug, title, thumb, lastChapterTitle, lastChapterSlug, lastRead: Date.now() });
    }

    // Limit riwayat maksimum 100 komik untuk efisiensi performa DB
    if (user.history.length > 50) {
      user.history.sort((a, b) => b.lastRead - a.lastRead);
      user.history = user.history.slice(0, 50);
    }

    await user.save();
    return successResponse(user.history);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// DELETE: Clear all history (optional filter by type)
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    if (type) {
      user.history = user.history.filter(item => item.type !== type);
    } else {
      user.history = [];
    }

    await user.save();
    return successResponse({ message: 'Riwayat bacaan berhasil dibersihkan' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
