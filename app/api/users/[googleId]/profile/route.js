import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

function getR2Client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_DOMAIN) {
    throw new Error('R2 env vars are not fully configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY,
      secretAccessKey: R2_SECRET_KEY,
    },
  });
}

// Upload avatar ke R2 dengan key unik
async function uploadAvatar(buffer, googleId, ext, contentType) {
  const { R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } = process.env;
  const safeExt = ext?.replace(/[^a-z0-9]/gi, '') || 'jpg';
  const key = `avatars/${googleId}/${Date.now()}.${safeExt}`;
  const client = getR2Client();

  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'image/jpeg',
  }));

  return `${R2_PUBLIC_DOMAIN.replace(/\/$/, '')}/${key}`;
}

export async function PATCH(request, { params }) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const requesterId = authHeader.split('Bearer ')[1];
    const { googleId } = params;
    if (requesterId !== googleId) {
      return errorResponse('Forbidden', 403);
    }

    await dbConnect();
    const user = await User.findOne({ googleId });
    if (!user) return errorResponse('User not found', 404);

    const formData = await request.formData();
    const rawName = formData.get('displayName');
    const file = formData.get('photo');

    if (!rawName && !file) {
      return errorResponse('No changes supplied', 400);
    }

    if (rawName) {
      const name = rawName.toString().trim().substring(0, 50);
      if (!name) return errorResponse('displayName cannot be empty', 400);
      user.displayName = name;
    }

    if (file) {
      if (typeof file.arrayBuffer !== 'function') {
        return errorResponse('Invalid file upload', 400);
      }

      const mime = (file.type || '').toLowerCase();
      if (!mime.startsWith('image/')) {
        return errorResponse('Only image uploads are allowed', 400);
      }

      const size = file.size || 0;
      const MAX_BYTES = 3 * 1024 * 1024;
      if (size > MAX_BYTES) {
        return errorResponse('Image too large (max 3MB)', 400);
      }

      const originalBuffer = Buffer.from(await file.arrayBuffer());

      let outputBuffer = originalBuffer;
      let ext = 'jpg';
      let contentType = 'image/jpeg';

      const isGif = mime === 'image/gif';

      if (!isGif) {
        // Resize + convert ke JPEG untuk non-GIF agar hemat ukuran
        outputBuffer = await sharp(originalBuffer)
          .rotate()
          .resize(512, 512, { fit: 'cover' })
          .jpeg({ quality: 80 })
          .toBuffer();
        ext = 'jpg';
        contentType = 'image/jpeg';
      } else {
        // GIF dibiarkan apa adanya agar animasi tetap jalan
        ext = 'gif';
        contentType = mime;
      }

      const publicUrl = await uploadAvatar(outputBuffer, googleId, ext, contentType);
      user.photoURL = publicUrl;
    }

    await user.save();
    return successResponse({
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
