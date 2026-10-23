import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === key;
}

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password } = await request.json();
    if (!email || !password) {
      return errorResponse('Email and password are required', 400);
    }

    // Need to select '+password' because it was defined with select: false
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse('Email tidak terdaftar.', 404);
    }

    if (!user.password) {
      return errorResponse('Akun ini mendaftar menggunakan Google. Silakan login dengan Google.', 401);
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return errorResponse('Password salah.', 401);
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    // Prevent returning password hash
    const userToReturn = user.toObject();
    delete userToReturn.password;

    return successResponse(userToReturn);
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
