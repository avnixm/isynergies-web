import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { contactMessages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { desc } from 'drizzle-orm';

// GET /api/admin/contact-messages - Get all contact messages
export async function GET() {
  try {
    const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

