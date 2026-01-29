import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { boardSettings } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';


export async function GET() {
  try {
    const [settings] = await db.select().from(boardSettings).limit(1);
    
    if (!settings) {
      return NextResponse.json({
        footerText: "iSynergies Inc.'s elected Board of Directors for the year 2025 - 2026",
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching board settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch board settings' },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { footerText } = body;

    const [existing] = await db.select().from(boardSettings).limit(1);

    if (existing) {
      await db.update(boardSettings).set({ footerText });
    } else {
      await db.insert(boardSettings).values({ footerText });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating board settings:', error);
    return NextResponse.json(
      { error: 'Failed to update board settings' },
      { status: 500 }
    );
  }
}

