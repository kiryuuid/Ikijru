import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { slug, chapterSlug } = params;

    const manga = await Manga.findOne({ slug })
      .select('_id title slug thumb')
      .lean();

    if (!manga) return errorResponse('Manga not found', 404);

    const chapter = await Chapter.findOne({
      manga_id: manga._id,
      slug: chapterSlug,
    }).lean();

    if (!chapter) return errorResponse('Chapter not found', 404);

    const [nextChap, prevChap] = await Promise.all([
      Chapter.findOne({
        manga_id: manga._id,
        chapter_index: { $gt: chapter.chapter_index },
      })
        .sort({ chapter_index: 1 })
        .select('slug title')
        .collation({ locale: 'en_US', numericOrdering: true })
        .lean(),
      Chapter.findOne({
        manga_id: manga._id,
        chapter_index: { $lt: chapter.chapter_index },
      })
        .sort({ chapter_index: -1 })
        .select('slug title')
        .collation({ locale: 'en_US', numericOrdering: true })
        .lean(),
    ]);

    return successResponse({
      chapter,
      manga,
      navigation: {
        next: nextChap ? nextChap.slug : null,
        prev: prevChap ? prevChap.slug : null,
      },
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
