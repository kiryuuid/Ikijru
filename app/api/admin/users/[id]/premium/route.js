import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

async function isAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  const tokenGoogleId = authHeader.split('Bearer ')[1];
  const ADMIN_GOOGLE_IDS = (process.env.NEXT_PUBLIC_ADMIN_GOOGLE_IDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  
  return ADMIN_GOOGLE_IDS.includes(tokenGoogleId);
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    if (!(await isAdmin(request))) return errorResponse('Forbidden', 403);

    const userId = params.id;
    const body = await request.json();
    const { isPremium, durationDays } = body;

    let updateData = { isPremium: Boolean(isPremium) };

    if (isPremium && durationDays) {
       // Set expiration date based on duration
       const expiryDate = new Date();
       expiryDate.setDate(expiryDate.getDate() + parseInt(durationDays, 10));
       updateData.premiumUntil = expiryDate;
    } else if (!isPremium) {
       // Revoke premium
       updateData.premiumUntil = null;
    }

    const updatedUser = await User.findOneAndUpdate(
       { googleId: userId },
       { $set: updateData },
       { returnDocument: 'after' }
    ).select('googleId displayName isPremium premiumUntil');

    if (!updatedUser) {
      return errorResponse('User tidak ditemukan di database.', 404);
    }

    return successResponse(updatedUser);
  } catch (err) {
    return errorResponse(err.message);
  }
}
