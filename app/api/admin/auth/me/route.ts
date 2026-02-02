import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { adminUsers } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { getTokenFromRequest, verifyToken } from '@/app/lib/auth';

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    
    const [user] = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, payload.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth check error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
    });

    let errorMessage = 'Internal server error';
    if (error?.code === 'ER_CON_COUNT_ERROR' || error?.sqlMessage?.includes('Too many connections')) {
      errorMessage = 'Database connection limit reached. Please try again in a moment.';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
      errorMessage = 'Database connection failed (refused or timeout). Check DB_HOST, DB_PORT, .env, and that the database is running.';
    } else if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Database access denied. Please check your credentials.';
    } else if (error?.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database does not exist. Please check your database name.';
    } else if (error?.code === 'ER_NO_SUCH_TABLE' || error?.sqlMessage?.includes("doesn't exist")) {
      errorMessage = 'Database table missing. Run migrations (e.g. npx drizzle-kit push or migrate).';
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
        }),
      },
      { status: 500 }
    );
  }
}

