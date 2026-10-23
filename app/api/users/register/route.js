import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(request) {
  try {
    // Disable registration temporarily
    return errorResponse('Pendaftaran akun baru sedang dinonaktifkan untuk sementara.', 403);

    await dbConnect();

    const { email, password, displayName } = await request.json();
    if (!email || !password || !displayName) {
      return errorResponse('Email, password, and displayName are required', 400);
    }

    // Check if user already exists (by email)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse('Email sudah terdaftar. Silakan login.', 400);
    }

    const today = new Date().toISOString().split('T')[0];

    // Create a new unique identifier to act as token/googleId
    // We use a combination of simple random strings to mimic a uid
    const newGoogleId = 'email_' + crypto.randomBytes(16).toString('hex');

    const ADMIN_GOOGLE_IDS = (process.env.NEXT_PUBLIC_ADMIN_GOOGLE_IDS || process.env.NEXT_PUBLIC_ADMIN_UIDS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const isUserAdmin = ADMIN_GOOGLE_IDS.includes(email);

    const newUser = new User({
      googleId: newGoogleId,
      email,
      password: hashPassword(password),
      displayName,
      photoURL: '/default-avatar.gif',
      isAdmin: isUserAdmin,
      isPremium: isUserAdmin,
      premiumAt: isUserAdmin ? new Date() : null,
      dailyDownloads: { date: today, count: 0 },
      lastLoginAt: new Date(),
    });

    await newUser.save();

    // Prevent returning password hash
    const userToReturn = newUser.toObject();
    delete userToReturn.password;

    return successResponse(userToReturn);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}

