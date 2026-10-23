import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// DELETE: Remove specific manga from library
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId, slug } = params;
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    user.library = user.library.filter(item => item.slug !== slug);
    await user.save();

    return successResponse({ message: 'Manga berhasil dihapus dari library' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
