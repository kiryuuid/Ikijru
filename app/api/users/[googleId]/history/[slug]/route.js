import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// DELETE: Remove specific history item by slug
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId, slug } = params;
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    user.history = user.history.filter(item => item.slug !== slug);
    await user.save();

    return successResponse({ message: 'Riwayat bacaan berhasil dihapus' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
