import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireUser } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';

// Handle client-side uploads to Vercel Blob for videos
// This follows Vercel's "Client Uploads" pattern using handleUpload
export const maxDuration = 300; // 5 minutes for large video uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await requireUser(request);

    const body = await request.json() as HandleUploadBody;

    // Store imageId to return in response
    let savedImageId: number | null = null;

    const uploadResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate file type from client payload
        let payload: { contentType?: string; filename?: string; size?: number } = {};
        try {
          payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : (clientPayload as any);
        } catch (e) {
          payload = clientPayload as any;
        }
        
        const { contentType } = payload;
        
        // Only allow videos
        const allowedTypes = [
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',
          'video/mpeg',
        ];
        
        if (contentType && !allowedTypes.includes(contentType)) {
          throw new Error(`File type ${contentType} is not allowed. Only video files are supported.`);
        }

        // Generate pathname with userId
        const timestamp = Date.now();
        const safePathname = pathname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const videoPathname = `videos/${userId}/${timestamp}-${safePathname}`;

        return {
          allowedContentTypes: allowedTypes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ 
            filename: payload.filename || pathname,
            contentType: contentType || 'video/mp4',
            size: payload.size || 0,
            userId,
          }),
          pathname: videoPathname,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Save blob URL to database (images table stores both images and videos)
        try {
          const payload = JSON.parse(tokenPayload || '{}');
          const filename = payload.filename || blob.pathname;
          const contentType = payload.contentType || blob.contentType || 'video/mp4';
          const fileSize = payload.size || 0;

          // Store the blob URL exactly as returned by Vercel (no double encoding)
          // blob.url is already properly formatted
          const result: { id: number }[] = await db.insert(images).values({
            filename,
            mimeType: contentType,
            size: fileSize,
            data: '', // Empty - we're using URL instead
            url: blob.url, // Store Vercel Blob URL (already properly encoded)
            isChunked: 0,
            chunkCount: 0,
          }).$returningId();

          savedImageId = result[0]?.id || null;
          console.log(`Video uploaded to Blob and saved to database with ID: ${savedImageId}, URL: ${blob.url}`);
        } catch (dbError: any) {
          console.error('Error saving blob URL to database:', dbError);
          // Don't throw - upload succeeded, just DB save failed
          // The client will retry finding the media record
        }
      },
    });

    // Return upload response with imageId if available
    return NextResponse.json({
      ...uploadResponse,
      imageId: savedImageId, // Include the imageId in the response
    });
  } catch (error: any) {
    console.error('Video upload error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to handle video upload',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        }),
      },
      { status: 400 }
    );
  }
}
