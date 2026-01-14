import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { boardMembers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// GET single board member
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [member] = await db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.id, parseInt(id)))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: 'Board member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching board member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board member' },
      { status: 500 }
    );
  }
}

// PUT update board member
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, position, image, displayOrder } = body;

    await db
      .update(boardMembers)
      .set({
        firstName,
        lastName,
        position,
        image,
        displayOrder,
      })
      .where(eq(boardMembers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating board member:', error);
    return NextResponse.json(
      { error: 'Failed to update board member' },
      { status: 500 }
    );
  }
}

// DELETE board member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    await db
      .delete(boardMembers)
      .where(eq(boardMembers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board member:', error);
    return NextResponse.json(
      { error: 'Failed to delete board member' },
      { status: 500 }
    );
  }
}

