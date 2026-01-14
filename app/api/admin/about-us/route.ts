import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { aboutUs } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// GET about us content
export async function GET() {
  try {
    const [content] = await db.select().from(aboutUs).limit(1);
    
    if (!content) {
      // Return default values if no content exists
      return NextResponse.json({
        title: 'About Us',
        paragraph1: 'Isynergies, Inc was established and officially registered with the Securities and Exchange Commission (SEC) on October 30, 2012 as Stock Corporation inline in Other Software and Consultancy and Supply industry.',
        paragraph2: 'The office is based in ASKI Building 105 Maharlika Highway, Cabanatuan City, Nueva Ecija.',
        paragraph3: 'iSynergies, Inc. is a strategic business unit of ASKI Group of Companies, Inc. responsible for providing hardware and software solutions. It also offers products and services to the public and is composed of the Marketing and Sales Unit, Software Development and Quality Assurance Unit, and System Technical and Network Administration Unit.',
        paragraph4: 'The <strong class="font-bold">Software Development</strong> unit creates web, mobile, and computer applications that help companies digitize manual processes and improve transaction speed and efficiency. The <strong class="font-bold">System Technical</strong> unit ensures network and hardware security through proper licensing, configurations, server maintenance, and the installation of security systems such as digital locks, biometrics, and CCTV. The <strong class="font-bold">Marketing and Sales</strong> unit provides essential hardware and software products, including computers, printers, software licenses, and mobile phones to support daily business operations.',
        paragraph5: 'Our team helps your IT to the next level. We make your IT plans possible.',
        missionTitle: 'Our Mission',
        missionText: 'To provide Information Technology Solutions to clientele rendered by skilled and competent workforce.',
        visionTitle: 'Our Vision',
        visionText: 'A Trusted Partner of Every Businesses in Software and Hardware Technological Transformation.',
        galleryImage: '/aboutusgallery.png',
      });
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error fetching about us content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// PUT update about us content
export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    // Only allow updating known editable fields.
    // This prevents accidental writes of fields like `id`/`updatedAt` (which may be strings),
    // which can cause runtime errors (e.g., "value.toISOString is not a function").
    const payload = {
      title: body?.title ?? '',
      paragraph1: body?.paragraph1 ?? '',
      paragraph2: body?.paragraph2 ?? '',
      paragraph3: body?.paragraph3 ?? '',
      paragraph4: body?.paragraph4 ?? '',
      paragraph5: body?.paragraph5 ?? '',
      missionTitle: body?.missionTitle ?? '',
      missionText: body?.missionText ?? '',
      visionTitle: body?.visionTitle ?? '',
      visionText: body?.visionText ?? '',
      galleryImage: body?.galleryImage ?? null,
    };

    // Check if content exists
    const [existing] = await db.select().from(aboutUs).limit(1);

    if (existing) {
      // Update existing
      await db.update(aboutUs).set(payload).where(eq(aboutUs.id, existing.id));
    } else {
      // Create new
      await db.insert(aboutUs).values(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating about us content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

