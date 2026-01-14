import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { statistics } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const stats = await db.select().from(statistics).orderBy(asc(statistics.displayOrder));
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const [newStat] = await db.insert(statistics).values(body).$returningId();
    return NextResponse.json({ success: true, id: newStat.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating statistic:', error);
    return NextResponse.json({ error: 'Failed to create statistic' }, { status: 500 });
  }
}

