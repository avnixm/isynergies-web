import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { images } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

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

    // Convert base64 back to buffer
    const buffer = Buffer.from(image.data, 'base64');

    // Return image with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': image.mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
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

