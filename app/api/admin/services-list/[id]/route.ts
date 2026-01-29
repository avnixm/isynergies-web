import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { servicesList } from '@/app/db/schema';
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
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    await db
      .update(servicesList)
      .set(body)
      .where(eq(servicesList.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating services list item:', error);
    return NextResponse.json({ error: 'Failed to update services list item' }, { status: 500 });
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
    await db.delete(servicesList).where(eq(servicesList.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting services list item:', error);
    return NextResponse.json({ error: 'Failed to delete services list item' }, { status: 500 });
  }
}
