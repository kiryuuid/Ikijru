import dbConnect from '@/lib/mongodb';
import AppVersion from '@/lib/models/AppVersion';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';

// GET /api/app-version — public, no auth required
export async function GET() {
  try {
    await dbConnect();

    const version = await AppVersion.findOne().sort({ updatedAt: -1 }).lean();

    if (!version) {
      return successResponse(null);
    }

    return successResponse({
      versionName: version.versionName,
      versionCode: version.versionCode,
      changelog: version.changelog,
      forceUpdate: version.forceUpdate,
      downloadUrl: version.downloadUrl,
      updatedAt: version.updatedAt,
    });
  } catch (err) {
    return errorResponse(err.message);
  }
}
