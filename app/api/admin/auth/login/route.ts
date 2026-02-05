import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { adminUsers } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createToken, setAdminAuthCookie, ONE_DAY_SECONDS } from '@/app/lib/auth';
import { checkRateLimit, getRateLimitKey } from '@/app/lib/rate-limit';

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const key = getRateLimitKey(request, 'login');
    const rate = checkRateLimit(key, LOGIN_LIMIT, LOGIN_WINDOW_MS);
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } }
      );
    }

    const body = await request.json();
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    
    const token = await createToken({
      userId: user.id,
      username: user.username,
    });

    const response = NextResponse.json({
      success: true,
      token, // Still return token for debugging/tooling, but client won't use it
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    // Set HttpOnly cookie (1 day expiry)
    setAdminAuthCookie(token, response);

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
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
      errorMessage = 'Database connection failed. If using a managed DB (e.g. DigitalOcean), ensure Trusted Sources allow your deployment (e.g. allow 0.0.0.0/0 for Vercel).';
    } else if (error?.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Database access denied. Please check your credentials.';
    } else if (error?.code === 'ER_BAD_DB_ERROR') {
      errorMessage = 'Database does not exist. Please check your database name.';
    } else if (error?.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
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

