import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse, getPaginationParams, attachChapterCounts } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('q');
    if (!keyword) return errorResponse('Query parameter "q" required', 400);

    const { page, limit, skip } = getPaginationParams(searchParams);

    // $text search memanfaatkan text index — jauh lebih cepat dari $regex
    const query = { $text: { $search: keyword } };

    const [total, mangasRaw] = await Promise.all([
      Manga.countDocuments(query),
      Manga.find(query)
        .select('title slug thumb metadata')
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const mangas = await attachChapterCounts(mangasRaw);

    return successResponse(mangas, {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      perPage: limit,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

