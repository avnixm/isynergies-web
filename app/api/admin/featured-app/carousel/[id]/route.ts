import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppCarouselImages, images, imageChunks, media } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';


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


export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { image, alt, displayOrder, mediaType } = body;
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

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

    await db
      .update(featuredAppCarouselImages)
      .set({
        image: normalizedImage,
        alt: alt?.trim() || 'Featured app carousel media',
        mediaType: detectedMediaType,
        displayOrder: displayOrder ?? 0,
      })
      .where(eq(featuredAppCarouselImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid image ID' },
        { status: 400 }
      );
    }

    
    
    const [record] = await db
      .select()
      .from(featuredAppCarouselImages)
      .where(eq(featuredAppCarouselImages.id, id))
      .limit(1);

    if (record) {
      const rawImage = record.image;

      if (typeof rawImage === 'string' && rawImage.trim() !== '') {
        const value = rawImage.trim();

        
        
        const numericMatch = /^\d+$/.test(value) ? parseInt(value, 10) : null;

        
        const apiImageMatch = value.match(/^\/api\/images\/(\d+)$/);
        const apiImageId = apiImageMatch ? parseInt(apiImageMatch[1], 10) : null;

        try {
          
          
          if (numericMatch !== null) {
            const mediaId = numericMatch;

            const [mediaRecord] = await db
              .select()
              .from(media)
              .where(eq(media.id, mediaId))
              .limit(1);

            if (mediaRecord && typeof mediaRecord.url === 'string') {
              const url = mediaRecord.url;

              if (url.startsWith('/api/images/')) {
                const match = url.match(/\/api\/images\/(\d+)/);
                if (match) {
                  const imageId = parseInt(match[1], 10);
                  await db.delete(imageChunks).where(eq(imageChunks.imageId, imageId));
                  await db.delete(images).where(eq(images.id, imageId));
                }
              }

              await db.delete(media).where(eq(media.id, mediaRecord.id));
            }
          } else if (apiImageId !== null) {
            
            await db.delete(imageChunks).where(eq(imageChunks.imageId, apiImageId));
            await db.delete(images).where(eq(images.id, apiImageId));
          }
        } catch (cleanupError) {
          console.error('Error during carousel media cleanup:', cleanupError);
        }
      }
    }

    
    await db.delete(featuredAppCarouselImages).where(eq(featuredAppCarouselImages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting carousel image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

