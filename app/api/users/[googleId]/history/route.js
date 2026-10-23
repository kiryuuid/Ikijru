import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// GET: Get user history (sinkronisasi type, title, thumb dengan database Manga)
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    const historyItems = user.history || [];
    const slugs = historyItems.map(h => h.slug).filter(Boolean);

    let needsSave = false;
    if (slugs.length > 0) {
      const mangas = await Manga.find({ slug: { $in: slugs } })
        .select('slug metadata.type title thumb')
        .lean();

      const mangaMap = new Map();
      mangas.forEach(m => mangaMap.set(m.slug, m));

      historyItems.forEach(item => {
        const m = mangaMap.get(item.slug);
        if (m) {
          const correctType = m.metadata?.type;
          if (correctType && item.type?.toLowerCase() !== correctType.toLowerCase()) {
            item.type = correctType;
            needsSave = true;
          }
          if (m.title && item.title !== m.title) {
            item.title = m.title;
            needsSave = true;
          }
          if (m.thumb && item.thumb !== m.thumb) {
            item.thumb = m.thumb;
            needsSave = true;
          }
        }
      });

      if (needsSave) {
        user.markModified('history');
        await user.save().catch(err => console.warn('[History Sync] save error:', err.message));
      }
    }

    const sorted = [...historyItems].sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead));
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

    // Ambil type & metadata asli dari database Manga agar selalu tersinkron
    let finalType = type;
    let finalTitle = title;
    let finalThumb = thumb;

    const mangaDoc = await Manga.findOne({ slug }).select('metadata.type title thumb').lean();
    if (mangaDoc) {
      if (mangaDoc.metadata?.type) finalType = mangaDoc.metadata.type;
      if (mangaDoc.title) finalTitle = mangaDoc.title;
      if (mangaDoc.thumb) finalThumb = mangaDoc.thumb;
    }

    const existingIndex = user.history.findIndex(item => item.slug === slug);
    if (existingIndex >= 0) {
      user.history[existingIndex].lastChapterTitle = lastChapterTitle;
      user.history[existingIndex].lastChapterSlug = lastChapterSlug;
      user.history[existingIndex].lastRead = Date.now();
      if (finalType) user.history[existingIndex].type = finalType;
      if (finalTitle) user.history[existingIndex].title = finalTitle;
      if (finalThumb) user.history[existingIndex].thumb = finalThumb;
    } else {
      user.history.push({
        type: finalType || 'manga',
        slug,
        title: finalTitle,
        thumb: finalThumb,
        lastChapterTitle,
        lastChapterSlug,
        lastRead: Date.now(),
      });
    }

    // Limit riwayat maksimum 50 komik untuk efisiensi performa DB
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
