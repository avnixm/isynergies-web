import { NextResponse } from 'next/server';
import { requireUser } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { videos } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// Save video metadata after upload
export const maxDuration = 30;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await requireUser(request);

    const body = await request.json();
    const { title, blobUrl, contentType, sizeBytes } = body;

    if (!title || !blobUrl || !contentType || !sizeBytes) {
      return NextResponse.json(
        { error: 'title, blobUrl, contentType, and sizeBytes are required' },
        { status: 400 }
      );
    }

    // Validate blobUrl is a Vercel Blob URL
    if (!blobUrl.includes('blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: 'Invalid blob URL. Must be a Vercel Blob URL.' },
        { status: 400 }
      );
    }

    // Insert video metadata
    const result = await db.insert(videos).values({
      userId,
      title,
      blobUrl,
      contentType,
      sizeBytes,
    }).$returningId();

    const videoId = result[0]?.id;

    return NextResponse.json({
      id: videoId,
      title,
      blobUrl,
      contentType,
      sizeBytes,
    });
  } catch (error: any) {
    console.error('Error saving video metadata:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to save video metadata',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        }),
      },
      { status: 500 }
    );
  }
}

// Get videos for the authenticated user
export async function GET(request: Request) {
  try {
    const { userId } = await requireUser(request);

    const userVideos = await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(videos.createdAt);

    return NextResponse.json(userVideos);
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message || 'Failed to fetch videos',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        }),
      },
      { status: 500 }
    );
  }
}
