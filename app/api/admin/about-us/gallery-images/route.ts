import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { aboutUsGalleryImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(aboutUsGalleryImages)
      .orderBy(asc(aboutUsGalleryImages.displayOrder));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching about us gallery images:', error);
    return NextResponse.json({ error: 'Failed to fetch gallery images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const image = (body?.image ?? '').toString();
    const alt = (body?.alt ?? 'About Us gallery image').toString();
    const displayOrder = Number(body?.displayOrder ?? 0);

    if (!image || image.trim() === '') {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const result = await db
      .insert(aboutUsGalleryImages)
      .values({ image, alt, displayOrder });

    // drizzle/mysql returns insertId in different shapes depending on driver;
    // we can just return success and let client refetch.
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error creating about us gallery image:', error);
    return NextResponse.json({ error: 'Failed to create gallery image' }, { status: 500 });
  }
}


