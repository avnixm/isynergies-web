import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredApp } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';


export async function GET() {
  try {
    const [content] = await db.select().from(featuredApp).limit(1);
    
    if (!content) {
      
      return NextResponse.json({
        headerImage: '',
        itemType: 'app',
        downloadText: 'Download now via',
        appStoreImage: '',
        googlePlayImage: '',
        appGalleryImage: '',
        visitText: 'Visit the link to',
        websiteUrl: '',
        logoImage: '',
        gradientFrom: '#2563eb',
        gradientTo: '#1e40af',
        gradientDirection: 'to-r',
        appLogo: '',
        poweredByImage: '',
        bannerHeight: 'h-48',
      });
    }

    
    const response = {
      headerImage: (content as any).headerImage || (content as any).header_image || '',
      itemType: (content as any).itemType || (content as any).item_type || 'app',
      downloadText: (content as any).downloadText || (content as any).download_text || 'Download now via',
      appStoreImage: (content as any).appStoreImage || (content as any).app_store_image || '',
      googlePlayImage: (content as any).googlePlayImage || (content as any).google_play_image || '',
      appGalleryImage: (content as any).appGalleryImage || (content as any).app_gallery_image || '',
      visitText: (content as any).visitText || (content as any).visit_text || 'Visit the link to',
      websiteUrl: (content as any).websiteUrl || (content as any).website_url || '',
      logoImage: (content as any).logoImage || (content as any).logo_image || '',
      gradientFrom: (content as any).gradientFrom || (content as any).gradient_from || '#2563eb',
      gradientTo: (content as any).gradientTo || (content as any).gradient_to || '#1e40af',
      gradientDirection: (content as any).gradientDirection || (content as any).gradient_direction || 'to-r',
      appLogo: (content as any).appLogo || (content as any).app_logo || '',
      poweredByImage: (content as any).poweredByImage || (content as any).powered_by_image || '',
      bannerHeight: (content as any).bannerHeight || (content as any).banner_height || 'h-60',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching featured app content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}


export async function PUT(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();

    const payload = {
      headerImage: body?.headerImage ?? '',
      itemType: body?.itemType ?? 'app',
      downloadText: body?.downloadText ?? 'Download now via',
      appStoreImage: body?.appStoreImage ?? '',
      googlePlayImage: body?.googlePlayImage ?? '',
      appGalleryImage: body?.appGalleryImage ?? '',
      visitText: body?.visitText ?? 'Visit the link to',
      websiteUrl: body?.websiteUrl ?? '',
      logoImage: body?.logoImage ?? '',
      gradientFrom: body?.gradientFrom ?? '#2563eb',
      gradientTo: body?.gradientTo ?? '#1e40af',
      gradientDirection: body?.gradientDirection ?? 'to-r',
      appLogo: body?.appLogo ?? '',
      poweredByImage: body?.poweredByImage ?? '',
      bannerHeight: body?.bannerHeight ?? 'h-60',
    };

    
    const [existing] = await db.select().from(featuredApp).limit(1);

    if (existing) {
      
      await db.update(featuredApp).set(payload).where(eq(featuredApp.id, existing.id));
    } else {
      
      await db.insert(featuredApp).values(payload);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating featured app content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

