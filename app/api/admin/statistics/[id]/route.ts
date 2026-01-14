import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { statistics } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    await db.update(statistics).set(body).where(eq(statistics.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating statistic:', error);
    return NextResponse.json({ error: 'Failed to update statistic' }, { status: 500 });
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
    await db.delete(statistics).where(eq(statistics.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting statistic:', error);
    return NextResponse.json({ error: 'Failed to delete statistic' }, { status: 500 });
  }
}

