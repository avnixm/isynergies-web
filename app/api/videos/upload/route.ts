import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireUser } from '@/app/lib/auth-middleware';
import { del } from '@vercel/blob';
import { ensureBlobTokenEnv, getBlobToken } from '@/app/lib/blob-token';



export const maxDuration = 300; 
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    
    ensureBlobTokenEnv();

    
    const { userId } = await requireUser(request);

    const body = await request.json() as HandleUploadBody;

    const uploadResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        
        let payload: { contentType?: string; filename?: string; size?: number; oldBlobUrl?: string } = {};
        try {
          payload = typeof clientPayload === 'string' ? JSON.parse(clientPayload) : (clientPayload as any);
        } catch (e) {
          payload = clientPayload as any;
        }
        
        const { contentType, oldBlobUrl } = payload;
        
        
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

        
        const timestamp = Date.now();
        const safePathname = pathname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const videoPathname = `videos/${userId}/${timestamp}-${safePathname}`;

        
        const url = new URL(request.url);
        const callbackUrl = `${url.protocol}//${url.host}/api/videos/upload`;

        return {
          allowedContentTypes: allowedTypes,
          addRandomSuffix: true,
          callbackUrl: callbackUrl,
          tokenPayload: JSON.stringify({ 
            filename: payload.filename || pathname,
            contentType: contentType || 'video/mp4',
            size: payload.size || 0,
            userId,
            oldBlobUrl: oldBlobUrl, 
          }),
          pathname: videoPathname,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const timestamp = new Date().toISOString();
        console.log('\n' + '='.repeat(80));
        console.log(`📹 [${timestamp}] VIDEO UPLOAD COMPLETED`);
        console.log(`   URL: ${blob.url}`);
        console.log(`   Pathname: ${blob.pathname || 'N/A'}`);
        console.log('='.repeat(80));

        
        try {
          const payload = JSON.parse(tokenPayload || '{}');
          const oldBlobUrl = payload.oldBlobUrl || null;
          
          if (oldBlobUrl && typeof oldBlobUrl === 'string' && 
              oldBlobUrl.startsWith('https://') && 
              oldBlobUrl.includes('blob.vercel-storage.com')) {
            try {
              console.log(`\n🗑️  [${timestamp}] DELETING OLD BLOB (replacement)`);
              console.log(`   Old URL: ${oldBlobUrl.substring(0, 80)}...`);
              await del(oldBlobUrl, { token: getBlobToken() });
              console.log(`   ✅ Successfully deleted old blob`);
            } catch (deleteError: any) {
              console.warn(`   ❌ Failed to delete old blob: ${deleteError?.message}`);
              
            }
          }
        } catch (parseError) {
          
        }

      },
    });

    
    return NextResponse.json(uploadResponse);
  } catch (error: any) {
    console.error('Video upload error:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to handle video upload'
          : 'Failed to handle video upload',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 400 }
    );
  }
}
