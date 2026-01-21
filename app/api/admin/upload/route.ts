import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';

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

    // Insert into database
    const [result] = await db.insert(images).values({
      filename,
      mimeType: file.type,
      size: file.size,
      data: base64Data,
    }).$returningId();

    // Return image ID as URL
    const url = `/api/images/${result.id}`;

    return NextResponse.json({ 
      url, 
      filename,
      id: result.id 
    }, { status: 200 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
