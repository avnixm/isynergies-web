import { NextResponse } from 'next/server';

/**
 * GET /api/users — Disabled. Listing admin users is a security risk (enumeration, least privilege).
 * Use /api/admin/auth/me for the current authenticated user only.
 */
export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is disabled for security.' },
    { status: 403 }
  );
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
