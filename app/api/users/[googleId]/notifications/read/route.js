import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

// POST: Mark all notifications as read
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    await User.updateOne({ googleId }, { $set: { 'notifications.$[].isRead': true } });
    return successResponse({ message: 'All notifications marked as read' });
  } catch (err) {
    return errorResponse(err.message);
  }
}
