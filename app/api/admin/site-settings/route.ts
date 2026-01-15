import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { siteSettings } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);
    
    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        companyName: 'iSynergies Inc.',
        companyAddress: 'ASKI Building 105 Maharlika Highway, Cabanatuan City, Nueva Ecija',
        companyPhone: '+63 123 456 7890',
        companyEmail: 'info@isynergies.com',
        companyFacebook: 'https://facebook.com/isynergies',
        companyTwitter: '',
        companyInstagram: '',
        logoImage: null,
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json({ error: 'Failed to fetch site settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    // Only persist known fields; ignore timestamps and any extra keys
    const {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyFacebook,
      companyTwitter,
      companyInstagram,
      logoImage,
    } = body;

    const payload = {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      companyFacebook,
      companyTwitter,
      companyInstagram,
      logoImage,
    };
    
    // Check if settings exist
    const [existing] = await db.select().from(siteSettings).limit(1);
    
    if (existing) {
      // Update existing settings
      await db.update(siteSettings).set(payload).where(eq(siteSettings.id, existing.id));
    } else {
      // Create new settings
      await db.insert(siteSettings).values(payload);
    }
    
    return NextResponse.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating site settings:', error);
    return NextResponse.json({ error: 'Failed to update site settings' }, { status: 500 });
  }
}
