import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { contactMessages } from '@/app/db/schema';
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
    const { status, adminNotes } = body;
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    await db
      .update(contactMessages)
      .set({ status, adminNotes })
      .where(eq(contactMessages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
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
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}

