import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// Find image ID by blob URL
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

    // Find image by blob URL
    const [image] = await db
      .select({ id: images.id, url: images.url })
      .from(images)
      .where(eq(images.url, url))
      .limit(1)
      .orderBy(images.id); // Get the most recent if multiple matches

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
