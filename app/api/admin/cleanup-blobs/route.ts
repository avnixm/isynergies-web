import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { list, del } from '@vercel/blob';
import { db } from '@/app/db';
import { images, media } from '@/app/db/schema';

/**
 * POST /api/admin/cleanup-blobs
 * Finds and deletes blob files
 * 
 * Query params:
 * - dryRun: if true, only reports what would be deleted without actually deleting
 * - limit: maximum number of blobs to check (default: 1000)
 * - mode: 'orphaned' (default) - only delete blobs not in database
 *         'all' - delete all blobs except keep the N most recent (use keepCount)
 *         'old' - delete blobs older than X minutes (use olderThanMinutes)
 * - keepCount: when mode='all', keep this many most recent blobs (default: 1)
 * - olderThanMinutes: when mode='old', delete blobs older than this (default: 60)
 */
export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';
    const limit = parseInt(searchParams.get('limit') || '1000', 10);
    const mode = searchParams.get('mode') || 'orphaned'; // 'orphaned', 'all', 'old'
    const keepCount = parseInt(searchParams.get('keepCount') || '1', 10);
    const olderThanMinutes = parseInt(searchParams.get('olderThanMinutes') || '60', 10);

    console.log(`Starting blob cleanup (dryRun: ${dryRun}, mode: ${mode}, limit: ${limit})`);

    // Step 1: Get all blob URLs from database (for orphaned mode)
    let referencedUrls = new Set<string>();
    
    if (mode === 'orphaned') {
      const [dbImages, dbMedia] = await Promise.all([
        db.select({ url: images.url }).from(images),
        db.select({ url: media.url }).from(media),
      ]);

      // Add URLs from images table
      dbImages.forEach((img) => {
        if (img.url && img.url.startsWith('https://') && img.url.includes('blob.vercel-storage.com')) {
          referencedUrls.add(img.url);
        }
      });

      // Add URLs from media table
      dbMedia.forEach((m) => {
        if (m.url && m.url.startsWith('https://') && m.url.includes('blob.vercel-storage.com')) {
          referencedUrls.add(m.url);
        }
      });

      console.log(`Found ${referencedUrls.size} referenced blob URLs in database`);
    }

    // Step 2: List all blobs from Vercel Blob storage with metadata
    interface BlobWithMetadata {
      url: string;
      uploadedAt: Date;
      pathname: string;
    }
    
    const allBlobs: BlobWithMetadata[] = [];
    let cursor: string | undefined;
    let totalChecked = 0;

    do {
      const listResult = await list({
        cursor,
        limit: Math.min(100, limit - totalChecked),
      });

      for (const blob of listResult.blobs) {
        allBlobs.push({
          url: blob.url,
          uploadedAt: blob.uploadedAt,
          pathname: blob.pathname,
        });
        totalChecked++;
        
        if (totalChecked >= limit) {
          break;
        }
      }

      cursor = listResult.cursor || undefined;
    } while (cursor && totalChecked < limit);

    console.log(`Found ${allBlobs.length} blobs in storage`);

    // Step 3: Determine which blobs to delete based on mode
    let blobsToDelete: BlobWithMetadata[] = [];

    if (mode === 'orphaned') {
      // Only delete blobs not referenced in database
      blobsToDelete = allBlobs.filter((blob) => !referencedUrls.has(blob.url));
      console.log(`Found ${blobsToDelete.length} orphaned blobs`);
    } else if (mode === 'all') {
      // Delete all blobs except keep the N most recent
      const sortedBlobs = [...allBlobs].sort((a, b) => 
        b.uploadedAt.getTime() - a.uploadedAt.getTime()
      );
      blobsToDelete = sortedBlobs.slice(keepCount);
      console.log(`Keeping ${Math.min(keepCount, sortedBlobs.length)} most recent blobs, deleting ${blobsToDelete.length} older blobs`);
    } else if (mode === 'old') {
      // Delete blobs older than X minutes
      const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
      blobsToDelete = allBlobs.filter((blob) => blob.uploadedAt < cutoffTime);
      console.log(`Found ${blobsToDelete.length} blobs older than ${olderThanMinutes} minutes`);
    }

    // Step 4: Delete blobs (unless dry run)
    const deletionResults: Array<{ url: string; success: boolean; error?: string }> = [];

    if (!dryRun && blobsToDelete.length > 0) {
      console.log(`Deleting ${blobsToDelete.length} blobs...`);
      
      // Delete in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < blobsToDelete.length; i += batchSize) {
        const batch = blobsToDelete.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (blob) => {
            try {
              await del(blob.url);
              deletionResults.push({ url: blob.url, success: true });
              console.log(`Deleted blob: ${blob.pathname || blob.url.substring(0, 50)}...`);
            } catch (error: any) {
              const errorMsg = error?.message || 'Unknown error';
              deletionResults.push({ url: blob.url, success: false, error: errorMsg });
              console.error(`Failed to delete blob ${blob.pathname || blob.url.substring(0, 50)}...:`, errorMsg);
            }
          })
        );

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < blobsToDelete.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    const successfulDeletions = deletionResults.filter((r) => r.success).length;
    const failedDeletions = deletionResults.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      dryRun,
      mode,
      summary: {
        totalBlobsInStorage: allBlobs.length,
        referencedBlobs: mode === 'orphaned' ? referencedUrls.size : undefined,
        blobsToDelete: blobsToDelete.length,
        deleted: dryRun ? 0 : successfulDeletions,
        failed: dryRun ? 0 : failedDeletions,
        kept: mode === 'all' ? Math.min(keepCount, allBlobs.length) : undefined,
      },
      blobsToDelete: dryRun ? blobsToDelete.map(b => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt })) : undefined,
      deletionResults: dryRun ? undefined : deletionResults,
    });
  } catch (error: any) {
    console.error('Error during blob cleanup:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to cleanup blobs'
          : 'Failed to cleanup blobs',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cleanup-blobs
 * Get statistics about blob storage without deleting anything
 */
export async function GET(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    // Get all blob URLs from database
    const [dbImages, dbMedia] = await Promise.all([
      db.select({ url: images.url }).from(images),
      db.select({ url: media.url }).from(media),
    ]);

    const referencedUrls = new Set<string>();
    
    dbImages.forEach((img) => {
      if (img.url && img.url.startsWith('https://') && img.url.includes('blob.vercel-storage.com')) {
        referencedUrls.add(img.url);
      }
    });

    dbMedia.forEach((m) => {
      if (m.url && m.url.startsWith('https://') && m.url.includes('blob.vercel-storage.com')) {
        referencedUrls.add(m.url);
      }
    });

    // List blobs from storage
    const allBlobs: string[] = [];
    let cursor: string | undefined;
    let totalChecked = 0;

    do {
      const listResult = await list({
        cursor,
        limit: Math.min(100, limit - totalChecked),
      });

      for (const blob of listResult.blobs) {
        allBlobs.push(blob.url);
        totalChecked++;
        
        if (totalChecked >= limit) {
          break;
        }
      }

      cursor = listResult.cursor || undefined;
    } while (cursor && totalChecked < limit);

    const orphanedBlobs = allBlobs.filter((url) => !referencedUrls.has(url));

    return NextResponse.json({
      success: true,
      summary: {
        totalBlobsInStorage: allBlobs.length,
        referencedBlobs: referencedUrls.size,
        orphanedBlobs: orphanedBlobs.length,
      },
      orphanedBlobs: orphanedBlobs.slice(0, 100), // Return first 100 for preview
    });
  } catch (error: any) {
    console.error('Error getting blob statistics:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to get blob statistics'
          : 'Failed to get blob statistics',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
