import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks, media } from '@/app/db/schema';
import { eq, asc } from 'drizzle-orm';

const CHUNKED_VIDEO_CACHE_TTL_MS = 2 * 60 * 1000;
const CHUNKED_VIDEO_CACHE_MAX = 15;
const chunkedVideoBufferCache = new Map<
  number,
  { buffer: Buffer; expiresAt: number }
>();
const chunkedVideoChunksCache = new Map<
  number,
  { chunks: any[]; expiresAt: number }
>();

function getCachedChunkedBuffer(imageId: number): Buffer | null {
  const entry = chunkedVideoBufferCache.get(imageId);
  if (!entry || Date.now() >= entry.expiresAt) {
    if (entry) chunkedVideoBufferCache.delete(imageId);
    return null;
  }
  return entry.buffer;
}

function setCachedChunkedBuffer(imageId: number, buffer: Buffer): void {
  if (chunkedVideoBufferCache.size >= CHUNKED_VIDEO_CACHE_MAX) {
    let oldestKey: number | null = null;
    let oldestExp = Infinity;
    for (const [k, v] of chunkedVideoBufferCache) {
      if (v.expiresAt < oldestExp) {
        oldestExp = v.expiresAt;
        oldestKey = k;
      }
    }
    if (oldestKey != null) chunkedVideoBufferCache.delete(oldestKey);
  }
  chunkedVideoBufferCache.set(imageId, {
    buffer,
    expiresAt: Date.now() + CHUNKED_VIDEO_CACHE_TTL_MS,
  });
}

function getCachedChunks(imageId: number): any[] | null {
  const entry = chunkedVideoChunksCache.get(imageId);
  if (!entry || Date.now() >= entry.expiresAt) {
    if (entry) chunkedVideoChunksCache.delete(imageId);
    return null;
  }
  return entry.chunks;
}

function setCachedChunks(imageId: number, chunks: any[]): void {
  if (chunkedVideoChunksCache.size >= CHUNKED_VIDEO_CACHE_MAX) {
    let oldestKey: number | null = null;
    let oldestExp = Infinity;
    for (const [k, v] of chunkedVideoChunksCache) {
      if (v.expiresAt < oldestExp) {
        oldestExp = v.expiresAt;
        oldestKey = k;
      }
    }
    if (oldestKey != null) chunkedVideoChunksCache.delete(oldestKey);
  }
  chunkedVideoChunksCache.set(imageId, {
    chunks,
    expiresAt: Date.now() + CHUNKED_VIDEO_CACHE_TTL_MS,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let imageId = parseInt(id);
    const range = request.headers.get('range');
    
    // We intentionally resolve MEDIA records first so that numeric IDs that
    // collide between `media.id` and `images.id` prefer the media mapping.
    // This is important because many frontends store numeric media IDs and
    // call `/api/images/:id` for both images and videos.
    let mediaRecord = null as any;
    let image = null as any;
    let blobUrl: string | null = null;
    let contentType: string | null = null;
    let isVideoFile = false;

    // 1) Try to resolve as media id
    const mediaRows = await db
      .select()
      .from(media)
      .where(eq(media.id, imageId))
      .limit(1);
    if (mediaRows.length > 0) {
      mediaRecord = mediaRows[0];
      blobUrl = mediaRecord.url;
      contentType = mediaRecord.contentType;
      isVideoFile = mediaRecord.type === 'video';

      // If media points at /api/images/:imageId, resolve that image row.
      if (blobUrl && typeof blobUrl === 'string' && blobUrl.startsWith('/api/images/')) {
        const match = blobUrl.match(/\/api\/images\/(\d+)/);
        if (match) {
          const resolvedId = parseInt(match[1], 10);
          const imageRows = await db
            .select()
            .from(images)
            .where(eq(images.id, resolvedId))
            .limit(1);
          if (imageRows.length > 0) {
            image = imageRows[0];
            imageId = resolvedId;
            // Override contentType/isVideoFile with underlying image metadata
            contentType = image.mimeType || contentType;
            isVideoFile = image.mimeType?.startsWith('video/') || isVideoFile;
          } else {
            return NextResponse.json(
              { error: 'Media points to missing image' },
              { status: 404 }
            );
          }
        }
      }
    }

    // 2) If no media record was found, or media didn't resolve to an image,
    // fall back to treating the id as a raw images.id.
    if (!image) {
      const imageRows = await db
        .select()
        .from(images)
        .where(eq(images.id, imageId))
        .limit(1);
      if (imageRows.length > 0) {
        image = imageRows[0];
        blobUrl = image.url || blobUrl;
        contentType = image.mimeType || contentType;
        isVideoFile = image.mimeType?.startsWith('video/') || isVideoFile;
      }
    }

    // 3) If still nothing, return 404.
    if (!image && !mediaRecord) {
      return NextResponse.json(
        { error: 'Image/Media not found' },
        { status: 404 }
      );
    }

    // 4) External blob/URL handling (kept for backwards compatibility).
    if (blobUrl && blobUrl.startsWith('https://')) {
      console.log(`Redirecting to external URL for ${image ? 'image' : 'media'} ${imageId}: ${blobUrl}`);
      
      if (isVideoFile) {
        const headers = new Headers();
        headers.set('Location', blobUrl);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length, Content-Type');
        if (contentType) headers.set('Content-Type', contentType);
        if (range) headers.set('Range', range);
        return new NextResponse(null, { status: 307, headers });
      }
      
      return NextResponse.redirect(blobUrl, 302);
    }

    // 5) A media record with no URL is invalid.
    if (mediaRecord && !blobUrl && !image) {
      return NextResponse.json(
        { error: 'Media record found but has no URL' },
        { status: 404 }
      );
    }

    // 6) At this point we must have an `image` row to serve from DB.
    if (!image) {
      return NextResponse.json(
        { error: 'Media record found but underlying image is missing' },
        { status: 404 }
      );
    }

    
    
    const isChunked = (image as any).isChunked === 1 || (image as any).is_chunked === 1;
    
    let base64Data: string;
    let chunks: any[] = [];
    
    if (isChunked) {
      
      const expectedChunks = (image as any).chunkCount || (image as any).chunk_count || 0;
      
      const cachedChunks = getCachedChunks(imageId);
      if (cachedChunks) {
        chunks = cachedChunks;
      } else {
        chunks = await db
          .select()
          .from(imageChunks)
          .where(eq(imageChunks.imageId, imageId))
          .orderBy(asc(imageChunks.chunkIndex));
        setCachedChunks(imageId, chunks);
      }

      if (chunks.length === 0) {
        console.error(`No chunks found for image ${imageId}`);
        return NextResponse.json(
          { error: 'Image chunks not found' },
          { status: 404 }
        );
      }

      if (expectedChunks > 0 && chunks.length !== expectedChunks) {
        console.error(`Incomplete chunks for image ${imageId}: got ${chunks.length}, expected ${expectedChunks}`);
        return NextResponse.json(
          { error: `Incomplete video data: ${chunks.length}/${expectedChunks} chunks available` },
          { status: 500 }
        );
      }
      
      
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i].chunkIndex !== i) {
          console.error(`Missing chunk ${i} for image ${imageId}. Found indices: ${chunks.map(c => c.chunkIndex).join(', ')}`);
          return NextResponse.json(
            { error: `Missing chunk ${i} in video data` },
            { status: 500 }
          );
        }
      }
      
      
      const chunkDataArray: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk.data || chunk.data.length === 0) {
          console.error(`Chunk ${i} for image ${imageId} is empty`);
          return NextResponse.json(
            { error: `Chunk ${i} is empty or missing data` },
            { status: 500 }
          );
        }
        chunkDataArray.push(chunk.data);
      }
      
      base64Data = chunkDataArray.join('');
    } else {
      
      base64Data = image.data;
      
      if (!base64Data || base64Data.length === 0) {
        console.error(`Empty base64 data for non-chunked image ${imageId}`);
        return NextResponse.json(
          { error: 'Image data is empty' },
          { status: 500 }
        );
      }
    }

    
    let buffer: Buffer;
    try {
      if (isChunked && chunks.length > 0) {
        const cached = getCachedChunkedBuffer(imageId);
        if (cached) {
          buffer = cached;
        } else {
          const bufferParts: Buffer[] = [];
          for (const chunk of chunks) {
            const part = Buffer.from(chunk.data, 'base64');
            if (part.length === 0 && chunk.data.length > 0) {
              return NextResponse.json(
                { error: 'Invalid base64 data in chunks' },
                { status: 500 }
              );
            }
            bufferParts.push(part);
          }
          buffer = Buffer.concat(bufferParts);
          setCachedChunkedBuffer(imageId, buffer);
        }
      } else {
        buffer = Buffer.from(base64Data, 'base64');
      }
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

    
    const isVideo = image.mimeType?.startsWith('video/');
    
    
    if (isVideo) {
      const firstBytes = buffer.slice(0, 12);
      const hexSignature = firstBytes.toString('hex');
      const lastBytes = buffer.slice(-12);
      const lastHexSignature = lastBytes.toString('hex');
      
      
      const isValidVideo = 
        hexSignature.startsWith('000000') || 
        hexSignature.startsWith('1a45dfa3') || 
        hexSignature.startsWith('464c5601') || 
        hexSignature.startsWith('3026b2758e66cf11a6d900aa0062ce6c'); 
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Serving video ${imageId}:`, {
          mimeType: image.mimeType,
          size: buffer.length,
          bufferLength: buffer.length,
          isValidVideoSignature: isValidVideo,
        });
      }
      
      
      if (buffer.length < 100) {
        console.error(`ERROR: Video ${imageId} buffer is too small (${buffer.length} bytes). Video is likely corrupted.`);
        return NextResponse.json(
          { 
            error: 'Video file appears to be corrupted or empty.',
            imageId,
            bufferSize: buffer.length,
          },
          { status: 500 }
        );
      }
      
      
      if (!isValidVideo && buffer.length > 0) {
        console.warn(`WARNING: Video ${imageId} has unexpected file signature. First bytes: ${hexSignature}. Attempting to serve anyway - browser will validate.`);
        
      }
      
      
      const expectedSize = (image as any).size || 0;
      const CHUNK_SIZE = 4 * 1024 * 1024; 
      
      
      if (buffer.length === CHUNK_SIZE && expectedSize > CHUNK_SIZE) {
        console.error(`ERROR: Video ${imageId} is exactly ${CHUNK_SIZE} bytes (one chunk) but expected size is ${expectedSize}. Video is incomplete - only first chunk was stored.`);
        return NextResponse.json(
          { 
            error: 'Video file is incomplete. Only the first chunk (4MB) was stored. The full video file was not properly uploaded.',
            imageId,
            expectedSize,
            actualSize: buffer.length,
            suggestion: 'This video was uploaded using the old chunked system and failed to complete. Please delete this video and re-upload it using the new Vercel Blob system.'
          },
          { status: 500 }
        );
      }
      
      
      if (expectedSize > 0 && Math.abs(buffer.length - expectedSize) > 1024 * 1024) {
        console.warn(`WARNING: Video ${imageId} buffer size (${buffer.length}) doesn't match expected size (${expectedSize}). Difference: ${Math.abs(buffer.length - expectedSize)} bytes. Continuing anyway.`);
        
      }
    }
    
    
    if (isVideo) {
      
      if (request.method === 'HEAD') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Content-Type': image.mimeType || 'video/mp4',
            'Content-Length': buffer.length.toString(),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
          },
        });
      }
      
      if (range) {
        
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : buffer.length - 1;
        const chunkSize = (end - start) + 1;
        const chunk = buffer.slice(start, end + 1);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Range request for video ${imageId}: ${start}-${end}/${buffer.length}`);
        }
        
        return new NextResponse(new Uint8Array(chunk), {
          status: 206, // Partial Content
          headers: {
            'Content-Range': `bytes ${start}-${end}/${buffer.length}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkSize.toString(),
            'Content-Type': image.mimeType || 'video/mp4',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
          },
        });
      } else {
        
        
        
        
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': image.mimeType || 'video/mp4',
            'Content-Length': buffer.length.toString(),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD',
            'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
          },
        });
      }
    }
    
    
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': image.mimeType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
        'Accept-Ranges': 'none',
        'Cache-Control': 'public, max-age=31536000, immutable',
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

