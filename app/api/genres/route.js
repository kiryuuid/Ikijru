import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { cacheOrFetch } from '@/lib/cache';

const GENRES_TTL = 10 * 60 * 1000; // 10 menit

export async function GET() {
  try {
    await dbConnect();

    const formattedGenres = await cacheOrFetch('genres:all', async () => {
      const genres = await Manga.aggregate([
        { $unwind: '$tags' },
        { $match: { tags: { $ne: '' } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);
      return genres.map(g => ({ name: g._id, count: g.count }));
    }, GENRES_TTL);

    return successResponse(formattedGenres);
  } catch (err) {
    return errorResponse(err.message);
  }
}

