import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { aboutUsGalleryImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const imageId = Number(id);
    if (!Number.isFinite(imageId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const patch: any = {};

    if (typeof body?.image === 'string') patch.image = body.image;
    if (typeof body?.alt === 'string') patch.alt = body.alt;
    if (body?.displayOrder !== undefined) patch.displayOrder = Number(body.displayOrder);

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await db.update(aboutUsGalleryImages).set(patch).where(eq(aboutUsGalleryImages.id, imageId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating about us gallery image:', error);
    return NextResponse.json({ error: 'Failed to update gallery image' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(_request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const imageId = Number(id);
    if (!Number.isFinite(imageId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await db.delete(aboutUsGalleryImages).where(eq(aboutUsGalleryImages.id, imageId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting about us gallery image:', error);
    return NextResponse.json({ error: 'Failed to delete gallery image' }, { status: 500 });
  }
}


