import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { siteSettings } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// GET site settings
export async function GET() {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);
    
    if (!settings) {
      // Return default values if no settings exist
      return NextResponse.json({
        companyName: 'iSynergies Inc.',
        companyAddress: '105 Maharlika Highway, Cabanatuan City, 3100, Philippines',
        companyPhone: '(044) 329 2400',
        companyEmail: 'infoho@isynergiesinc.com',
        companyFacebook: 'facebook.com/isynergiesinc',
        companyTwitter: '',
        companyInstagram: '',
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT update site settings
export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    // Check if settings exist
    const [existing] = await db.select().from(siteSettings).limit(1);

    if (existing) {
      // Update existing
      await db.update(siteSettings).set(body).where(eq(siteSettings.id, existing.id));
    } else {
      // Create new
      await db.insert(siteSettings).values(body);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

