import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import { successResponse, errorResponse, attachChapterCounts } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { slug } = params;

    // Ambil manga tanpa write dulu — findOne lebih cepat dari findOneAndUpdate
    const manga = await Manga.findOne({ slug }).lean();
    if (!manga) return errorResponse('Manga not found', 404);

    // Increment views fire-and-forget (tidak await) — tidak block response
    Manga.updateOne({ _id: manga._id }, { $inc: { views: 1 } }, { timestamps: false })
      .exec()
      .catch(() => {}); // Abaikan error view tracking

    const [chapters, rawRecommendations] = await Promise.all([
      Chapter.find({ manga_id: manga._id })
        .select('title slug chapter_index createdAt')
        .sort({ chapter_index: -1 })
        .collation({ locale: 'en_US', numericOrdering: true })
        .lean(),

      // $sample masih dipakai tapi hanya untuk 6 dokumen — acceptable
      Manga.aggregate([
        { $match: { _id: { $ne: manga._id } } },
        { $sample: { size: 6 } },
        { $project: { title: 1, slug: 1, thumb: 1, metadata: 1, views: 1 } },
      ]),
    ]);

    const recommendations = await attachChapterCounts(rawRecommendations);

    manga.chapter_count = chapters.length;

    return successResponse({
      info: manga,
      chapters,
      recommendations,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
