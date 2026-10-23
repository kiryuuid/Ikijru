import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// Middleware logic directly implemented in route
async function isAdmin(request) {
  const { adminId } = await request.clone().json();
  const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').map(s => s.trim()).filter(Boolean);

  if (!adminId || !ADMIN_UIDS.includes(adminId)) {
    return false;
  }
  return true;
}

// POST: Admin broadcast notification
export async function POST(request) {
  try {
    await dbConnect();

    const isAuthorized = await isAdmin(request);
    if (!isAuthorized) {
      return errorResponse('Akses ditolak. Hanya untuk Admin.', 403);
    }

    const { title, message } = await request.json();

    if (!title || !message) {
      return errorResponse('Judul dan pesan tidak boleh kosong', 400);
    }

    const newNotification = {
      title,
      message,
      isRead: false,
      createdAt: new Date(),
    };

    const result = await User.updateMany(
      {},
      { $push: { notifications: newNotification } }
    );

    return successResponse({
      message: `Notifikasi berhasil dikirim ke ${result.modifiedCount} user.`,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
