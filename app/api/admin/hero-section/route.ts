import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroSection, images, media } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/hero-section - Get hero section content
export async function GET() {
  try {
    const content = await db.select().from(heroSection).limit(1);
    
    // If no content exists, return default
    if (content.length === 0) {
      return NextResponse.json({
        id: 1,
        weMakeItLogo: null,
        isLogo: null,
        fullLogo: null,
        backgroundImage: null,
        backgroundVideo: null,
        heroImagesBackgroundImage: null,
        useHeroImages: false,
      });
    }
    
    const heroData = content[0];
    
    // For background video, if it's a media ID, fetch the actual blob URL if available
    // Check media table first (new system), then fall back to images table (legacy)
    // This avoids redirects for large videos and improves streaming performance
    let backgroundVideoUrl = heroData.backgroundVideo;
    if (backgroundVideoUrl && !backgroundVideoUrl.startsWith('http') && !backgroundVideoUrl.startsWith('/')) {
      try {
        const videoId = parseInt(backgroundVideoUrl);
        if (!isNaN(videoId)) {
          // First, try to find in media table (new unified media system)
          const [mediaRecord] = await db
            .select({ url: media.url, type: media.type })
            .from(media)
            .where(eq(media.id, videoId))
            .limit(1);
          
          if (mediaRecord?.url && mediaRecord.url.startsWith('https://')) {
            backgroundVideoUrl = mediaRecord.url;
            console.log(`Resolved video ID ${videoId} from media table to blob URL: ${backgroundVideoUrl.substring(0, 50)}...`);
          } else {
            // Fall back to images table (legacy system)
            const [videoImage] = await db
              .select({ url: images.url, mimeType: images.mimeType })
              .from(images)
              .where(eq(images.id, videoId))
              .limit(1);
            
            // If the image has a blob URL, use it directly for better streaming
            // This is especially important for large videos (39MB+) that need range requests
            if (videoImage?.url && videoImage.url.startsWith('https://')) {
              backgroundVideoUrl = videoImage.url;
              console.log(`Resolved video ID ${videoId} from images table to blob URL: ${backgroundVideoUrl.substring(0, 50)}...`);
            }
          }
        }
      } catch (err) {
        // If lookup fails, fall back to original value
        console.warn('Failed to resolve video URL:', err);
      }
    }
    
    return NextResponse.json({
      ...heroData,
      backgroundVideo: backgroundVideoUrl,
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    // Fail soft in production: return defaults so the homepage still renders even if DB is unreachable
    return NextResponse.json({
      id: 1,
      weMakeItLogo: null,
      isLogo: null,
      fullLogo: null,
      backgroundImage: null,
      backgroundVideo: null,
      heroImagesBackgroundImage: null,
      useHeroImages: false,
    });
  }
}

// PUT /api/admin/hero-section - Update hero section content
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { weMakeItLogo, isLogo, fullLogo, backgroundImage, backgroundVideo, heroImagesBackgroundImage, useHeroImages } = body;

    // Check if record exists
    const existing = await db.select().from(heroSection).limit(1);

    if (existing.length === 0) {
      // Create new record
      await db.insert(heroSection).values({
        weMakeItLogo,
        isLogo,
        fullLogo,
        backgroundImage,
        backgroundVideo,
        heroImagesBackgroundImage,
        useHeroImages: useHeroImages ?? false,
      });
    } else {
      // Update existing record (there should only be one)
      await db
        .update(heroSection)
        .set({
          weMakeItLogo,
          isLogo,
          fullLogo,
          backgroundImage,
          backgroundVideo,
          heroImagesBackgroundImage: heroImagesBackgroundImage !== undefined ? heroImagesBackgroundImage : undefined,
          useHeroImages: useHeroImages !== undefined ? useHeroImages : undefined,
        });
    }

    const updated = await db.select().from(heroSection).limit(1);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json(
      { error: 'Failed to update hero section' },
      { status: 500 }
    );
  }
}

