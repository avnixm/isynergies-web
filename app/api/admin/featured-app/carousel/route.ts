import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppCarouselImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';


function normalizeVideoUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  
  const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  
  const wistiaPlayerMatch = url.match(/<wistia-player[^>]+media-id=["']([^"']+)["']/i);
  if (wistiaPlayerMatch) {
    return `https://wistia.com/medias/${wistiaPlayerMatch[1]}`;
  }

  const wistiaScriptMatch = url.match(/wistia\.com\/embed\/([a-zA-Z0-9]+)\.js/i);
  if (wistiaScriptMatch) {
    return `https://wistia.com/medias/${wistiaScriptMatch[1]}`;
  }

  const wistiaMediasMatch = url.match(/wistia\.com\/embed\/medias\/([a-zA-Z0-9]+)/i);
  if (wistiaMediasMatch) {
    return `https://wistia.com/medias/${wistiaMediasMatch[1]}`;
  }

  
  url = url.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  
  return url.trim();
}


export async function GET() {
  try {
    const images = await db
      .select({
        id: featuredAppCarouselImages.id,
        image: featuredAppCarouselImages.image,
        alt: featuredAppCarouselImages.alt,
        displayOrder: featuredAppCarouselImages.displayOrder,
        mediaType: featuredAppCarouselImages.mediaType,
      })
      .from(featuredAppCarouselImages)
      .orderBy(asc(featuredAppCarouselImages.displayOrder));
    
    const mappedImages = images.map((img: { id: number; image: string; alt: string; displayOrder: number; mediaType?: string | null }) => {
      const mediaType = img.mediaType ?? 'image';
      return {
        id: img.id,
        image: img.image,
        alt: img.alt,
        displayOrder: img.displayOrder,
        mediaType,
      };
    });
    
    return NextResponse.json(mappedImages);
  } catch (error: unknown) {
    console.error('Error fetching carousel images:', error);
    return NextResponse.json([]);
  }
}


export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { image, alt, displayOrder, mediaType } = body;

    if (!image || (typeof image === 'string' && image.trim() === '')) {
      return NextResponse.json(
        { error: 'Image/Video is required' },
        { status: 400 }
      );
    }

    
    const isNumericId = typeof image === 'string' && /^\d+$/.test(image.trim());
    const isMediaId = isNumericId && mediaType === 'video';

    
    
    const normalizedImage = isMediaId
      ? image.trim() 
      : (typeof image === 'string' ? normalizeVideoUrl(image) : image);

    
    
    if (!isMediaId && typeof normalizedImage === 'string' && normalizedImage.length > 255) {
      return NextResponse.json(
        { error: 'Video URL is too long. Please use a shorter URL or extract the media ID from embed codes.' },
        { status: 400 }
      );
    }

    
    
    
    const isVideoUrl = isMediaId || (typeof normalizedImage === 'string' && (
      normalizedImage.includes('youtube.com') ||
      normalizedImage.includes('youtu.be') ||
      normalizedImage.includes('vimeo.com') ||
      normalizedImage.includes('drive.google.com') ||
      normalizedImage.includes('wistia.com') ||
      normalizedImage.includes('wistia.net') ||
      normalizedImage.includes('loom.com') ||
      normalizedImage.includes('dailymotion.com') ||
      normalizedImage.includes('twitch.tv') ||
      normalizedImage.includes('facebook.com') ||
      normalizedImage.includes('mux.com') ||
      normalizedImage.includes('cloudflarestream.com') ||
      normalizedImage.includes('videodelivery.net') ||
      normalizedImage.endsWith('.mp4') ||
      normalizedImage.endsWith('.webm') ||
      normalizedImage.endsWith('.mov') ||
      normalizedImage.endsWith('.m3u8') 
    ));
    const detectedMediaType = mediaType || (isVideoUrl ? 'video' : 'image');

    const result = await db.insert(featuredAppCarouselImages).values({
      image: normalizedImage,
      alt: alt?.trim() || 'Featured app carousel media',
      mediaType: detectedMediaType,
      displayOrder: displayOrder ?? 0,
    });

    const insertId = Array.isArray(result) && result.length > 0 && (result[0] as any).insertId
      ? (result[0] as any).insertId
      : null;

    return NextResponse.json({ success: true, id: insertId }, { status: 201 });
  } catch (error: any) {
    if (error.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating carousel image:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack,
    });
    
    
    let errorMessage = 'Failed to create image';
    if (error?.code === 'ER_CON_COUNT_ERROR' || error?.sqlMessage?.includes('Too many connections')) {
      errorMessage = 'Database connection limit reached. Please try again in a moment.';
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      errorMessage = 'Database connection failed. Please check your database configuration.';
    } else if (error?.sqlMessage) {
      errorMessage = `Database error: ${error.sqlMessage}`;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          code: error?.code,
        })
      },
      { status: 500 }
    );
  }
}

