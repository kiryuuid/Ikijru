import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { errorResponse } from '@/lib/api-helpers';

// Paksa Next.js agar tidak pernah mem-cache route ini
export const dynamic = 'force-dynamic';

// GET: List premium users for display on homepage
export async function GET() {
  try {
    await dbConnect();

    const now = new Date();
    const users = await User.find({
      isAdmin: { $ne: true },
      $or: [
        { isPremium: true },
        { premiumUntil: { $gt: now } },
      ],
    })
      .select('googleId displayName photoURL premiumUntil isPremium isAdmin')
      .sort({ premiumAt: -1, createdAt: -1 })
      .limit(20)
      .lean();

    const data = users.map(u => ({
      googleId: u.googleId,
      displayName: u.displayName || 'Pengguna',
      photoURL: u.photoURL || '',
      premiumUntil: u.premiumUntil || null,
      isAdmin: !!u.isAdmin,
    }));

    return Response.json(
      { success: true, data },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    return errorResponse(err.message);
  }
}
