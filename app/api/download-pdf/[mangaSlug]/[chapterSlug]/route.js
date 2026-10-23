import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios';
import sharp from 'sharp';

export const maxDuration = 60; // 60s for Vercel Hobby/Pro limit


export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { mangaSlug, chapterSlug } = params;
    const { searchParams } = new URL(request.url);
    const googleId = searchParams.get('uid');

    // 1. Validasi User & Limit Kuota
    if (googleId) {
      const user = await User.findOne({ googleId });
      if (!user) return errorResponse('User tidak ditemukan', 404);

      const today = new Date().toISOString().split('T')[0];
      const isPremium = user.isPremium && user.premiumUntil && user.premiumUntil > new Date();

      if (!isPremium) {
        // Logika Limit 6x per hari
        if (user.dailyDownloads?.date !== today) {
          user.dailyDownloads = { date: today, count: 0 };
        }

        if (user.dailyDownloads.count >= 6) {
          return new Response(JSON.stringify({
            status: 'error',
            message: 'Limit harian habis (6/6). Upgrade ke Premium untuk download tanpa batas!'
          }), { status: 429, headers: { 'Content-Type': 'application/json' } });
        }

        user.dailyDownloads.count += 1;
        user.downloadCount = (user.downloadCount || 0) + 1;
        user.lastDownloadDate = new Date();
        await user.save();
      }
    } else {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Silakan login terlebih dahulu untuk mengakses fitur Download.'
      }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Ambil data manga & chapter
    const manga = await Manga.findOne({ slug: mangaSlug }).lean();
    if (!manga) return errorResponse('Manga tidak ditemukan', 404);

    const chapter = await Chapter.findOne({
      manga_id: manga._id,
      slug: chapterSlug,
    }).lean();

    if (!chapter || !chapter.images || chapter.images.length === 0) {
      return errorResponse('Chapter atau gambar tidak ditemukan', 404);
    }

    // 3. Buat PDF menggunakan pdf-lib
    const pdfDoc = await PDFDocument.create();
    
    // 4. Proses Gambar dengan Sharp (untuk handle WebP)
    for (const imageUrl of chapter.images) {
      try {
        let finalUrl = imageUrl;
        if (finalUrl.startsWith('https://cdn.manhwature.com/')) {
          finalUrl = finalUrl.replace('https://cdn.manhwature.com/', 'https://');
        }

        const response = await axios.get(finalUrl, { 
          responseType: 'arraybuffer',
          headers: {
            'Referer': 'https://doujindesu.tv/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const imgBuffer = Buffer.from(response.data);
        
        // Konversi ke JPEG menggunakan sharp untuk menjamin kompatibilitas dan handle WebP
        const jpegBuffer = await sharp(imgBuffer)
          .jpeg({ quality: 80 })
          .toBuffer();
          
        const image = await pdfDoc.embedJpg(jpegBuffer);

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      } catch (imgErr) {
        console.error('Gagal memproses gambar:', imageUrl, imgErr.message);
      }
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${mangaSlug}-${chapterSlug}.pdf"`,
      },
    });

  } catch (err) {
    console.error('PDF Generation Error:', err);
    return errorResponse(err.message);
  }
}


