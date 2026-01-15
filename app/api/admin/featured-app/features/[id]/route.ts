import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppFeatures } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// PUT update feature
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return NextResponse.json(
        { error: 'Invalid feature ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { iconImage, label, displayOrder } = body;

    if (!iconImage || !label) {
      return NextResponse.json(
        { error: 'Icon image and label are required' },
        { status: 400 }
      );
    }

    await db
      .update(featuredAppFeatures)
      .set({
        iconImage: iconImage.trim(),
        label: label.trim(),
        displayOrder: displayOrder ?? 0,
      })
      .where(eq(featuredAppFeatures.id, featureId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating featured app feature:', error);
    return NextResponse.json(
      { error: 'Failed to update feature' },
      { status: 500 }
    );
  }
}

// DELETE feature
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const featureId = parseInt(id);

    if (isNaN(featureId)) {
      return NextResponse.json(
        { error: 'Invalid feature ID' },
        { status: 400 }
      );
    }

    await db.delete(featuredAppFeatures).where(eq(featuredAppFeatures.id, featureId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting featured app feature:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature' },
      { status: 500 }
    );
  }
}

