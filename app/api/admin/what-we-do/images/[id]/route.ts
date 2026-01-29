import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { whatWeDoImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';


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
      .update(whatWeDoImages)
      .set({
        image: typeof image === 'string' ? image.trim() : image,
        alt: alt?.trim() || 'What we do image',
        displayOrder: displayOrder ?? 0,
      })
      .where(eq(whatWeDoImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
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
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    await db.delete(whatWeDoImages).where(eq(whatWeDoImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

