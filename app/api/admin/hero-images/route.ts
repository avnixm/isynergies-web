import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq, desc } from 'drizzle-orm';


export async function GET() {
  try {
    const images = await db
      .select()
      .from(heroImages)
      .orderBy(heroImages.displayOrder);
    
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching hero images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero images' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { image, alt, displayOrder } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    const result = await db.insert(heroImages).values({
      image,
      alt: alt || 'Hero image',
      displayOrder: displayOrder || 0,
    }).$returningId();

    const newImage = await db
      .select()
      .from(heroImages)
      .where(eq(heroImages.id, result[0]?.id || 0))
      .limit(1);

    return NextResponse.json(newImage[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating hero image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create hero image' },
      { status: 500 }
    );
  }
}
