import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { getBlobToken } from '@/app/lib/blob-token';

/**
 * GET /api/admin/blob-available
 * Returns whether Vercel Blob storage is configured (BLOB_READ_WRITE_TOKEN).
 * When false, the client can upload videos directly to the database instead.
 * When SINGLE_VIDEO_UPLOAD=true (e.g. cPanel/PM2), singleVideoUploadOnly is true:
 * client must use a single POST for video (no chunked upload); max 20MB.
 */
export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const available = !!getBlobToken();
  const singleVideoUploadOnly =
    process.env.SINGLE_VIDEO_UPLOAD === 'true' ||
    process.env.DISABLE_CHUNKED_VIDEO_UPLOAD === 'true';
  return NextResponse.json({ available, singleVideoUploadOnly: !!singleVideoUploadOnly });
}
