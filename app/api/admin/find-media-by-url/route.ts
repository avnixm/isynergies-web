import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { media } from '@/app/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/admin/find-media-by-url
 * Finds media record by blob URL (for deduplication only)
 * 
 * Query params:
 * - url: string (Vercel Blob URL)
 * 
 * Returns:
 * - { exists: true, id, url, type, contentType, ... } if found
 * - { exists: false } if not found
 */
export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    // Read URL from query param - searchParams.get() already decodes once
    // Don't decode again! The URL is stored exactly as returned by Blob
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { exists: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Normalize: remove query params from the URL for comparison
    const normalizedUrl = url.split('?')[0];
    
    // Query the media table (not images table)
    // Try exact match first
    let [mediaRecord] = await db
      .select()
      .from(media)
      .where(eq(media.url, url))
      .limit(1)
      .orderBy(media.id);

    // If not found, try normalized URL (without query params)
    if (!mediaRecord && normalizedUrl !== url) {
      [mediaRecord] = await db
        .select()
        .from(media)
        .where(eq(media.url, normalizedUrl))
        .limit(1)
        .orderBy(media.id);
    }

    // If still not found, try with LIKE for partial matches (filename-based)
    if (!mediaRecord) {
      const urlParts = normalizedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        [mediaRecord] = await db
          .select()
          .from(media)
          .where(sql`${media.url} LIKE ${'%' + filename}`)
          .limit(1)
          .orderBy(media.id);
      }
    }

    if (!mediaRecord) {
      return NextResponse.json(
        { exists: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      exists: true,
      id: mediaRecord.id, 
      url: mediaRecord.url,
      type: mediaRecord.type,
      contentType: mediaRecord.contentType,
      sizeBytes: mediaRecord.sizeBytes,
      title: mediaRecord.title,
      createdAt: mediaRecord.createdAt,
    });
  } catch (error: any) {
    console.error('Error finding media by URL:', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      {
        exists: false,
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to find media'
          : 'Failed to find media',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
