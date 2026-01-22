import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { filename, mimeType, size, url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const result: { id: number }[] = await db.insert(images).values({
      filename: filename || 'uploaded-file',
      mimeType: mimeType || 'application/octet-stream',
      size: size || 0,
      data: '', // Empty - using URL instead
      url: url,
      isChunked: 0,
      chunkCount: 0,
    }).$returningId();

    const imageId = result[0]?.id;
    if (!imageId) {
      throw new Error('Failed to create image record');
    }

    return NextResponse.json({ id: imageId, url });
  } catch (error: any) {
    console.error('Error creating image from blob:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create image' },
      { status: 500 }
    );
  }
}
