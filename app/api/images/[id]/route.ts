import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks } from '@/app/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch image from database
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, parseInt(id)))
      .limit(1);

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Check if image is chunked
    const isChunked = (image as any).isChunked === 1 || (image as any).is_chunked === 1;
    
    let base64Data: string;
    
    if (isChunked) {
      // Fetch all chunks and reassemble
      const chunks = await db
        .select()
        .from(imageChunks)
        .where(eq(imageChunks.imageId, parseInt(id)))
        .orderBy(asc(imageChunks.chunkIndex));

      if (chunks.length === 0) {
        return NextResponse.json(
          { error: 'Image chunks not found' },
          { status: 404 }
        );
      }

      // Reassemble chunks in order
      base64Data = chunks.map(chunk => chunk.data).join('');
    } else {
      // Non-chunked image - use data directly
      base64Data = image.data;
    }

    // Convert base64 back to buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Log for debugging (especially for videos)
    const isVideo = image.mimeType?.startsWith('video/');
    if (isVideo) {
      console.log(`Serving video ${id}:`, {
        mimeType: image.mimeType,
        size: buffer.length,
        filename: image.filename,
        isChunked,
      });
    }

    // Return image/video with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': image.mimeType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Add CORS headers for video streaming
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error) {
    console.error('Image fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

