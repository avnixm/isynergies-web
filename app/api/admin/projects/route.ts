import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { projects } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';


export async function GET() {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(asc(projects.displayOrder));

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}


export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    const [newProject] = await db
      .insert(projects)
      .values(body)
      .$returningId();

    return NextResponse.json(
      { success: true, id: newProject.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

