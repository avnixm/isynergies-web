import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { teamGroups, teamMembers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc, eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [groupsRows, membersRows] = await Promise.all([
      db.select().from(teamGroups).orderBy(asc(teamGroups.displayOrder)),
      db.select().from(teamMembers).orderBy(asc(teamMembers.displayOrder)),
    ]);

    const featured = membersRows.find((m) => m.isFeatured);
    const featuredMemberId = featured?.id ?? null;

    const groups = groupsRows.map((g) => ({
      id: g.id,
      name: g.name,
      displayOrder: g.displayOrder,
      members: membersRows
        .filter((m) => m.groupId === g.id)
        .sort((a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0)),
    }));

    const ungrouped = membersRows
      .filter((m) => m.groupId == null)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return NextResponse.json({
      featuredMemberId,
      groups,
      ungrouped,
    });
  } catch (error) {
    console.error('Error fetching team groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team groups' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { name, displayOrder } = body as { name: string; displayOrder: number };

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    if (typeof displayOrder !== 'number') {
      return NextResponse.json(
        { error: 'displayOrder is required and must be a number' },
        { status: 400 }
      );
    }

    const [newGroup] = await db
      .insert(teamGroups)
      .values({ name: name.trim(), displayOrder })
      .$returningId();
    return NextResponse.json({ success: true, id: newGroup.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating team group:', error);
    return NextResponse.json(
      { error: 'Failed to create team group' },
      { status: 500 }
    );
  }
}
