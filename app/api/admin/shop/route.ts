import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { shopContent, shopCategories } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc, eq } from 'drizzle-orm';

// GET shop content and categories
export async function GET() {
  try {
    const [content] = await db.select().from(shopContent).limit(1);
    const categories = await db.select().from(shopCategories).orderBy(asc(shopCategories.displayOrder));
    
    return NextResponse.json({ content, categories });
  } catch (error) {
    console.error('Error fetching shop data:', error);
    return NextResponse.json({ error: 'Failed to fetch shop data' }, { status: 500 });
  }
}

// PUT update shop content and categories
export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { content, categories } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Update or create shop content
    const [existing] = await db.select().from(shopContent).limit(1);
    if (existing) {
      await db.update(shopContent).set({
        title: content.title,
        description: content.description,
        salesIcon: content.salesIcon,
        authorizedDealerImage: content.authorizedDealerImage,
      }).where(eq(shopContent.id, existing.id));
    } else {
      await db.insert(shopContent).values({
        title: content.title,
        description: content.description,
        salesIcon: content.salesIcon || null,
        authorizedDealerImage: content.authorizedDealerImage || null,
      });
    }

    // Update categories if provided
    if (categories && Array.isArray(categories)) {
      for (const category of categories) {
        await db.update(shopCategories).set({
          name: category.name,
          text: category.text || category.name.toUpperCase(),
          image: category.image,
          displayOrder: category.displayOrder,
        }).where(eq(shopCategories.id, category.id));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating shop:', error);
    return NextResponse.json({ error: 'Failed to update shop', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

