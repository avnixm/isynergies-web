import { NextResponse } from 'next/server';
import { clearAdminAuthCookie } from '@/app/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  clearAdminAuthCookie(response);

  return response;
}

