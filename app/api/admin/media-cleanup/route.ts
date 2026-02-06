import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks, media } from '@/app/db/schema';
import { eq, like } from 'drizzle-orm';
import { requireAuth } from '@/app/lib/auth-middleware';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const startedAt = new Date().toISOString();

    
    
    const mediaRows = await db
      .select()
      .from(media)
      .where(like(media.url, '/api/images/%'));

    let orphanMediaDeleted = 0;
    const orphanMediaIds: number[] = [];

    for (const m of mediaRows) {
      const url = (m as any).url as string | null;
      if (!url || typeof url !== 'string') continue;
      const match = url.match(/\/api\/images\/(\d+)/);
      if (!match) continue;

      const imageId = parseInt(match[1], 10);
      if (Number.isNaN(imageId)) continue;

      const [imageRow] = await db
        .select()
        .from(images)
        .where(eq(images.id, imageId))
        .limit(1);

      if (!imageRow) {
        
        await db.delete(media).where(eq(media.id, (m as any).id));
        orphanMediaDeleted += 1;
        orphanMediaIds.push((m as any).id);
      }
    }

    
    
    const chunkRows = await db
      .select({
        id: imageChunks.id,
        imageId: imageChunks.imageId,
      })
      .from(imageChunks);

    const orphanChunkIds: number[] = [];
    let orphanChunksDeleted = 0;

    for (const row of chunkRows) {
      const imageId = (row as any).imageId as number;
      const [imageRow] = await db
        .select()
        .from(images)
        .where(eq(images.id, imageId))
        .limit(1);

      if (!imageRow) {
        await db.delete(imageChunks).where(eq(imageChunks.id, (row as any).id));
        orphanChunksDeleted += 1;
        orphanChunkIds.push((row as any).id);
      }
    }

    const finishedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      startedAt,
      finishedAt,
      orphanMediaDeleted,
      orphanMediaIds,
      orphanChunksDeleted,
      orphanChunkIds,
      note:
        'This tool safely deletes media rows pointing to missing /api/images/:id and image_chunks rows whose parent image no longer exists. It does NOT delete images that may still be referenced by other tables.',
    });
  } catch (error: any) {
    console.error('Error running media cleanup:', error);
    return NextResponse.json(
      {
        error: 'Failed to run media cleanup',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 },
    );
  }
}

