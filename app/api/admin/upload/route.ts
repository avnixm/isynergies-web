import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images, imageChunks } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { sql } from 'drizzle-orm';
import { eq, asc } from 'drizzle-orm';

// Increase max duration for large file uploads (videos can be very large)
// Note: Vercel hobby plan max is 300 seconds (5 minutes)
export const maxDuration = 300; // 5 minutes (max for Vercel hobby plan)
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

    // Validate file type (allow both images and videos)
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 });
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
      let result: { id: number }[];
      try {
        result = await db.insert(images).values({
          filename,
          mimeType: file.type,
          size: file.size,
          data: '', // Empty for chunked images
          isChunked: 1,
          chunkCount: Math.ceil(base64Length / CHUNK_SIZE),
        }).$returningId();
      } catch (insertError: any) {
        console.error('Error inserting image record:', insertError);
        throw new Error(`Failed to create image record: ${insertError.message || insertError.sqlMessage || 'Unknown error'}`);
      }

      // $returningId() returns an array, so we need to access the first element
      const imageId = result[0]?.id;
      if (!imageId) {
        console.error('No ID returned from insert:', result);
        throw new Error('Failed to get image ID from database');
      }

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
      try {
        for (const chunk of chunks) {
          await db.insert(imageChunks).values({
            imageId: chunk.imageId,
            chunkIndex: chunk.chunkIndex,
            data: chunk.data,
          });
        }
      } catch (chunkError: any) {
        console.error('Error inserting chunks:', chunkError);
        // Try to clean up the main image record if chunk insertion fails
        try {
          await db.delete(images).where(eq(images.id, imageId));
        } catch (cleanupError) {
          console.error('Error cleaning up failed image record:', cleanupError);
        }
        throw new Error(`Failed to save file chunks: ${chunkError.message || chunkError.sqlMessage || 'Unknown error'}`);
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
      let result: { id: number }[];
      try {
        result = await db.insert(images).values({
          filename,
          mimeType: file.type,
          size: file.size,
          data: base64Data,
          isChunked: 0,
          chunkCount: 0,
        }).$returningId();
      } catch (insertError: any) {
        console.error('Error inserting image record:', insertError);
        throw new Error(`Failed to save image: ${insertError.message || insertError.sqlMessage || 'Unknown error'}`);
      }

      // $returningId() returns an array, so we need to access the first element
      const imageId = result[0]?.id;
      if (!imageId) {
        console.error('No ID returned from insert:', result);
        throw new Error('Failed to get image ID from database');
      }

      // Return image ID as URL
      const url = `/api/images/${imageId}`;

      return NextResponse.json({ 
        url, 
        filename,
        id: imageId 
      }, { status: 200 });
    }
  } catch (error: any) {
    // Log comprehensive error details
    console.error('Upload error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload file';
    if (error.code === 'ECONNRESET') {
      errorMessage = 'Connection was reset during upload. Please try again.';
    } else if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      errorMessage = 'Upload timed out. Please try again.';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.code === 'ENOTFOUND') {
      errorMessage = 'Database connection failed. Please check your database configuration.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Database table not found. Please run database migrations.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection refused. Please check your database is running and accessible.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database does not exist. Please check your database name.';
    } else if (error.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Always return the error message, even in production
    return NextResponse.json(
      { 
        error: errorMessage,
        code: error?.code,
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          sqlMessage: error?.sqlMessage,
        })
      },
      { status: 500 }
    );
  }
}
