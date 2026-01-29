import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { servicesList } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const items = await db.select().from(servicesList).orderBy(asc(servicesList.displayOrder));
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching services list:', error);
    return NextResponse.json({ error: 'Failed to fetch services list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const [newItem] = await db.insert(servicesList).values(body).$returningId();
    return NextResponse.json({ success: true, id: newItem.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating services list item:', error);
    return NextResponse.json({ error: 'Failed to create services list item' }, { status: 500 });
  }
}
