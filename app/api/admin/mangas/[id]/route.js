import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import { successResponse, errorResponse } from '@/lib/api-helpers';

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

// DAPATKAN 1 Manga + Seluruh Chapter-nya untuk diedit
export async function GET(request, { params }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const manga = await Manga.findById(params.id).lean();
    if (!manga) return errorResponse('Manga tidak ditemukan', 404);

    const chapters = await Chapter.find({ manga_id: manga._id })
      .sort({ chapter_index: -1 })
      .lean();

    return successResponse({ manga, chapters });
  } catch (err) {
    return errorResponse(err.message);
  }
}

// UPDATE Data Manga
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const body = await request.json();
    body.updatedAt = new Date(); // Update timestamp

    const updatedManga = await Manga.findByIdAndUpdate(params.id, body, { returnDocument: 'after' });
    if (!updatedManga) return errorResponse('Manga tidak ditemukan', 404);

    return successResponse(updatedManga);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// DELETE 1 Manga + Seluruh Chapter-nya
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const mangaId = params.id;
    
    // Hapus manganya
    const deletedManga = await Manga.findByIdAndDelete(mangaId);
    if (!deletedManga) return errorResponse('Manga tidak ditemukan', 404);

    // Hapus seluruh chapter-nya
    const deletedChapters = await Chapter.deleteMany({ manga_id: mangaId });

    return successResponse({ 
      deletedManga: true, 
      deletedChaptersCount: deletedChapters.deletedCount 
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
