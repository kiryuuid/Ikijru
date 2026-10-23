import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// DELETE: Remove specific manga from library
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId, slug } = params;
    const result = await User.updateOne(
      { googleId },
      { $pull: { library: { slug } } }
    );
    if (result.matchedCount === 0) return errorResponse('User not found', 404);

    return successResponse({ message: 'Manga berhasil dihapus dari library' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
