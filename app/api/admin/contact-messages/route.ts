import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { contactMessages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { desc } from 'drizzle-orm';

// GET /api/admin/contact-messages - Get all contact messages
export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    
    // Parse created_at directly as Philippine time (UTC+8)
    // The database stores timestamps like "2026-01-15 16:31:15" which are already in PH time
    const serializedMessages = messages.map(msg => {
      // Handle createdAt - parse as Philippine time
      let createdAtISO: string;
      if (msg.createdAt instanceof Date) {
        // If it's already a Date object, use it directly but ensure proper timezone handling
        // Convert PH time Date to ISO by subtracting 8 hours offset
        const phDate = new Date(msg.createdAt.getTime() - (8 * 60 * 60 * 1000));
        createdAtISO = phDate.toISOString();
      } else {
        const createdAtStr = String(msg.createdAt || '').trim();
        // If it's MySQL datetime format "YYYY-MM-DD HH:MM:SS" without timezone
        // Treat it as Philippine time (UTC+8) by appending the offset
        if (createdAtStr && createdAtStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          // Parse as PH time: "2026-01-15 16:31:15" -> "2026-01-15T16:31:15+08:00"
          const dateStr = createdAtStr.replace(' ', 'T') + '+08:00';
          const date = new Date(dateStr);
          createdAtISO = date.toISOString(); // This will convert PH time to UTC ISO
        } else if (createdAtStr.includes('T') || createdAtStr.includes('Z') || createdAtStr.includes('+')) {
          // Already has timezone info or is ISO format
          const date = new Date(createdAtStr);
          createdAtISO = date.toISOString();
        } else {
          // Fallback
          createdAtISO = new Date(createdAtStr || new Date()).toISOString();
        }
      }
      
      // Handle updatedAt the same way
      let updatedAtISO: string;
      if (msg.updatedAt instanceof Date) {
        const phDate = new Date(msg.updatedAt.getTime() - (8 * 60 * 60 * 1000));
        updatedAtISO = phDate.toISOString();
      } else {
        const updatedAtStr = String(msg.updatedAt || '').trim();
        if (updatedAtStr && updatedAtStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          const dateStr = updatedAtStr.replace(' ', 'T') + '+08:00';
          const date = new Date(dateStr);
          updatedAtISO = date.toISOString();
        } else if (updatedAtStr.includes('T') || updatedAtStr.includes('Z') || updatedAtStr.includes('+')) {
          const date = new Date(updatedAtStr);
          updatedAtISO = date.toISOString();
        } else {
          updatedAtISO = new Date(updatedAtStr || new Date()).toISOString();
        }
      }
      
      return {
        ...msg,
        createdAt: createdAtISO,
        updatedAt: updatedAtISO,
      };
    });
    
    return NextResponse.json(serializedMessages);
  } catch (error: any) {
    console.error('Error fetching contact messages:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch messages';
    if (error?.code === 'ER_CON_COUNT_ERROR' || error?.sqlMessage?.includes('Too many connections') || error?.message?.includes('No connections available')) {
      errorMessage = 'Database connection limit reached. Please try again in a moment.';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      errorMessage = 'Database connection failed. Please check your database configuration.';
    } else if (error?.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          code: error?.code,
        })
      },
      { status: 500 }
    );
  }
}

