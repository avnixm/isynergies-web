import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { contactMessages } from '@/app/db/schema';

// POST /api/contact - Submit a contact message
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, contactNo, message, projectId, projectTitle } = body;

    if (!name || !email || !contactNo || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate phone number: exactly 11 digits starting with "09"
    const digitsOnly = contactNo.replace(/\D/g, '');
    if (digitsOnly.length !== 11) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      );
    }
    if (!digitsOnly.startsWith('09')) {
      return NextResponse.json(
        { error: 'Phone number must start with 09' },
        { status: 400 }
      );
    }

    await db.insert(contactMessages).values({
      name,
      email,
      contactNo,
      message,
      projectId: projectId ?? null,
      projectTitle: projectTitle ?? null,
      status: 'new',
    });

    return NextResponse.json(
      { success: true, message: 'Message sent successfully!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting contact message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

