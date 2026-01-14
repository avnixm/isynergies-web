import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroImages } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// PUT /api/admin/hero-images/[id] - Update a hero image
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { image, alt, displayOrder } = body;
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await db
      .update(heroImages)
      .set({ image, alt, displayOrder })
      .where(eq(heroImages.id, id));

    return NextResponse.json({ message: 'Hero image updated successfully' });
  } catch (error) {
    console.error('Error updating hero image:', error);
    return NextResponse.json(
      { error: 'Failed to update hero image' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hero-images/[id] - Delete a hero image
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    await db.delete(heroImages).where(eq(heroImages.id, id));
    return NextResponse.json({ message: 'Hero image deleted successfully' });
  } catch (error) {
    console.error('Error deleting hero image:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero image' },
      { status: 500 }
    );
  }
}

