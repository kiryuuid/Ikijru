import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse, getPaginationParams, attachChapterCounts } from '@/lib/api-helpers';
import { cacheOrFetch } from '@/lib/cache';

const CACHE_TTL = 5 * 60 * 1000; // 5 menit

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Recents selalu fresh (berubah setiap ada chapter baru)
    const [recentsRaw, cachedData] = await Promise.all([
      Manga.find()
        .select('title slug thumb metadata createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      // Semua data statis di-cache 5 menit
      cacheOrFetch('home:static', async () => {
        const [totalManga, trendingRaw, manhwasRaw, mangasRaw, doujinshisRaw] = await Promise.all([
          Manga.countDocuments(),
          Manga.find()
            .select('title slug thumb views metadata')
            .sort({ views: -1 })
            .limit(10)
            .lean(),
          // Gunakan $in dengan exact values agar pakai index metadata.type
          Manga.find({ 'metadata.type': { $in: ['Manhwa', 'manhwa'] } })
            .select('title slug thumb metadata updatedAt')
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean(),
          Manga.find({ 'metadata.type': { $in: ['Manga', 'manga'] } })
            .select('title slug thumb metadata updatedAt')
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean(),
          Manga.find({ 'metadata.type': { $in: ['Doujinshi', 'doujinshi'] } })
            .select('title slug thumb metadata updatedAt')
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean(),
        ]);

        // Attach chapter counts untuk data statis (di-cache juga)
        const [trending, manhwas, mangas, doujinshis] = await Promise.all([
          attachChapterCounts(trendingRaw),
          attachChapterCounts(manhwasRaw),
          attachChapterCounts(mangasRaw),
          attachChapterCounts(doujinshisRaw),
        ]);

        return { totalManga, trending, manhwas, mangas, doujinshis };
      }, CACHE_TTL),
    ]);

    // Attach chapter counts hanya untuk recents (selalu fresh)
    const recents = await attachChapterCounts(recentsRaw);

    const { totalManga, trending, manhwas, mangas, doujinshis } = cachedData;

    return successResponse(
      { recents, trending, manhwas, mangas, doujinshis },
      {
        currentPage: page,
        totalPages: Math.ceil(totalManga / limit),
        totalItems: totalManga,
        perPage: limit,
      }
    );
  } catch (err) {
    return errorResponse(err.message);
  }
}

