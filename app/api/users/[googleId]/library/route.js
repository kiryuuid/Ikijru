import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// GET: Get user library
export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const user = await User.findOne({ googleId }).select('library').lean();
    if (!user) return errorResponse('User not found', 404);
    const sorted = (user.library || []).sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    return successResponse(sorted);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// POST: Add or update manga in library
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const { slug, mangaData } = await request.json();
    if (!slug) return errorResponse('slug is required', 400);

    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    const existingIndex = user.library.findIndex(item => item.slug === slug);
    if (existingIndex >= 0) {
      user.library[existingIndex].mangaData = mangaData;
      user.library[existingIndex].addedAt = Date.now();
    } else {
      user.library.push({ slug, mangaData, addedAt: Date.now() });
    }

    await user.save();
    return successResponse(user.library);
  } catch (err) {
    return errorResponse(err.message);
  }
}

// DELETE: Clear all library
export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    user.library = [];
    await user.save();
    return successResponse({ message: 'Library berhasil dikosongkan' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
