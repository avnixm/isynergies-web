import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { contactMessages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { desc } from 'drizzle-orm';

// GET /api/admin/contact-messages - Get all contact messages
export async function GET() {
  try {
    const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    
    // Ensure dates are properly serialized as ISO strings
    const serializedMessages = messages.map(msg => ({
      ...msg,
      createdAt: msg.createdAt instanceof Date 
        ? msg.createdAt.toISOString() 
        : typeof msg.createdAt === 'string' 
          ? msg.createdAt 
          : new Date(msg.createdAt as any).toISOString(),
      updatedAt: msg.updatedAt instanceof Date 
        ? msg.updatedAt.toISOString() 
        : typeof msg.updatedAt === 'string' 
          ? msg.updatedAt 
          : new Date(msg.updatedAt as any).toISOString(),
    }));
    
    return NextResponse.json(serializedMessages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

