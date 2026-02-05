import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { images, imageChunks, media } from '@/app/db/schema';
import { and, eq, like } from 'drizzle-orm';





export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    const [image] = await db
      .select({
        id: images.id,
        url: images.url,
        filename: images.filename,
        mimeType: images.mimeType,
        size: images.size,
      })
      .from(images)
      .where(eq(images.id, imageId))
      .limit(1);

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(image);
  } catch (error: any) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to fetch image'
          : 'Failed to fetch image',
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
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    
    
    const imagePath = `/api/images/${imageId}`;

    
    
    const mediaRecords = await db
      .select()
      .from(media)
      .where(
        and(
          
          like(media.url, '/api/images/%'),
          eq(media.url, imagePath),
        ),
      );

    
    if (mediaRecords.length > 0) {
      await db
        .delete(media)
        .where(eq(media.url, imagePath));
    }

    
    await db.delete(imageChunks).where(eq(imageChunks.imageId, imageId));
    await db.delete(images).where(eq(images.id, imageId));

    return NextResponse.json({
      success: true,
      message: 'Image and any referencing media records deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to delete image'
          : 'Failed to delete image',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
