import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroTickerItems } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';


export async function GET() {
  try {
    const items = await db.select().from(heroTickerItems).orderBy(asc(heroTickerItems.displayOrder));
    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error fetching hero ticker items:', error);
    
    return NextResponse.json([], { status: 200 });
  }
}


export async function POST(request: Request) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { text, displayOrder } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const result = await db.insert(heroTickerItems).values({
      text: text.trim(),
      displayOrder: displayOrder ?? 0,
    });

    
    const insertId = Array.isArray(result) && result.length > 0 && (result[0] as any).insertId 
      ? (result[0] as any).insertId 
      : null;

    return NextResponse.json({ success: true, id: insertId }, { status: 201 });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating hero ticker item:', error);
    return NextResponse.json(
      { error: 'Failed to create hero ticker item' },
      { status: 500 }
    );
  }
}

