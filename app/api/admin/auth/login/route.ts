import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { adminUsers } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createToken } from '@/app/lib/auth';

export async function POST(request: Request) {
  try {
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
      const msg = process.env.NODE_ENV === 'development'
        ? 'Invalid credentials. User not found — ensure the admin exists in the DB this app uses (e.g. run create-isyn-admin against that DB).'
        : 'Invalid credentials';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      const msg = process.env.NODE_ENV === 'development'
        ? 'Invalid credentials. Password mismatch — use exact username/password (case-sensitive).'
        : 'Invalid credentials';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    
    const token = await createToken({
      userId: user.id,
      username: user.username,
    });

    
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, 
      path: '/',
    });

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

