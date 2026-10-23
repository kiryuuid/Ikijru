import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse, getPaginationParams, attachChapterCounts } from '@/lib/api-helpers';

export async function GET(request, { params }) {
  try {
    await dbConnect();

    const { type, value } = params;
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    let query = {};

    if (type === 'genre') {
      // Ganti dash dengan spasi, cari exact match di array tags — pakai index tags
      const cleanValue = value.replace(/-/g, ' ');
      query = { tags: cleanValue };
    } else if (type === 'status') {
      // Exact match dengan beberapa variasi kapitalisasi — pakai index metadata.status
      query = { 'metadata.status': { $in: [value, value.charAt(0).toUpperCase() + value.slice(1)] } };
    } else if (type === 'type') {
      // Exact match dengan beberapa variasi kapitalisasi — pakai index metadata.type
      query = { 'metadata.type': { $in: [value, value.charAt(0).toUpperCase() + value.slice(1)] } };
    } else {
      return errorResponse('Invalid filter type. Use: genre, status, or type.', 400);
    }

    const [total, mangasRaw] = await Promise.all([
      Manga.countDocuments(query),
      Manga.find(query)
        .sort({ updatedAt: -1 })
        .select('title slug thumb metadata updatedAt')
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const mangas = await attachChapterCounts(mangasRaw);

    return successResponse(mangas, {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      filter: { type, value },
      perPage: limit,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
