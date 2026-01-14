import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { services } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const allServices = await db.select().from(services).orderBy(asc(services.displayOrder));
    return NextResponse.json(allServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const [newService] = await db.insert(services).values(body).$returningId();
    return NextResponse.json({ success: true, id: newService.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}

