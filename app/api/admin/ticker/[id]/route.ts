import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { tickerItems } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const id = parseInt(params.id);

    await db
      .update(tickerItems)
      .set(body)
      .where(eq(tickerItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ticker item:', error);
    return NextResponse.json({ error: 'Failed to update ticker item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const id = parseInt(params.id);
    await db.delete(tickerItems).where(eq(tickerItems.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticker item:', error);
    return NextResponse.json({ error: 'Failed to delete ticker item' }, { status: 500 });
  }
}

