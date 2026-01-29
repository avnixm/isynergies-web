import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { media, images } from '@/app/db/schema';
import { eq, sql } from 'drizzle-orm';















export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { exists: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    
    const normalizedUrl = url.split('?')[0];
    
    
    let [mediaRecord] = await db
      .select()
      .from(media)
      .where(eq(media.url, url))
      .limit(1)
      .orderBy(media.id);

    
    if (!mediaRecord && normalizedUrl !== url) {
      [mediaRecord] = await db
        .select()
        .from(media)
        .where(eq(media.url, normalizedUrl))
        .limit(1)
        .orderBy(media.id);
    }

    if (mediaRecord) {
      return NextResponse.json({
        exists: true,
        id: mediaRecord.id,
        url: mediaRecord.url,
        type: mediaRecord.type,
        contentType: mediaRecord.contentType,
        sizeBytes: mediaRecord.sizeBytes,
        title: mediaRecord.title,
        source: 'media',
        createdAt: mediaRecord.createdAt,
      });
    }

    
    let [imageRecord] = await db
      .select()
      .from(images)
      .where(eq(images.url, url))
      .limit(1)
      .orderBy(images.id);

    
    if (!imageRecord && normalizedUrl !== url) {
      [imageRecord] = await db
        .select()
        .from(images)
        .where(eq(images.url, normalizedUrl))
        .limit(1)
        .orderBy(images.id);
    }

    
    if (!imageRecord) {
      const urlParts = normalizedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        [imageRecord] = await db
          .select()
          .from(images)
          .where(sql`${images.url} LIKE ${'%' + filename}`)
          .limit(1)
          .orderBy(images.id);
      }
    }

    if (imageRecord) {
      
      const type = imageRecord.mimeType?.startsWith('video/') ? 'video' : 'image';
      
      return NextResponse.json({
        exists: true,
        id: imageRecord.id,
        url: imageRecord.url,
        type,
        contentType: imageRecord.mimeType || 'application/octet-stream',
        sizeBytes: imageRecord.size || 0,
        title: imageRecord.filename,
        source: 'images', 
        createdAt: imageRecord.createdAt,
      });
    }

    
    return NextResponse.json(
      { exists: false },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error finding media (unified):', error);
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
