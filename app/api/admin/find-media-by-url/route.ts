import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { eq, sql } from 'drizzle-orm';

// Unified endpoint to find media (images or videos) by blob URL
// This replaces the image-only find-image-by-url endpoint
export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Normalize URL for comparison (remove query params, handle encoding)
    const normalizedUrl = url.split('?')[0]; // Remove query parameters
    
    // Find media by blob URL - try multiple matching strategies
    let [media] = await db
      .select({ 
        id: images.id, 
        url: images.url,
        mimeType: images.mimeType,
        filename: images.filename,
        size: images.size,
      })
      .from(images)
      .where(eq(images.url, url))
      .limit(1)
      .orderBy(images.id); // Get the most recent if multiple matches

    // If not found, try normalized URL (without query params)
    if (!media && normalizedUrl !== url) {
      [media] = await db
        .select({ 
          id: images.id, 
          url: images.url,
          mimeType: images.mimeType,
          filename: images.filename,
          size: images.size,
        })
        .from(images)
        .where(eq(images.url, normalizedUrl))
        .limit(1)
        .orderBy(images.id);
    }

    // If still not found, try URL decoding (handles %2528 -> %28 -> (2))
    if (!media) {
      try {
        // Decode once: %2528 -> %28
        const decodedOnce = decodeURIComponent(normalizedUrl);
        if (decodedOnce !== normalizedUrl) {
          [media] = await db
            .select({ 
              id: images.id, 
              url: images.url,
              mimeType: images.mimeType,
              filename: images.filename,
              size: images.size,
            })
            .from(images)
            .where(eq(images.url, decodedOnce))
            .limit(1)
            .orderBy(images.id);
        }
        
        // If still not found, try double decoding: %2528 -> %28 -> (2)
        if (!media && decodedOnce !== normalizedUrl) {
          try {
            const decodedTwice = decodeURIComponent(decodedOnce);
            if (decodedTwice !== decodedOnce) {
              [media] = await db
                .select({ 
                  id: images.id, 
                  url: images.url,
                  mimeType: images.mimeType,
                  filename: images.filename,
                  size: images.size,
                })
                .from(images)
                .where(eq(images.url, decodedTwice))
                .limit(1)
                .orderBy(images.id);
            }
          } catch (e) {
            // Double decode failed, continue
          }
        }
      } catch (e) {
        // URL decode failed, continue
      }
    }

    // If still not found, try with LIKE for partial matches (filename-based)
    if (!media) {
      // Extract the filename part from the URL for partial matching
      const urlParts = normalizedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        // Try matching just the filename part
        [media] = await db
          .select({ 
            id: images.id, 
            url: images.url,
            mimeType: images.mimeType,
            filename: images.filename,
            size: images.size,
          })
          .from(images)
          .where(sql`${images.url} LIKE ${'%' + filename}`)
          .limit(1)
          .orderBy(images.id);
      }
    }

    if (!media) {
      return NextResponse.json(
        { exists: false, error: 'Media not found' },
        { status: 404 }
      );
    }

    // Determine media type
    const isVideo = media.mimeType?.startsWith('video/');
    const isImage = media.mimeType?.startsWith('image/');

    return NextResponse.json({ 
      id: media.id, 
      url: media.url,
      contentType: media.mimeType,
      filename: media.filename,
      size: media.size,
      mediaType: isVideo ? 'video' : isImage ? 'image' : 'unknown',
      exists: true,
    });
  } catch (error: any) {
    console.error('Error finding media by URL:', error);
    return NextResponse.json(
      {
        exists: false,
        error: error?.message || 'Failed to find media',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        }),
      },
      { status: 500 }
    );
  }
}
