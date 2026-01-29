import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { shopCategories } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';


export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { name, text, image, displayOrder } = body;

    const [newCategory] = await db.insert(shopCategories).values({
      name: name || 'New Category',
      text: text || 'NEW CATEGORY',
      image: image || '',
      displayOrder: displayOrder || 0,
    });

    return NextResponse.json({ success: true, id: newCategory.insertId });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

