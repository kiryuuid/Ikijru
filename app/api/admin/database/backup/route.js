import dbConnect from '@/lib/mongodb';
import Manga from '@/lib/models/Manga';
import Chapter from '@/lib/models/Chapter';
import User from '@/lib/models/User';
import { NextResponse } from 'next/server';
import zlib from 'zlib';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const tokenUid = authHeader.split('Bearer ')[1];
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return ADMIN_UIDS.includes(tokenUid);
}

/**
 * Helper: baca semua dokumen dari cursor dalam batch kecil.
 * Mencegah spike memory vs .find({}).lean() yang load semua sekaligus.
 */
async function cursorToArray(model, batchSize = 200) {
  const results = [];
  const cursor = model.find({}).lean().cursor({ batchSize });
  for await (const doc of cursor) {
    results.push(doc);
  }
  return results;
}

export async function GET(request) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'gz';

    // Baca data dengan cursor — tidak spike memory
    const [mangas, chapters, users] = await Promise.all([
      cursorToArray(Manga),
      cursorToArray(Chapter),
      cursorToArray(User, 100), // User doc lebih besar, batch kecil
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: { mangas, chapters, users },
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    if (format === 'json') {
      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="doujindesu_backup_${Date.now()}.json"`,
        },
      });
    }

    // Default: Compress menggunakan Zlib (GZIP)
    const gzippedData = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));

    return new NextResponse(gzippedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="doujindesu_backup_${Date.now()}.json.gz"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

