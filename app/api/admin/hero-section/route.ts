import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroSection } from '@/app/db/schema';

// GET /api/admin/hero-section - Get hero section content
export async function GET() {
  try {
    const content = await db.select().from(heroSection).limit(1);
    
    // If no content exists, return default
    if (content.length === 0) {
      return NextResponse.json({
        id: 1,
        weMakeItLogo: null,
        isLogo: null,
        fullLogo: null,
        backgroundImage: null,
      });
    }
    
    return NextResponse.json(content[0]);
  } catch (error) {
    console.error('Error fetching hero section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero section' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/hero-section - Update hero section content
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { weMakeItLogo, isLogo, fullLogo, backgroundImage } = body;

    // Check if record exists
    const existing = await db.select().from(heroSection).limit(1);

    if (existing.length === 0) {
      // Create new record
      await db.insert(heroSection).values({
        weMakeItLogo,
        isLogo,
        fullLogo,
        backgroundImage,
      });
    } else {
      // Update existing record (there should only be one)
      await db
        .update(heroSection)
        .set({
          weMakeItLogo,
          isLogo,
          fullLogo,
          backgroundImage,
        });
    }

    const updated = await db.select().from(heroSection).limit(1);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json(
      { error: 'Failed to update hero section' },
      { status: 500 }
    );
  }
}

