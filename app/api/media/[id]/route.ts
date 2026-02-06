import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { media } from '@/app/db/schema';
import { eq } from 'drizzle-orm';








export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id, 10);

    if (Number.isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const range = request.headers.get('range');

    const [record] = await db
      .select()
      .from(media)
      .where(eq(media.id, mediaId))
      .limit(1);

    if (!record) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const blobUrl = record.url || '';
    
    if (blobUrl && blobUrl.startsWith('https://')) {
      const headers = new Headers();
      headers.set('Location', blobUrl);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
      if (record.contentType) headers.set('Content-Type', record.contentType);
      if (range) headers.set('Range', range);
      return new NextResponse(null, { status: 307, headers });
    }
    
    if (blobUrl && blobUrl.startsWith('/api/images/')) {
      const match = blobUrl.match(/\/api\/images\/(\d+)/);
      if (match) {
        const imageId = parseInt(match[1], 10);
        const url = new URL(request.url);
        const redirectTo = new URL(`/api/images/${imageId}${url.search || ''}`, url.origin);
        const headers = new Headers();
        headers.set('Location', redirectTo.toString());
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        if (record.contentType) headers.set('Content-Type', record.contentType);
        if (range) headers.set('Range', range);
        return new NextResponse(null, { status: 307, headers });
      }
    }
    
    return NextResponse.json({ error: 'Media URL missing or invalid' }, { status: 404 });
  } catch (error: any) {
    console.error('Media fetch error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch media',
        ...(process.env.NODE_ENV === 'development' && { details: error?.message }),
      },
      { status: 500 }
    );
  }
}

