import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { list } from '@vercel/blob';

import { getBlobToken } from '@/app/lib/blob-token';

function guessContentTypeFromPathname(pathname: string): string {
  const lower = (pathname || '').toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'unknown';
}








export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    
    const allBlobs: Array<{
      url: string;
      pathname: string;
      uploadedAt: Date;
      size: number;
      contentType: string;
    }> = [];
    
    let cursor: string | undefined;
    let totalChecked = 0;

    do {
      const listResult = await list({
        cursor,
        limit: Math.min(100, limit - totalChecked),
        token: getBlobToken(),
      });

      for (const blob of listResult.blobs) {
        allBlobs.push({
          url: blob.url,
          pathname: blob.pathname,
          uploadedAt: blob.uploadedAt,
          size: blob.size || 0,
          
          contentType: guessContentTypeFromPathname(blob.pathname),
        });
        totalChecked++;
        
        if (totalChecked >= limit) {
          break;
        }
      }

      cursor = listResult.cursor || undefined;
    } while (cursor && totalChecked < limit);

    
    const sortedBlobs = [...allBlobs].sort((a, b) => 
      b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );

    return NextResponse.json({
      success: true,
      blobs: sortedBlobs,
      total: sortedBlobs.length,
    });
  } catch (error: any) {
    console.error('Error listing blobs:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to list blobs'
          : 'Failed to list blobs',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
