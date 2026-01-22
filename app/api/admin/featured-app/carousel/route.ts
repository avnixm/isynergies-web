import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { featuredAppCarouselImages } from '@/app/db/schema';
import { requireAuth } from '@/app/lib/auth-middleware';
import { asc } from 'drizzle-orm';

// GET all carousel images
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
    
    // Map results to ensure mediaType has a default value if null/undefined
    const mappedImages = images.map((img: any) => {
      const mediaType = img.mediaType || img.media_type || 'image';
      console.log(`Carousel item ${img.id}: mediaType=${mediaType}, image=${img.image}`);
      return {
        id: img.id,
        image: img.image,
        alt: img.alt,
        displayOrder: img.displayOrder,
        mediaType, // Handle both camelCase and snake_case
      };
    });
    
    return NextResponse.json(mappedImages);
  } catch (error: any) {
    console.error('Error fetching carousel images:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      sql: error?.sql,
      stack: error?.stack,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch images';
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

// POST create new carousel image
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

    // Determine media type if not provided
    const detectedMediaType = mediaType || (typeof image === 'string' && (image.endsWith('.mp4') || image.endsWith('.webm') || image.endsWith('.mov')) ? 'video' : 'image');

    const result = await db.insert(featuredAppCarouselImages).values({
      image: typeof image === 'string' ? image.trim() : image,
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
    
    // Provide more specific error messages
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

