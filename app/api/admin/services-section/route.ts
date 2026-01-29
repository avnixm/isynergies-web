import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { servicesSection } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

const DEFAULT_TITLE = 'Our Services';
const DEFAULT_DESCRIPTION = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed consequat quam. Sed vel lorem finibus enim consectetur eleifend sit amet vel neque.';

export async function GET() {
  try {
    const [row] = await db.select().from(servicesSection).limit(1);
    if (!row) {
      return NextResponse.json({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      });
    }
    return NextResponse.json({
      title: (row as { title?: string }).title ?? DEFAULT_TITLE,
      description: (row as { description?: string }).description ?? DEFAULT_DESCRIPTION,
    });
  } catch (error) {
    console.error('Error fetching services section:', error);
    return NextResponse.json({ error: 'Failed to fetch services section' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title : 'Our Services';
    const description = typeof body?.description === 'string' ? body.description : '';

    const [existing] = await db.select().from(servicesSection).limit(1);
    if (existing) {
      await db
        .update(servicesSection)
        .set({ title, description })
        .where(eq(servicesSection.id, existing.id));
    } else {
      await db.insert(servicesSection).values({ title, description });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating services section:', error);
    return NextResponse.json({ error: 'Failed to update services section' }, { status: 500 });
  }
}
