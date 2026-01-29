import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { media } from '@/app/db/schema';
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
