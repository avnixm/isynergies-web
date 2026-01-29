import { NextResponse } from 'next/server';
import { requireUser } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { media } from '@/app/db/schema';
import { eq, desc } from 'drizzle-orm';
























export async function POST(request: Request) {
  try {
    
    const { userId } = await requireUser(request);

    
    const body = await request.json();
    const { url, contentType, sizeBytes, title } = body;

    
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

    
    
    const result = await db.insert(media).values({
      userId,
      url: url, 
      type: mediaType,
      contentType,
      sizeBytes,
      title: title || null,
    }).$returningId();

    const mediaId = result[0]?.id;

    if (!mediaId) {
      throw new Error('Failed to insert media record - no ID returned');
    }

    
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
    
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    
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
