import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppFeatures, featuredApp } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq, asc } from 'drizzle-orm';

// GET all features for the featured app
export async function GET() {
  try {
    // Get the featured app ID (assuming there's only one featured app)
    const [featuredAppRecord] = await db.select().from(featuredApp).limit(1);
    
    if (!featuredAppRecord) {
      return NextResponse.json([]);
    }

    const features = await db
      .select()
      .from(featuredAppFeatures)
      .where(eq(featuredAppFeatures.featuredAppId, featuredAppRecord.id))
      .orderBy(asc(featuredAppFeatures.displayOrder));

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching featured app features:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

// POST create new feature
export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { iconImage, label, displayOrder } = body;


    if (!iconImage || (typeof iconImage === 'string' && iconImage.trim() === '')) {
      return NextResponse.json(
        { error: 'Icon image is required' },
        { status: 400 }
      );
    }

    if (!label || (typeof label === 'string' && label.trim() === '')) {
      return NextResponse.json(
        { error: 'Label is required' },
        { status: 400 }
      );
    }

    // Get the featured app ID (assuming there's only one featured app)
    const [featuredAppRecord] = await db.select().from(featuredApp).limit(1);
    
    if (!featuredAppRecord) {
      return NextResponse.json(
        { error: 'Featured app not found' },
        { status: 404 }
      );
    }

    const result = await db.insert(featuredAppFeatures).values({
      featuredAppId: featuredAppRecord.id,
      iconImage: typeof iconImage === 'string' ? iconImage.trim() : String(iconImage),
      label: typeof label === 'string' ? label.trim() : String(label),
      displayOrder: displayOrder ?? 0,
    });

    const insertId = Array.isArray(result) && result.length > 0 && (result[0] as any).insertId
      ? (result[0] as any).insertId
      : null;

    return NextResponse.json({ success: true, id: insertId }, { status: 201 });
  } catch (error) {
    console.error('Error creating featured app feature:', error);
    return NextResponse.json(
      { error: 'Failed to create feature' },
      { status: 500 }
    );
  }
}

