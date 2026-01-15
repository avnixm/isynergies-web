import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppCarouselImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// PUT update carousel image
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { image, alt, displayOrder } = body;
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    if (!image || (typeof image === 'string' && image.trim() === '')) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    await db
      .update(featuredAppCarouselImages)
      .set({
        image: typeof image === 'string' ? image.trim() : image,
        alt: alt?.trim() || 'Featured app carousel image',
        displayOrder: displayOrder ?? 0,
      })
      .where(eq(featuredAppCarouselImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

// DELETE carousel image
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    await db.delete(featuredAppCarouselImages).where(eq(featuredAppCarouselImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

