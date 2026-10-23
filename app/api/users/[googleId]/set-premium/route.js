import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// POST: Set premium directly (Admin panel/Dashboard)
export async function POST(request, { params }) {
  try {
    await dbConnect();
    const { googleId } = params;
    const { days } = await request.json();

    if (!days) return errorResponse('Jumlah hari (days) diperlukan', 400);

    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    if (!user.isPremium) user.premiumAt = new Date();
    user.isPremium = true;

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + parseInt(days, 10));
    user.premiumUntil = expDate;

    if (!user.notifications) user.notifications = [];
    user.notifications.push({
      title: 'Premium Diaktifkan! 🎉',
      message: `Admin telah mengaktifkan status Premium kamu selama ${days} hari. Nikmati fitur unduhan tanpa batas!`,
      isRead: false,
      createdAt: new Date(),
    });

    await user.save();

    return successResponse({
      message: `Premium berhasil diaktifkan selama ${days} hari`,
      premiumUntil: user.premiumUntil,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
