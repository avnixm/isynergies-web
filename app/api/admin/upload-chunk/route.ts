import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';



export const maxDuration = 300;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;
    const fileSize = parseInt(formData.get('fileSize') as string);

    if (!file || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Chunk = buffer.toString('base64');

    
    const timestamp = Date.now();
    const originalName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;

    
    if (chunkIndex === 0) {
      const result: { id: number }[] = await db.insert(images).values({
        filename,
        mimeType: fileType,
        size: fileSize,
        data: '', // Empty for chunked images
        isChunked: 1,
        chunkCount: totalChunks,
      }).$returningId();

      const imageId = result[0]?.id;
      if (!imageId) {
        throw new Error('Failed to create image record');
      }

      
      
      
      await db.update(images)
        .set({ filename: `${uploadId}:${filename}` })
        .where(eq(images.id, imageId));

      
      await db.insert(imageChunks).values({
        imageId,
        chunkIndex: 0,
        data: base64Chunk,
      });

      return NextResponse.json({ 
        success: true, 
        id: imageId,
        chunkIndex,
        totalChunks 
      });
    } else {
      
      const allImages = await db
        .select()
        .from(images)
        .where(eq(images.isChunked, 1))
        .limit(100);

      let targetImageId: number | null = null;
      for (const img of allImages) {
        if (img.filename.startsWith(`${uploadId}:`)) {
          targetImageId = img.id;
          break;
        }
      }

      if (!targetImageId) {
        return NextResponse.json({ error: 'Upload session not found' }, { status: 404 });
      }

      
      await db.insert(imageChunks).values({
        imageId: targetImageId,
        chunkIndex,
        data: base64Chunk,
      });

      return NextResponse.json({ 
        success: true, 
        id: targetImageId,
        chunkIndex,
        totalChunks 
      });
    }
  } catch (error: any) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to upload chunk',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          code: error?.code,
        })
      },
      { status: 500 }
    );
  }
}
