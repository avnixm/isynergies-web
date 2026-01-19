import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { whatWeDo } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// GET what we do content
export async function GET() {
  try {
    const [content] = await db.select().from(whatWeDo).limit(1);
    
    if (!content) {
      // Return default values if no content exists
      return NextResponse.json({
        mainText: 'The <strong>Software Development</strong> unit creates web, mobile, and computer applications that help companies digitize manual processes and improve transaction speed and efficiency. The <strong>System Technical</strong> unit ensures network and hardware security through proper licensing, configurations, server maintenance, and the installation of security systems such as digital locks, biometrics, and CCTV. The <strong>Marketing and Sales</strong> unit provides essential hardware and software products, including computers, printers, software licenses, and mobile phones to support daily business operations.',
        tagline: 'Our team helps your IT to the next level. We make your IT plans possible.',
      });
    }

    // Map database column names to camelCase (Drizzle should return camelCase, but handle both cases)
    const response = {
      mainText: (content as any).mainText || (content as any).main_text || '',
      tagline: (content as any).tagline || '',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching what we do content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// PUT update what we do content
export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    const payload = {
      mainText: body?.mainText ?? '',
      tagline: body?.tagline ?? '',
    };

    // Check if content exists
    const [existing] = await db.select().from(whatWeDo).limit(1);

    if (existing) {
      // Update existing
      await db.update(whatWeDo).set(payload).where(eq(whatWeDo.id, existing.id));
    } else {
      // Create new
      await db.insert(whatWeDo).values(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating what we do content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

