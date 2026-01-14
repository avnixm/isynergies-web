import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { teamMembers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const members = await db.select().from(teamMembers).orderBy(asc(teamMembers.displayOrder));
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const [newMember] = await db.insert(teamMembers).values(body).$returningId();
    return NextResponse.json({ success: true, id: newMember.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}

