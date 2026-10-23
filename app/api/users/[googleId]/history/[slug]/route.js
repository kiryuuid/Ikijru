import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// DELETE: Remove specific history item by slug
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId, slug } = params;
    const result = await User.updateOne(
      { googleId },
      { $pull: { history: { slug } } }
    );
    if (result.matchedCount === 0) return errorResponse('User not found', 404);

    return successResponse({ message: 'Riwayat bacaan berhasil dihapus' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
