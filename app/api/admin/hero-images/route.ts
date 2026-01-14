import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroImages } from '@/app/db/schema';
import { eq, asc } from 'drizzle-orm';

// GET /api/admin/hero-images - Get all hero images
export async function GET() {
  try {
    const images = await db.select().from(heroImages).orderBy(asc(heroImages.displayOrder));
    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching hero images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero images' },
      { status: 500 }
    );
  }
}

// POST /api/admin/hero-images - Create a new hero image
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, alt, displayOrder } = body;

    // Allow empty image (placeholder), but require alt and displayOrder
    if (alt === undefined || displayOrder === undefined) {
      return NextResponse.json(
        { error: 'Alt and displayOrder are required' },
        { status: 400 }
      );
    }

    const result = await db.insert(heroImages).values({
      image: image || '',
      alt,
      displayOrder,
    });

    return NextResponse.json(
      { message: 'Hero image created successfully', id: result[0].insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating hero image:', error);
    return NextResponse.json(
      { error: 'Failed to create hero image' },
      { status: 500 }
    );
  }
}

