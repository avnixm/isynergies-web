import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq, asc } from 'drizzle-orm';

// Finalize chunked upload - verify all chunks are present and clean up filename
export const maxDuration = 300;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { uploadId, imageId } = body;

    if (!uploadId || !imageId) {
      return NextResponse.json({ error: 'Missing uploadId or imageId' }, { status: 400 });
    }

    const imageIdNum = parseInt(imageId);

    // Get the image record to check chunk count
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, imageIdNum))
      .limit(1);

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Verify all chunks are present
    const chunks = await db
      .select()
      .from(imageChunks)
      .where(eq(imageChunks.imageId, imageIdNum))
      .orderBy(asc(imageChunks.chunkIndex));

    const expectedChunks = image.chunkCount || 0;
    const actualChunks = chunks.length;

    if (actualChunks !== expectedChunks) {
      return NextResponse.json(
        { error: `Incomplete upload: ${actualChunks}/${expectedChunks} chunks received` },
        { status: 400 }
      );
    }

    // Clean up filename (remove uploadId prefix)
    if (image.filename.includes(':')) {
      const cleanFilename = image.filename.split(':').slice(1).join(':');
      await db.update(images)
        .set({ filename: cleanFilename })
        .where(eq(images.id, imageIdNum));
    }

    // All chunks are present, upload is complete
    return NextResponse.json({ 
      success: true, 
      id: imageId,
      message: 'Upload finalized successfully' 
    });
  } catch (error: any) {
    console.error('Finalize upload error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to finalize upload',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        })
      },
      { status: 500 }
    );
  }
}
