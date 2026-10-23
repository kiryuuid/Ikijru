import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse, getPaginationParams, attachChapterCounts } from '@/lib/api-helpers';

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const genre = searchParams.get('genre');
    const order = searchParams.get('order');

    let query = {};

    if (q) {
      // $text index jauh lebih cepat dari $regex untuk search judul
      query.$text = { $search: q };
    }
    if (status && status !== 'all') {
      // Exact match lowercase — pakai index metadata.status
      query['metadata.status'] = { $in: [status, status.charAt(0).toUpperCase() + status.slice(1)] };
    }
    if (type && type !== 'all') {
      // Exact match dengan beberapa variasi kapitalisasi — pakai index metadata.type
      query['metadata.type'] = { $in: [type, type.charAt(0).toUpperCase() + type.slice(1)] };
    }
    if (genre && genre !== 'all') {
      // Ganti dash dengan spasi, cari exact genre — pakai index tags
      const cleanGenre = genre.replace(/-/g, ' ');
      query.tags = cleanGenre;
    }

    let sortOption = { updatedAt: -1 };
    switch (order) {
      case 'oldest': sortOption = { updatedAt: 1 }; break;
      case 'popular': sortOption = { views: -1 }; break;
      case 'az': sortOption = { title: 1 }; break;
      case 'za': sortOption = { title: -1 }; break;
      default: sortOption = { updatedAt: -1 };
    }

    const [total, mangasRaw] = await Promise.all([
      Manga.countDocuments(query),
      Manga.find(query)
        .select('title slug thumb metadata views rating status type tags updatedAt')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // attachChapterCounts (1 aggregate) — lebih ringan dari attachChapterInfo (2 aggregates)
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

