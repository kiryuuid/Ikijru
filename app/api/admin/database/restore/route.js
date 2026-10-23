import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import zlib from 'zlib';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const tokenUid = authHeader.split('Bearer ')[1];
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  
  return ADMIN_UIDS.includes(tokenUid);
}

export async function POST(request) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    // Menerima FormData karena kita mengunggah File biner (.gz) atau teks (.json)
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse('File backup tidak ditemukan.', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let fileContentStr = '';

    // Deteksi ekstensi file
    if (fileName.endsWith('.gz')) {
      // Decompress gzip
      try {
        const decompressed = zlib.gunzipSync(buffer);
        fileContentStr = decompressed.toString('utf-8');
      } catch (e) {
        return errorResponse('Gagal mengekstrak file .gz', 400);
      }
    } else if (fileName.endsWith('.json')) {
      // JSON Biasa
      fileContentStr = buffer.toString('utf-8');
    } else {
      return errorResponse('Format file tidak didukung. Gunakan .json atau .json.gz', 400);
    }

    // Parsing JSON
    let body;
    try {
      body = JSON.parse(fileContentStr);
    } catch (e) {
      return errorResponse('File JSON corrupted / Format tidak valid.', 400);
    }

    if (!body || !body.data) {
      return errorResponse('Struktur data backup tidak valid (harus mengandung { data: ... }).', 400);
    }

    const { mangas, chapters, users } = body.data;

    let restoreStats = { mangas: 0, chapters: 0, users: 0 };

    // Fungsi helper untuk memecah insert agar koneksi MongoDB tidak terputus (ECONNRESET)
    async function insertInChunks(Model, dataArr, chunkSize = 50) {
      for (let i = 0; i < dataArr.length; i += chunkSize) {
        const chunk = dataArr.slice(i, i + chunkSize);
        await Model.insertMany(chunk, { ordered: false });
      }
    }

    // Restore Mangas
    if (mangas && Array.isArray(mangas)) {
      await Manga.deleteMany({}); // Delete old data
      await insertInChunks(Manga, mangas);
      restoreStats.mangas = mangas.length;
    }

    // Restore Chapters
    if (chapters && Array.isArray(chapters)) {
      await Chapter.deleteMany({});
      await insertInChunks(Chapter, chapters);
      restoreStats.chapters = chapters.length;
    }

    // Restore Users
    if (users && Array.isArray(users)) {
      await User.deleteMany({});
      await insertInChunks(User, users);
      restoreStats.users = users.length;
    }

    return successResponse(restoreStats, 'Database berhasil direstore.');
  } catch (error) {
    console.error('Restore error:', error);
    return errorResponse(error.message || 'Gagal merestore database', 500);
  }
}
