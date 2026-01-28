import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { teamMembers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq, inArray } from 'drizzle-orm';

type MemberSlot = { memberId: number; groupOrder: number };

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
    const { members } = body as { members?: MemberSlot[] };

    if (!Array.isArray(members)) {
      return NextResponse.json(
        { error: 'members must be an array of { memberId, groupOrder }' },
        { status: 400 }
      );
    }

    // Validate: memberId numbers, groupOrder numbers, no duplicate groupOrder in this list
    const orderSet = new Set<number>();
    for (const row of members) {
      if (
        typeof row?.memberId !== 'number' ||
        typeof row?.groupOrder !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Each member must have memberId and groupOrder as numbers' },
          { status: 400 }
        );
      }
      if (orderSet.has(row.groupOrder)) {
        return NextResponse.json(
          {
            error: `Duplicate groupOrder ${row.groupOrder} in the same group`,
          },
          { status: 400 }
        );
      }
      orderSet.add(row.groupOrder);
    }

    const memberIds = members.map((m) => m.memberId);
    if (memberIds.length === 0) {
      // Clear group membership
      await db
        .update(teamMembers)
        .set({ groupId: null, groupOrder: null })
        .where(eq(teamMembers.groupId, groupId));
      return NextResponse.json({ success: true });
    }

    // Validate: every memberId exists
    const existing = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(inArray(teamMembers.id, memberIds));
    const existingIds = new Set(existing.map((r) => r.id));
    const missing = memberIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Member(s) not found: ${missing.join(', ')}` },
        { status: 404 }
      );
    }

    // Apply: set groupId/groupOrder for each member in the list
    for (const { memberId, groupOrder } of members) {
      await db
        .update(teamMembers)
        .set({ groupId, groupOrder })
        .where(eq(teamMembers.id, memberId));
    }

    // Unassign any member currently in this group but not in the list
    const idsInList = new Set(memberIds);
    const currentInGroup = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(eq(teamMembers.groupId, groupId));
    for (const row of currentInGroup) {
      if (!idsInList.has(row.id)) {
        await db
          .update(teamMembers)
          .set({ groupId: null, groupOrder: null })
          .where(eq(teamMembers.id, row.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating group members:', error);
    return NextResponse.json(
      { error: 'Failed to update group members' },
      { status: 500 }
    );
  }
}
