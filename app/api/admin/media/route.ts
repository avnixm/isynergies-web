import { NextResponse } from 'next/server';
import { requireUser } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { media } from '@/app/db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * POST /api/admin/media
 * Creates a media record after a file has been uploaded to Vercel Blob
 * 
 * Body:
 * {
 *   url: string (Vercel Blob URL)
 *   contentType: string (e.g., 'video/mp4', 'image/png')
 *   sizeBytes: number
 *   title?: string (optional filename/title)
 * }
 * 
 * Returns:
 * {
 *   id: number
 *   url: string
 *   type: 'image' | 'video'
 *   contentType: string
 *   sizeBytes: number
 *   title?: string
 *   createdAt: string
 * }
 */
export async function POST(request: Request) {
  try {
    // Authenticate user
    const { userId } = await requireUser(request);

    // Parse request body
    const body = await request.json();
    const { url, contentType, sizeBytes, title } = body;

    // Validate required fields
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'url is required and must be a string' },
        { status: 400 }
      );
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json(
        { error: 'contentType is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof sizeBytes !== 'number' || sizeBytes < 0) {
      return NextResponse.json(
        { error: 'sizeBytes is required and must be a non-negative number' },
        { status: 400 }
      );
    }

    // Derive type from contentType
    let mediaType: 'image' | 'video';
    if (contentType.startsWith('video/')) {
      mediaType = 'video';
    } else if (contentType.startsWith('image/')) {
      mediaType = 'image';
    } else {
      return NextResponse.json(
        { error: `Unsupported content type: ${contentType}. Only image/* and video/* are supported.` },
        { status: 400 }
      );
    }

    // Store the blob URL exactly as returned (no encoding)
    // Vercel Blob URLs are already properly encoded
    const result = await db.insert(media).values({
      userId,
      url: url, // Store exactly as provided
      type: mediaType,
      contentType,
      sizeBytes,
      title: title || null,
    }).$returningId();

    const mediaId = result[0]?.id;

    if (!mediaId) {
      throw new Error('Failed to insert media record - no ID returned');
    }

    // Fetch the created record
    const [createdMedia] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (!createdMedia) {
      throw new Error('Media record created but not found');
    }

    console.log(`Created media record: ID ${mediaId}, type ${mediaType}, URL: ${url.substring(0, 50)}...`);

    return NextResponse.json({
      id: createdMedia.id,
      url: createdMedia.url,
      type: createdMedia.type,
      contentType: createdMedia.contentType,
      sizeBytes: createdMedia.sizeBytes,
      title: createdMedia.title,
      createdAt: createdMedia.createdAt,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating media record:', error);
    console.error('Error stack:', error?.stack);
    
    // Handle authentication errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return detailed error in development, generic in production
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development' 
          ? error?.message || 'Failed to create media record'
          : 'Failed to create media record',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/media
 * Lists media records for the authenticated user
 */
export async function GET(request: Request) {
  try {
    const { userId } = await requireUser(request);

    const mediaRecords = await db
      .select()
      .from(media)
      .where(eq(media.userId, userId))
      .orderBy(desc(media.createdAt));

    return NextResponse.json(mediaRecords);
  } catch (error: any) {
    console.error('Error fetching media records:', error);
    console.error('Error stack:', error?.stack);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to fetch media records'
          : 'Failed to fetch media records',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
