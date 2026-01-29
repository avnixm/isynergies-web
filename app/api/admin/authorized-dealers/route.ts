import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/db';
import { authorizedDealers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const dealers = await db.select().from(authorizedDealers).orderBy(asc(authorizedDealers.displayOrder));
    return NextResponse.json(dealers);
  } catch (error: any) {
    
    if (error?.code === 'ER_NO_SUCH_TABLE' || error?.message?.includes('doesn\'t exist')) {
      console.warn('Authorized dealers table does not exist yet. Run migration first.');
      return NextResponse.json([]);
    }
    console.error('Error fetching authorized dealers:', error);
    return NextResponse.json({ error: 'Failed to fetch authorized dealers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { name, image, displayOrder } = body;

    if (!name || !image) {
      return NextResponse.json({ error: 'Name and image are required' }, { status: 400 });
    }

    try {
      const result = await db.insert(authorizedDealers).values({
        name,
        image,
        displayOrder: displayOrder ?? 0,
      });

      
      const insertId = Array.isArray(result) && result.length > 0 && (result[0] as any).insertId 
        ? (result[0] as any).insertId 
        : null;

      return NextResponse.json({ success: true, id: insertId, name, image, displayOrder: displayOrder ?? 0 }, { status: 201 });
    } catch (dbError: any) {
      
      if (dbError?.code === 'ER_NO_SUCH_TABLE' || dbError?.message?.includes('doesn\'t exist')) {
        console.error('Authorized dealers table does not exist. Run migration first.');
        return NextResponse.json({ error: 'Database table does not exist. Please run migration first.' }, { status: 500 });
      }
      throw dbError; 
    }
  } catch (error: any) {
    if (error.status === 401 || error?.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating authorized dealer:', error);
    return NextResponse.json({ error: 'Failed to create authorized dealer' }, { status: 500 });
  }
}
