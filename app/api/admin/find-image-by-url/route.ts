import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.url, url))
      .limit(1);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ id: image.id, url: image.url });
  } catch (error: any) {
    console.error('Error finding image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to find image' },
      { status: 500 }
    );
  }
}
