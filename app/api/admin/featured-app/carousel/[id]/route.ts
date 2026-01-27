import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppCarouselImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { eq } from 'drizzle-orm';

// Helper function to extract and normalize video URLs from embed codes
function normalizeVideoUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  // Extract URL from iframe embed code
  const iframeMatch = url.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  // Extract Wistia media ID from embed code
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

  // Decode HTML entities
  url = url.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  // Trim and return
  return url.trim();
}

// PUT update carousel image
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

    // Check if image is a numeric ID (media ID from Vercel Blob upload) vs URL string
    const isNumericId = typeof image === 'string' && /^\d+$/.test(image.trim());
    const isMediaId = isNumericId && mediaType === 'video';

    // If it's a media ID from Vercel Blob upload, store it as-is
    // Otherwise, normalize the URL (for backward compatibility with embed URLs)
    const normalizedImage = isMediaId
      ? image.trim() // Keep numeric media ID as-is
      : (typeof image === 'string' ? normalizeVideoUrl(image) : image);

    // Check if normalized URL is too long (database column limit is 255)
    // Only check length for URL strings, not numeric IDs
    if (!isMediaId && typeof normalizedImage === 'string' && normalizedImage.length > 255) {
      return NextResponse.json(
        { error: 'Video URL is too long. Please use a shorter URL or extract the media ID from embed codes.' },
        { status: 400 }
      );
    }

    // Determine media type if not provided
    // If it's a numeric media ID with mediaType='video', it's a blob video
    // Otherwise check if it's a video URL (various video hosting services) or video file extension
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
      normalizedImage.endsWith('.m3u8') // HLS stream
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

// DELETE carousel image
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

