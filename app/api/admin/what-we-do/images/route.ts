import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { whatWeDoImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

// GET all images
export async function GET() {
  try {
    const images = await db
      .select()
      .from(whatWeDoImages)
      .orderBy(asc(whatWeDoImages.displayOrder));
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

// POST create new image
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

    const result = await db.insert(whatWeDoImages).values({
      image: typeof image === 'string' ? image.trim() : image,
      alt: alt?.trim() || 'What we do image',
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
    console.error('Error creating image:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}

