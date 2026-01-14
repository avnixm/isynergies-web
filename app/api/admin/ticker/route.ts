import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { tickerItems } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const items = await db.select().from(tickerItems).orderBy(asc(tickerItems.displayOrder));
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching ticker items:', error);
    return NextResponse.json({ error: 'Failed to fetch ticker items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const [newItem] = await db.insert(tickerItems).values(body).$returningId();
    return NextResponse.json({ success: true, id: newItem.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating ticker item:', error);
    return NextResponse.json({ error: 'Failed to create ticker item' }, { status: 500 });
  }
}

