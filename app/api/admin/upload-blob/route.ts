import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';

// Handle client-side uploads to Vercel Blob
// This route generates upload tokens and handles post-upload callbacks
export const maxDuration = 300;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json() as HandleUploadBody;

    const uploadResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate file type from client payload
        // clientPayload is a string (JSON) when passed from client
        let payload: { contentType?: string; filename?: string; size?: number } = {};
        try {
          payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : (clientPayload as any);
        } catch (e) {
          // If parsing fails, treat as object or use defaults
          payload = clientPayload as any;
        }
        
        const { contentType, filename, size } = payload;
        
        // Allow images and videos
        const allowedTypes = [
          'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml',
          'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
        ];
        
        if (contentType && !allowedTypes.includes(contentType)) {
          throw new Error(`File type ${contentType} is not allowed`);
        }

        return {
          allowedContentTypes: allowedTypes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ 
            filename: filename || pathname,
            contentType: contentType || 'application/octet-stream',
            size: size || 0,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Save blob URL to database
        try {
          const payload = JSON.parse(tokenPayload || '{}');
          const filename = payload.filename || blob.pathname;
          const contentType = payload.contentType || blob.contentType || 'application/octet-stream';
          const fileSize = payload.size || 0; // Size from client payload

          const result: { id: number }[] = await db.insert(images).values({
            filename,
            mimeType: contentType,
            size: fileSize,
            data: '', // Empty - we're using URL instead
            url: blob.url, // Store Vercel Blob URL
            isChunked: 0, // Not using chunking anymore
            chunkCount: 0,
          }).$returningId();

          const imageId = result[0]?.id;
          console.log(`Uploaded file saved to database with ID: ${imageId}, URL: ${blob.url}`);
        } catch (dbError: any) {
          console.error('Error saving blob URL to database:', dbError);
          // Don't throw - upload succeeded, just DB save failed
          // Could implement retry logic here
        }
      },
    });

    return NextResponse.json(uploadResponse);
  } catch (error: any) {
    console.error('Blob upload error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to handle upload',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        })
      },
      { status: 400 }
    );
  }
}
