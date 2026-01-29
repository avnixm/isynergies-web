import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { servicesSection } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { ensureServicesTables } from '@/app/lib/ensure-services-tables';
import { eq } from 'drizzle-orm';

const DEFAULT_TITLE = '';
const DEFAULT_DESCRIPTION = '';

function isNoSuchTable(e: unknown): boolean {
  const err = e as { errno?: number; code?: string };
  return err?.errno === 1146 || err?.code === 'ER_NO_SUCH_TABLE';
}

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
    if (isNoSuchTable(error)) {
      await ensureServicesTables();
      const [row] = await db.select().from(servicesSection).limit(1);
      if (!row) {
        return NextResponse.json({ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION });
      }
      return NextResponse.json({
        title: (row as { title?: string }).title ?? DEFAULT_TITLE,
        description: (row as { description?: string }).description ?? DEFAULT_DESCRIPTION,
      });
    }
    console.error('Error fetching services section:', error);
    return NextResponse.json({ error: 'Failed to fetch services section' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const title = typeof body?.title === 'string' ? body.title : '';
  const description = typeof body?.description === 'string' ? body.description : '';

  try {
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
    if (isNoSuchTable(error)) {
      await ensureServicesTables();
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
    }
    console.error('Error updating services section:', error);
    return NextResponse.json({ error: 'Failed to update services section' }, { status: 500 });
  }
}
