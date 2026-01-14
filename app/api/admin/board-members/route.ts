import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { boardMembers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

// GET all board members
export async function GET(request: Request) {
  try {
    const members = await db
      .select()
      .from(boardMembers)
      .orderBy(asc(boardMembers.displayOrder));

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching board members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board members' },
      { status: 500 }
    );
  }
}

// POST create new board member
export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { firstName, lastName, position, image, displayOrder } = body;

    if (!firstName || !lastName || !position || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [newMember] = await db
      .insert(boardMembers)
      .values({
        firstName,
        lastName,
        position,
        image,
        displayOrder: displayOrder || 0,
      })
      .$returningId();

    return NextResponse.json(
      { success: true, id: newMember.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating board member:', error);
    return NextResponse.json(
      { error: 'Failed to create board member' },
      { status: 500 }
    );
  }
}

