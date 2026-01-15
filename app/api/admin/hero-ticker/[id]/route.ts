import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroTickerItems } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// PUT /api/admin/hero-ticker/[id] - Update a hero ticker item
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { text, displayOrder } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    await db
      .update(heroTickerItems)
      .set({
        text: text.trim(),
        displayOrder: displayOrder ?? 0,
      })
      .where(eq(heroTickerItems.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating hero ticker item:', error);
    return NextResponse.json(
      { error: 'Failed to update hero ticker item' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/hero-ticker/[id] - Delete a hero ticker item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request);
    const { id } = await params;

    await db.delete(heroTickerItems).where(eq(heroTickerItems.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting hero ticker item:', error);
    return NextResponse.json(
      { error: 'Failed to delete hero ticker item' },
      { status: 500 }
    );
  }
}

