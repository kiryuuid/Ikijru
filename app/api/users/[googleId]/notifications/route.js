import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// GET: Get user notifications
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    
    // Gunakan findOne dengan Mongoose instance bukan lean untuk memungkinkan save() kalau ada perubahan
    const user = await User.findOne({ googleId }).select('notifications');
    if (!user) return errorResponse('User not found', 404);

    const now = new Date();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    let hasChanged = false;

    // Filter notifikasi yang usianya masih di bawah 1 hari (24 jam)
    const validNotifications = (user.notifications || []).filter(notif => {
      const diffStr = now.getTime() - new Date(notif.createdAt).getTime();
      if (diffStr > ONE_DAY_MS) {
        hasChanged = true;
        return false; // Hapus
      }
      return true; // Simpan
    });

    // Jika ada yang terhapus karena kadaluarsa, update ke database backend
    if (hasChanged) {
      user.notifications = validNotifications;
      await user.save();
    }

    const sortedNotifications = validNotifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return successResponse(sortedNotifications);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// DELETE: Clear all notifications
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    
    await User.updateOne({ googleId }, { $set: { notifications: [] } });
    
    return successResponse({ message: 'Semua notifikasi berhasil dihapus' });
  } catch (err) {
    return errorResponse(err.message);
  }
}

