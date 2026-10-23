import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }
    const googleId = authHeader.split('Bearer ')[1];

    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    // Disable trial claim temporarily
    return errorResponse('Fitur Premium Trial sedang dinonaktifkan untuk sementara.', 403);

    if (user.hasUsedTrial) {
      return errorResponse('Anda sudah pernah menggunakan Premium Trial.', 400);
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';

    // Cek abuse: IP yang sama tidak boleh klaim lebih dari satu kali untuk akun berbeda
    if (ip !== 'unknown' && ip !== '127.0.0.1' && ip !== '::1') {
      const existingIpUser = await User.findOne({ trialClaimIp: ip, googleId: { $ne: googleId } }, '_id');
      if (existingIpUser) {
        return errorResponse('Perangkat atau jaringan (IP) ini sudah pernah digunakan untuk mengklaim Trial. Silakan beli Premium.', 403);
      }
    }

    if (user.isAdmin || (user.isPremium && !user.premiumUntil)) {
      // Lifetime premium doesn't need trial
      return errorResponse('Akun Anda sudah memiliki Premium Unlimited.', 400);
    }

    // Give 2 days of premium
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;

    // If already premium but expired, or active premium:
    let newPremiumUntil;
    if (user.isPremium && user.premiumUntil) {
      const now = new Date();
      if (user.premiumUntil > now) {
        // Add 2 days to current expiry if it's somehow already active
        newPremiumUntil = new Date(user.premiumUntil.getTime() + twoDaysMs);
      } else {
        // Expired, start from now
        newPremiumUntil = new Date(Date.now() + twoDaysMs);
      }
    } else {
      // First time premium
      newPremiumUntil = new Date(Date.now() + twoDaysMs);
    }

    const now = new Date();
    if (!user.isPremium) user.premiumAt = now;
    user.isPremium = true;
    user.premiumUntil = newPremiumUntil;
    user.hasUsedTrial = true;
    user.trialClaimIp = ip !== 'unknown' ? ip : null;

    // Jika limit download tersisa hari ini kurang dari 6 atau kita mau kembalikan ke full bebas, tidak perlu diubah karena bypass limit menggunakan isPremium=true.

    await user.save();

    return Response.json({
      success: true,
      message: 'Berhasil! Akun Anda kini Premium selama 2 Hari ke depan. 🚀'
    });
  } catch (err) {
    console.error('Trial Claim Error:', err);
    return errorResponse(err.message, 500);
  }
}

