import Chapter from '@/lib/models/Chapter';

// Standard Response Helpers
export function successResponse(data, pagination = null) {
  return Response.json({ success: true, data, pagination });
}

export function errorResponse(message, code = 500) {
  console.error(`[API Error] ${message}`);
  return Response.json({ success: false, message }, { status: code });
}

// Pagination Helper
export function getPaginationParams(searchParams, defaultLimit = 24) {
  const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit')) || defaultLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// Attach chapter counts to manga list (prevents N+1 query problem)
export async function attachChapterCounts(mangas) {
  if (!mangas || mangas.length === 0) return [];

  const mangaIds = mangas.map(m => m._id);

  const counts = await Chapter.aggregate([
    { $match: { manga_id: { $in: mangaIds } } },
    { $group: { _id: '$manga_id', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  counts.forEach(c => {
    countMap[c._id.toString()] = c.count;
  });

  return mangas.map(m => ({
    ...m,
    chapter_count: countMap[m._id.toString()] || 0,
  }));
}

// Attach chapter count + last chapter info
export async function attachChapterInfo(mangas) {
  if (!mangas || mangas.length === 0) return [];

  const mangaIds = mangas.map(m => m._id);

  const [counts, latestChapters] = await Promise.all([
    Chapter.aggregate([
      { $match: { manga_id: { $in: mangaIds } } },
      { $group: { _id: '$manga_id', count: { $sum: 1 } } },
    ]),
    Chapter.aggregate([
      { $match: { manga_id: { $in: mangaIds } } },
      { $sort: { manga_id: 1, chapter_index: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$manga_id',
          chapter: {
            $first: {
              title: '$title',
              slug: '$slug',
              chapter_index: '$chapter_index',
              createdAt: '$createdAt',
            },
          },
        },
      },
    ]),
  ]);

  const countMap = {};
  counts.forEach(c => {
    countMap[c._id.toString()] = c.count;
  });

  const chapterMap = {};
  latestChapters.forEach(c => {
    chapterMap[c._id.toString()] = c.chapter || null;
  });

  return mangas.map(m => ({
    ...m,
    chapter_count: countMap[m._id.toString()] || 0,
    last_chapter: chapterMap[m._id.toString()] || null,
  }));
}
