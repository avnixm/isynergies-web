import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { teamGroups, teamMembers } from '@/app/db/schema';
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
    const groupId = parseInt(id, 10);
    if (Number.isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group id' }, { status: 400 });
    }

    const body = await request.json();
    const { name, displayOrder } = body as {
      name?: string;
      displayOrder?: number;
    };

    const updates: { name?: string; displayOrder?: number } = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'name must be a non-empty string' },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (displayOrder !== undefined) {
      if (typeof displayOrder !== 'number') {
        return NextResponse.json(
          { error: 'displayOrder must be a number' },
          { status: 400 }
        );
      }
      updates.displayOrder = displayOrder;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true });
    }

    await db.update(teamGroups).set(updates).where(eq(teamGroups.id, groupId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating team group:', error);
    return NextResponse.json(
      { error: 'Failed to update team group' },
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
    const groupId = parseInt(id, 10);
    if (Number.isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group id' }, { status: 400 });
    }

    
    await db
      .update(teamMembers)
      .set({ groupId: null, groupOrder: null })
      .where(eq(teamMembers.groupId, groupId));

    await db.delete(teamGroups).where(eq(teamGroups.id, groupId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team group:', error);
    return NextResponse.json(
      { error: 'Failed to delete team group' },
      { status: 500 }
    );
  }
}
