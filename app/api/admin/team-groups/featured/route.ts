import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { teamMembers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const memberId = body?.memberId as number | null | undefined;

    if (memberId === undefined) {
      return NextResponse.json(
        { error: 'memberId is required (use null to clear)' },
        { status: 400 }
      );
    }

    if (memberId === null) {
      await db.update(teamMembers).set({ isFeatured: false });
      return NextResponse.json({ success: true, featuredMemberId: null });
    }

    if (typeof memberId !== 'number') {
      return NextResponse.json(
        { error: 'memberId must be a number or null' },
        { status: 400 }
      );
    }

    const [exists] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.id, memberId))
      .limit(1);
    if (!exists) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    await db.update(teamMembers).set({ isFeatured: false });
    await db
      .update(teamMembers)
      .set({ isFeatured: true })
      .where(eq(teamMembers.id, memberId));

    return NextResponse.json({
      success: true,
      featuredMemberId: memberId,
    });
  } catch (error) {
    console.error('Error setting featured member:', error);
    return NextResponse.json(
      { error: 'Failed to set featured member' },
      { status: 500 }
    );
  }
}
