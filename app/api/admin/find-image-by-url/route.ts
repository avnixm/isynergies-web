import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { eq, sql } from 'drizzle-orm';


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

    
    const normalizedUrl = url.split('?')[0]; 
    
    
    let [image] = await db
      .select({ id: images.id, url: images.url })
      .from(images)
      .where(eq(images.url, url))
      .limit(1)
      .orderBy(images.id); 

    
    if (!image && normalizedUrl !== url) {
      [image] = await db
        .select({ id: images.id, url: images.url })
        .from(images)
        .where(eq(images.url, normalizedUrl))
        .limit(1)
        .orderBy(images.id);
    }

    
    if (!image) {
      try {
        const decodedUrl = decodeURIComponent(normalizedUrl);
        if (decodedUrl !== normalizedUrl) {
          [image] = await db
            .select({ id: images.id, url: images.url })
            .from(images)
            .where(eq(images.url, decodedUrl))
            .limit(1)
            .orderBy(images.id);
        }
      } catch (e) {
        
      }
    }

    
    if (!image) {
      
      const urlParts = normalizedUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        [image] = await db
          .select({ id: images.id, url: images.url })
          .from(images)
          .where(sql`${images.url} LIKE ${'%' + filename}`)
          .limit(1)
          .orderBy(images.id);
      }
    }

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: image.id, url: image.url });
  } catch (error: any) {
    console.error('Error finding image by URL:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to find image',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        }),
      },
      { status: 500 }
    );
  }
}
