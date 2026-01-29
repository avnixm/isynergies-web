import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    const [image] = await db
      .select()
      .from(heroImages)
      .where(eq(heroImages.id, imageId))
      .limit(1);

    if (!image) {
      return NextResponse.json({ error: 'Hero image not found' }, { status: 404 });
    }

    return NextResponse.json(image);
  } catch (error: any) {
    console.error('Error fetching hero image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch hero image' },
      { status: 500 }
    );
  }
}


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const imageId = parseInt(id);
    const body = await request.json();
    const { image, alt, displayOrder } = body;

    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    await db
      .update(heroImages)
      .set({
        image: image !== undefined ? image : undefined,
        alt: alt !== undefined ? alt : undefined,
        displayOrder: displayOrder !== undefined ? displayOrder : undefined,
      })
      .where(eq(heroImages.id, imageId));

    const [updated] = await db
      .select()
      .from(heroImages)
      .where(eq(heroImages.id, imageId))
      .limit(1);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating hero image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update hero image' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const imageId = parseInt(id);

    if (isNaN(imageId)) {
      return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });
    }

    await db.delete(heroImages).where(eq(heroImages.id, imageId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting hero image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete hero image' },
      { status: 500 }
    );
  }
}
