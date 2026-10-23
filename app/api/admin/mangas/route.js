import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse, getPaginationParams } from '@/lib/api-helpers';
import { cacheDelPrefix } from '@/lib/cache';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const tokenUid = authHeader.split('Bearer ')[1];
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  
  if (!tokenUid || !ADMIN_UIDS.includes(tokenUid)) {
    return false;
  }
  return true;
}

export async function GET(request) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);
    
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const { page, limit, skip } = getPaginationParams(searchParams);

    const matchQuery = {};
    if (q) {
      // Gunakan $text index untuk pencarian judul (lebih cepat dari $regex)
      matchQuery.$text = { $search: q };
    }

    const [mangas, total] = await Promise.all([
      Manga.find(matchQuery)
        .select('title alternativeTitle slug thumb views metadata updatedAt tags')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Manga.countDocuments(matchQuery),
    ]);

    return successResponse(mangas, {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const body = await request.json();
    
    // Validasi basic
    if (!body.title || !body.slug) {
      return errorResponse('Judul dan Slug wajib diisi', 400);
    }

    // Cek duplikasi
    const existing = await Manga.findOne({ slug: body.slug });
    if (existing) {
      return errorResponse('Manga dengan slug ini sudah ada', 409);
    }

    const newManga = new Manga({
      title: body.title,
      alternativeTitle: body.alternativeTitle || '',
      slug: body.slug,
      thumb: body.thumb || '',
      synopsis: body.synopsis || '',
      views: Number(body.views) || 0,
      metadata: {
        status: body.metadata?.status || 'Ongoing',
        type: body.metadata?.type || 'Manga',
        series: body.metadata?.series || '',
        author: body.metadata?.author || '',
        rating: body.metadata?.rating || '0',
        created: body.metadata?.created || '',
      },
      tags: body.tags || [],
    });

    await newManga.save();

    // Invalidasi cache home dan genres agar data terbaru langsung muncul
    cacheDelPrefix('home:');
    cacheDelPrefix('genres:');

    return successResponse(newManga);
  } catch (err) {
    return errorResponse(err.message);
  }
}
