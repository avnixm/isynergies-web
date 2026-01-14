import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { adminUsers } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/users - Get all admin users
export async function GET() {
  try {
    const allUsers = await db.select().from(adminUsers);
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    // Check if request has a body
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Parse JSON with better error handling
    let body;
    let text = '';
    try {
      text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      // Debug log for troubleshooting malformed requests (remove in prod)
      console.log('Received body text:', text);
      console.log('Body length:', text.length);
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse body:', text || 'Unable to read body');
      return NextResponse.json(
        { error: 'Invalid JSON format in request body', details: parseError instanceof Error ? parseError.message : 'Unknown error' },
        { status: 400 }
      );
    }

    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const newUser = await db.insert(adminUsers).values({
      username: name,
      email,
      password: '', // Note: password should be hashed before storing
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
