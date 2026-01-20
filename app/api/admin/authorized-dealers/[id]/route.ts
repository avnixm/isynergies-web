import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db';
import { authorizedDealers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, image, displayOrder } = body;

    await db
      .update(authorizedDealers)
      .set({
        name,
        image,
        displayOrder,
        updatedAt: new Date(),
      })
      .where(eq(authorizedDealers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating authorized dealer:', error);
    return NextResponse.json({ error: 'Failed to update authorized dealer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await db.delete(authorizedDealers).where(eq(authorizedDealers.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting authorized dealer:', error);
    return NextResponse.json({ error: 'Failed to delete authorized dealer' }, { status: 500 });
  }
}
