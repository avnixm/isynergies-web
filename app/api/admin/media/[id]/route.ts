import { NextResponse } from 'next/server';
import { requireUser } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { media, images, imageChunks } from '@/app/db/schema';
import { eq } from 'drizzle-orm';





export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const [mediaRecord] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (!mediaRecord) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    
    if (mediaRecord.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(mediaRecord);
  } catch (error: any) {
    console.error('Error fetching media record:', error);
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
          ? error?.message || 'Failed to fetch media record'
          : 'Failed to fetch media record',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser(request);
    const { id } = await params;
    const mediaId = parseInt(id);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const [mediaRecord] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (!mediaRecord) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    if (mediaRecord.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const url = mediaRecord.url || '';
    
    if (url.startsWith('/api/images/')) {
      const match = url.match(/\/api\/images\/(\d+)/);
      if (match) {
        const imageId = parseInt(match[1], 10);
        await db.delete(imageChunks).where(eq(imageChunks.imageId, imageId));
        await db.delete(images).where(eq(images.id, imageId));
      }
    }

    await db.delete(media).where(eq(media.id, mediaId));

    return NextResponse.json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to delete media'
          : 'Failed to delete media',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
