import dbConnect from '@/lib/mongodb';
import Chapter from '@/lib/models/Chapter';
import Manga from '@/lib/models/Manga';
import { successResponse, errorResponse } from '@/lib/api-helpers';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const tokenUid = authHeader.split('Bearer ')[1];
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  
  return ADMIN_UIDS.includes(tokenUid);
}

// POST: API Untuk Menambahkan chapter baru ke dalam manga
export async function POST(request) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const body = await request.json();
    const { manga_id, slug, title, chapter_index, images } = body;

    if (!manga_id || !slug || !title || chapter_index === undefined) {
      return errorResponse('Validasi gagal: Informasi chapter tidak lengkap', 400);
    }

    // Pastikan chapter slug belum ada di manga ini
    const existing = await Chapter.findOne({ manga_id, slug });
    if (existing) {
      return errorResponse('Chapter dengan URL Slug ini sudah ada di Manga ini', 409);
    }

    const newChapter = new Chapter({
      manga_id,
      slug,
      title,
      chapter_index,
      images: Array.isArray(images) ? images : [],
      created_at: new Date()
    });

    await newChapter.save();

    // Auto-update updatedAt pada Manga Induk agar naik ke atas (Trending/Latest)
    await Manga.findByIdAndUpdate(manga_id, { updatedAt: new Date() });

    return successResponse(newChapter);
  } catch (err) {
    return errorResponse(err.message);
  }
}
