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
    const imageId = parseInt(id);
    const range = request.headers.get('range');
    
    // Fetch image from database
    const [image] = await db
      .select()
      .from(images)
      .where(eq(images.id, imageId))
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
    let chunks: any[] = [];
    
    if (isChunked) {
      // Get expected chunk count from image record
      const expectedChunks = (image as any).chunkCount || (image as any).chunk_count || 0;
      
      // Fetch all chunks and reassemble
      chunks = await db
        .select()
        .from(imageChunks)
        .where(eq(imageChunks.imageId, imageId))
        .orderBy(asc(imageChunks.chunkIndex));

      if (chunks.length === 0) {
        console.error(`No chunks found for image ${imageId}`);
        return NextResponse.json(
          { error: 'Image chunks not found' },
          { status: 404 }
        );
      }

      console.log(`Reassembling ${chunks.length} chunks for image ${imageId} (expected: ${expectedChunks})`);
      
      // Verify we have all chunks
      if (expectedChunks > 0 && chunks.length !== expectedChunks) {
        console.error(`Incomplete chunks for image ${imageId}: got ${chunks.length}, expected ${expectedChunks}`);
        return NextResponse.json(
          { error: `Incomplete video data: ${chunks.length}/${expectedChunks} chunks available` },
          { status: 500 }
        );
      }
      
      // Verify chunk indices are sequential (0, 1, 2, ...)
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].chunkIndex !== i) {
          console.error(`Missing chunk ${i} for image ${imageId}. Found indices: ${chunks.map(c => c.chunkIndex).join(', ')}`);
          return NextResponse.json(
            { error: `Missing chunk ${i} in video data` },
            { status: 500 }
          );
        }
      }
      
      // Reassemble chunks in order
      base64Data = chunks.map(chunk => chunk.data).join('');
      
      console.log(`Reassembled ${imageId}: ${chunks.length} chunks, ${base64Data.length} base64 chars`);
      
      if (!base64Data || base64Data.length === 0) {
        console.error(`Empty base64 data after reassembly for image ${imageId}`);
        return NextResponse.json(
          { error: 'Failed to reassemble image data' },
          { status: 500 }
        );
      }
    } else {
      // Non-chunked image - use data directly
      base64Data = image.data;
      
      if (!base64Data || base64Data.length === 0) {
        console.error(`Empty base64 data for non-chunked image ${imageId}`);
        return NextResponse.json(
          { error: 'Image data is empty' },
          { status: 500 }
        );
      }
    }

    // Convert base64 back to buffer
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64Data, 'base64');
      
      if (buffer.length === 0) {
        console.error(`Empty buffer after base64 decode for image ${imageId}`);
        return NextResponse.json(
          { error: 'Failed to decode image data' },
          { status: 500 }
        );
      }
    } catch (decodeError: any) {
      console.error(`Base64 decode error for image ${imageId}:`, decodeError);
      return NextResponse.json(
        { error: `Failed to decode image data: ${decodeError.message}` },
        { status: 500 }
      );
    }

    // Check if it's a video
    const isVideo = image.mimeType?.startsWith('video/');
    
    // Validate video file signature if it's a video
    if (isVideo) {
      const firstBytes = buffer.slice(0, 12);
      const hexSignature = firstBytes.toString('hex');
      const lastBytes = buffer.slice(-12);
      const lastHexSignature = lastBytes.toString('hex');
      
      // Check for common video file signatures
      const isValidVideo = 
        hexSignature.startsWith('000000') || // MP4/MOV (ftyp box)
        hexSignature.startsWith('1a45dfa3') || // WebM (EBML)
        hexSignature.startsWith('464c5601') || // FLV
        hexSignature.startsWith('3026b2758e66cf11a6d900aa0062ce6c'); // WMV
      
      console.log(`Serving video ${imageId}:`, {
        mimeType: image.mimeType,
        size: buffer.length,
        filename: image.filename,
        isChunked,
        expectedChunks: isChunked ? ((image as any).chunkCount || (image as any).chunk_count || 0) : 1,
        actualChunks: isChunked ? (chunks?.length || 0) : 1,
        base64Length: base64Data.length,
        bufferLength: buffer.length,
        firstBytes: hexSignature,
        lastBytes: lastHexSignature,
        isValidVideoSignature: isValidVideo,
      });
      
      if (!isValidVideo && buffer.length > 0) {
        console.warn(`Warning: Video ${imageId} may have invalid file signature. First bytes: ${hexSignature}`);
      }
      
      // Check if buffer size matches expected file size
      const expectedSize = (image as any).size || 0;
      if (expectedSize > 0 && Math.abs(buffer.length - expectedSize) > 1000) {
        console.warn(`Warning: Video ${imageId} buffer size (${buffer.length}) doesn't match expected size (${expectedSize})`);
      }
    }
    
    if (range && isVideo) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
      const chunkSize = (end - start) + 1;
      const chunk = buffer.slice(start, end + 1);
      
      console.log(`Range request for video ${imageId}: ${start}-${end}/${buffer.length}`);
      
      return new NextResponse(new Uint8Array(chunk), {
        status: 206, // Partial Content
        headers: {
          'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize.toString(),
          'Content-Type': image.mimeType || 'video/mp4',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      });
    }
    
    // Return full image/video with proper headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': isVideo ? 'bytes' : 'none',
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Add CORS headers for video streaming
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      },
    });
  } catch (error: any) {
    console.error('Image fetch error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch image',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
        })
      },
      { status: 500 }
    );
  }
}

