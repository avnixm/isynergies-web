import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppCarouselImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

// GET all carousel images
export async function GET() {
  try {
    const images = await db
      .select()
      .from(featuredAppCarouselImages)
      .orderBy(asc(featuredAppCarouselImages.displayOrder));
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST create new carousel image
export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { image, alt, displayOrder } = body;

    if (!image || (typeof image === 'string' && image.trim() === '')) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const result = await db.insert(featuredAppCarouselImages).values({
      image: typeof image === 'string' ? image.trim() : image,
      alt: alt?.trim() || 'Featured app carousel image',
      displayOrder: displayOrder ?? 0,
    });

    const insertId = Array.isArray(result) && result.length > 0 && (result[0] as any).insertId
      ? (result[0] as any).insertId
      : null;

    return NextResponse.json({ success: true, id: insertId }, { status: 201 });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}

