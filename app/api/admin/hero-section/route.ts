import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroSection, images } from '@/app/db/schema';
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
      });
    }
    
    const heroData = content[0];
    
    // For background video, if it's an image ID, fetch the actual blob URL if available
    // This avoids redirects for large videos and improves streaming performance
    let backgroundVideoUrl = heroData.backgroundVideo;
    if (backgroundVideoUrl && !backgroundVideoUrl.startsWith('http') && !backgroundVideoUrl.startsWith('/')) {
      try {
        const videoId = parseInt(backgroundVideoUrl);
        if (!isNaN(videoId)) {
          const [videoImage] = await db
            .select({ url: images.url, mimeType: images.mimeType })
            .from(images)
            .where(eq(images.id, videoId))
            .limit(1);
          
          // If the image has a blob URL, use it directly for better streaming
          if (videoImage?.url && videoImage.url.startsWith('https://')) {
            backgroundVideoUrl = videoImage.url;
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
    });
  }
}

// PUT /api/admin/hero-section - Update hero section content
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { weMakeItLogo, isLogo, fullLogo, backgroundImage, backgroundVideo } = body;

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

