import { successResponse, errorResponse } from '@/lib/api-helpers';
import { uploadToR2 } from '@/lib/r2';
import sharp from 'sharp';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;

  const tokenUid = authHeader.split('Bearer ')[1];
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (!tokenUid || !ADMIN_UIDS.includes(tokenUid)) {
    return false;
  }
  return true;
}

export async function POST(request) {
  try {
    if (!(await isAdmin(request))) {
      return errorResponse('Forbidden: Akses admin ditolak', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') || formData.get('cover');
    const rawSlug = formData.get('slug') || '';

    if (!file || typeof file.arrayBuffer !== 'function') {
      return errorResponse('File gambar tidak ditemukan', 400);
    }

    const mime = (file.type || '').toLowerCase();
    if (!mime.startsWith('image/')) {
      return errorResponse('File yang diupload harus berupa gambar', 400);
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      return errorResponse('Ukuran gambar maksimal 15MB', 400);
    }

    const cleanSlug = String(rawSlug)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 50) || 'cover';

    const originalBuffer = Buffer.from(await file.arrayBuffer());

    let outputBuffer = originalBuffer;
    let ext = 'webp';
    let contentType = 'image/webp';

    const isGif = mime === 'image/gif';

    if (isGif) {
      ext = 'gif';
      contentType = 'image/gif';
    } else {
      // Optimasi cover: rotate sesuai EXIF, resize max-width 1200px (tanpa perbesar jika lebih kecil), convert ke WebP
      const image = sharp(originalBuffer).rotate();
      const metadata = await image.metadata();

      let pipeline = image;
      if (metadata.width && metadata.width > 1200) {
        pipeline = pipeline.resize(1200, null, { withoutEnlargement: true });
      }

      outputBuffer = await pipeline.webp({ quality: 85 }).toBuffer();
    }

    const key = `covers/${cleanSlug}-${Date.now()}.${ext}`;

    const publicUrl = await uploadToR2({
      buffer: outputBuffer,
      key,
      contentType,
    });

    return successResponse({
      url: publicUrl,
      key,
      size: outputBuffer.byteLength,
    }, 200);
  } catch (err) {
    console.error('[Admin Upload Cover Error]:', err);
    return errorResponse(`Gagal upload cover ke R2: ${err.message}`, 500);
  }
}
