import dbConnect from '@/lib/mongodb';
import AppVersion from '@/lib/models/AppVersion';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

const ADMIN_GOOGLE_IDS = () =>
  (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);

// PUT /api/admin/app-version — update versi terbaru + opsional broadcast notifikasi
export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { adminId, versionName, versionCode, changelog, forceUpdate, downloadUrl, broadcast } = body;

    // Auth check
    if (!adminId || !ADMIN_GOOGLE_IDS().includes(adminId)) {
      return errorResponse('Akses ditolak. Hanya untuk Admin.', 403);
    }

    // Validate required fields
    if (!versionName || versionCode == null) {
      return errorResponse('Version Name dan Version Code wajib diisi.', 400);
    }

    // Upsert — selalu hanya ada 1 dokumen versi terbaru
    const version = await AppVersion.findOneAndUpdate(
      {},
      {
        versionName,
        versionCode: Number(versionCode),
        changelog: changelog || '',
        forceUpdate: Boolean(forceUpdate),
        downloadUrl: downloadUrl || 'https://play.google.com/store',
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    let broadcastResult = null;

    // Broadcast notifikasi ke semua user jika diminta
    if (broadcast) {
      const updateLabel = forceUpdate ? '⚠️ Update Wajib' : '🆕 Update Tersedia';
      const notification = {
        title: `${updateLabel} — v${versionName}`,
        message: changelog
          ? `Versi baru tersedia!\n\n${changelog}`
          : `Versi baru ${versionName} sudah tersedia. Segera update untuk menikmati fitur terbaru.`,
        isRead: false,
        createdAt: new Date(),
      };

      const result = await User.updateMany(
        {},
        { $push: { notifications: notification } }
      );

      broadcastResult = `Notifikasi terkirim ke ${result.modifiedCount} user.`;
    }

    return successResponse({
      version: {
        versionName: version.versionName,
        versionCode: version.versionCode,
        forceUpdate: version.forceUpdate,
        updatedAt: version.updatedAt,
      },
      broadcast: broadcastResult,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}

// GET /api/admin/app-version — cek versi aktif saat ini (untuk admin panel)
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId || !ADMIN_GOOGLE_IDS().includes(adminId)) {
      return errorResponse('Akses ditolak.', 403);
    }

    const version = await AppVersion.findOne().sort({ updatedAt: -1 }).lean();
    return successResponse(version || null);
  } catch (err) {
    return errorResponse(err.message);
  }
}
