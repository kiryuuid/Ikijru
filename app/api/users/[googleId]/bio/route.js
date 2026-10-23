import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// PATCH: Update bio
export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const { bio } = await request.json();

    if (bio === undefined) return errorResponse('bio is required', 400);

    const user = await User.findOneAndUpdate(
      { googleId },
      { bio: String(bio).trim().substring(0, 100) },
      { returnDocument: 'after' }
    ).lean();

    if (!user) return errorResponse('User not found', 404);

    return successResponse({ bio: user.bio });
  } catch (err) {
    return errorResponse(err.message);
  }
}
