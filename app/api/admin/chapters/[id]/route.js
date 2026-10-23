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

// PUT: API Untuk update data chapter (mengganti gambar, slug, dll)
export async function PUT(request, { params }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const body = await request.json();
    const chapterId = params.id;

    const updatedChapter = await Chapter.findByIdAndUpdate(chapterId, body, { returnDocument: 'after' });
    
    if (!updatedChapter) {
      return errorResponse('Chapter tidak ditemukan', 404);
    }

    // Ping manga if updated
    if (updatedChapter.manga_id) {
       await Manga.findByIdAndUpdate(updatedChapter.manga_id, { updatedAt: new Date() });
    }

    return successResponse(updatedChapter);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// DELETE: Hapus 1 Chapter
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const deletedChapter = await Chapter.findByIdAndDelete(params.id);
    if (!deletedChapter) return errorResponse('Chapter tidak ditemukan', 404);

    return successResponse({ deleted: true });
  } catch (err) {
    return errorResponse(err.message);
  }
}
