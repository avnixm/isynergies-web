import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { contactMessages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { desc } from 'drizzle-orm';


export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
    
    
    
    const serializedMessages = messages.map(msg => {
      
      let createdAtISO: string;
      if (msg.createdAt instanceof Date) {
        
        
        const phDate = new Date(msg.createdAt.getTime() - (8 * 60 * 60 * 1000));
        createdAtISO = phDate.toISOString();
      } else {
        const createdAtStr = String(msg.createdAt || '').trim();
        // If it's MySQL datetime format "YYYY-MM-DD HH:MM:SS" without timezone
        
        if (createdAtStr && createdAtStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          
          const dateStr = createdAtStr.replace(' ', 'T') + '+08:00';
          const date = new Date(dateStr);
          createdAtISO = date.toISOString(); 
        } else if (createdAtStr.includes('T') || createdAtStr.includes('Z') || createdAtStr.includes('+')) {
          
          const date = new Date(createdAtStr);
          createdAtISO = date.toISOString();
        } else {
          
          createdAtISO = new Date(createdAtStr || new Date()).toISOString();
        }
      }
      
      
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

