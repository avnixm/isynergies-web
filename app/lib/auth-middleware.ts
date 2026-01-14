import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './auth';

export async function requireAuth(request: Request) {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return payload;
}

