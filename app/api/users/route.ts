import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { adminUsers } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';

/**
 * GET /api/users — List admin users. Requires admin authentication.
 * Previously unauthenticated (Critical). Now protected.
 */
export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const allUsers = await db.select({
      id: adminUsers.id,
      username: adminUsers.username,
      email: adminUsers.email,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    }).from(adminUsers);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users — Disabled. Creating admin users with empty password was a critical risk.
 * Use admin-only flow (e.g. create-isyn-admin script) with hashed passwords.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use admin user creation script with hashed passwords.' },
    { status: 405 }
  );
}
