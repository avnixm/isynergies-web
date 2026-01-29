import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { heroSection, images, media } from '@/app/db/schema';
import { eq } from 'drizzle-orm';


export async function GET() {
  try {
    
    const content = await db.select({
      id: heroSection.id,
      weMakeItLogo: heroSection.weMakeItLogo,
      isLogo: heroSection.isLogo,
      fullLogo: heroSection.fullLogo,
      backgroundImage: heroSection.backgroundImage,
      backgroundVideo: heroSection.backgroundVideo,
      heroImagesBackgroundImage: heroSection.heroImagesBackgroundImage,
      useHeroImages: heroSection.useHeroImages,
      updatedAt: heroSection.updatedAt,
    }).from(heroSection).limit(1);
    
    
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
    
    
    
    
    let backgroundVideoUrl = heroData.backgroundVideo;
    if (backgroundVideoUrl && !backgroundVideoUrl.startsWith('http') && !backgroundVideoUrl.startsWith('/')) {
      try {
        const videoId = parseInt(backgroundVideoUrl);
        if (!isNaN(videoId)) {
          
          const [mediaRecord] = await db
            .select({ url: media.url, type: media.type })
            .from(media)
            .where(eq(media.id, videoId))
            .limit(1);
          
          if (mediaRecord?.url && mediaRecord.url.startsWith('https://')) {
            backgroundVideoUrl = mediaRecord.url;
            console.log(`Resolved video ID ${videoId} from media table to blob URL: ${backgroundVideoUrl.substring(0, 50)}...`);
          } else {
            
            const [videoImage] = await db
              .select({ url: images.url, mimeType: images.mimeType })
              .from(images)
              .where(eq(images.id, videoId))
              .limit(1);
            
            
            
            if (videoImage?.url && videoImage.url.startsWith('https://')) {
              backgroundVideoUrl = videoImage.url;
              console.log(`Resolved video ID ${videoId} from images table to blob URL: ${backgroundVideoUrl.substring(0, 50)}...`);
            }
          }
        }
      } catch (err) {
        
        console.warn('Failed to resolve video URL:', err);
      }
    }
    
    return NextResponse.json({
      ...heroData,
      backgroundVideo: backgroundVideoUrl,
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    
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


export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { weMakeItLogo, isLogo, fullLogo, backgroundImage, backgroundVideo, heroImagesBackgroundImage, useHeroImages } = body;

    
    const existing = await db.select({
      id: heroSection.id,
    }).from(heroSection).limit(1);

    if (existing.length === 0) {
      
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

    const updated = await db.select({
      id: heroSection.id,
      weMakeItLogo: heroSection.weMakeItLogo,
      isLogo: heroSection.isLogo,
      fullLogo: heroSection.fullLogo,
      backgroundImage: heroSection.backgroundImage,
      backgroundVideo: heroSection.backgroundVideo,
      heroImagesBackgroundImage: heroSection.heroImagesBackgroundImage,
      useHeroImages: heroSection.useHeroImages,
      updatedAt: heroSection.updatedAt,
    }).from(heroSection).limit(1);
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating hero section:', error);
    return NextResponse.json(
      { error: 'Failed to update hero section' },
      { status: 500 }
    );
  }
}

