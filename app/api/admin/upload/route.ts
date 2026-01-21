import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { sql } from 'drizzle-orm';
import { eq, asc } from 'drizzle-orm';

// Increase max duration for large file uploads
export const maxDuration = 300; // 5 minutes
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Read file as buffer and convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');

    // Generate safe filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;

    // Chunk size: ~2MB base64 data (safe for most MySQL max_allowed_packet settings)
    // Base64 is ~33% larger, so 2MB base64 ≈ 1.5MB raw
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB base64 chunks
    const base64Length = base64Data.length;

    // If the base64 data is larger than chunk size, split it into chunks
    if (base64Length > CHUNK_SIZE) {
      // Create the main image record with chunked flag
      const [result] = await db.insert(images).values({
        filename,
        mimeType: file.type,
        size: file.size,
        data: '', // Empty for chunked images
        isChunked: 1,
        chunkCount: Math.ceil(base64Length / CHUNK_SIZE),
      }).$returningId();

      const imageId = result.id;

      // Split base64 data into chunks
      const chunks: { imageId: number; chunkIndex: number; data: string }[] = [];
      for (let i = 0; i < base64Length; i += CHUNK_SIZE) {
        const chunk = base64Data.substring(i, i + CHUNK_SIZE);
        chunks.push({
          imageId,
          chunkIndex: Math.floor(i / CHUNK_SIZE),
          data: chunk,
        });
      }

      // Insert chunks in batches to avoid overwhelming the database
      for (const chunk of chunks) {
        await db.insert(imageChunks).values({
          imageId: chunk.imageId,
          chunkIndex: chunk.chunkIndex,
          data: chunk.data,
        });
      }

      // Return image ID as URL
      const url = `/api/images/${imageId}`;

      return NextResponse.json({ 
        url, 
        filename,
        id: imageId 
      }, { status: 200 });
    } else {
      // Small file - store directly (non-chunked)
      const [result] = await db.insert(images).values({
        filename,
        mimeType: file.type,
        size: file.size,
        data: base64Data,
        isChunked: 0,
        chunkCount: 0,
      }).$returningId();

      // Return image ID as URL
      const url = `/api/images/${result.id}`;

      return NextResponse.json({ 
        url, 
        filename,
        id: result.id 
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    if (error.code === 'ECONNRESET') {
      errorMessage = 'Connection was reset during upload. Please try again.';
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = 'Upload timed out. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
