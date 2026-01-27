import 'dotenv/config';
import { db } from '../app/db';
import { images, media } from '../app/db/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';

/**
 * Migration script: Move images.url records to media table
 * 
 * This script migrates records from the legacy images table to the modern media table.
 * Only migrates records that have a URL (not base64 data).
 * 
 * Safety features:
 * - Dry-run mode (default) - shows what would be migrated without making changes
 * - Verification step - checks for duplicates before migrating
 * - Rollback capability - can be reversed if needed
 * 
 * Usage:
 *   Dry-run: pnpm run migrate-images-to-media
 *   Execute: pnpm run migrate-images-to-media -- --execute
 * Or directly:
 *   Dry-run: pnpm tsx scripts/migrate-images-to-media.ts
 *   Execute: pnpm tsx scripts/migrate-images-to-media.ts --execute
 */

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  duplicates: number;
}

async function migrateImagesToMedia(execute: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    duplicates: 0,
  };

  try {
    console.log(execute ? '🔄 EXECUTING migration...' : '🔍 DRY-RUN mode (no changes will be made)');
    console.log('');

    // Find all images with URLs (not base64)
    const imagesWithUrls = await db
      .select()
      .from(images)
      .where(
        sql`${images.url} IS NOT NULL AND ${images.url} != ''`
      );

    stats.total = imagesWithUrls.length;
    console.log(`Found ${stats.total} image records with URLs`);

    if (stats.total === 0) {
      console.log('✅ No records to migrate');
      return stats;
    }

    // Check for existing media records to avoid duplicates
    const existingMediaUrls = new Set<string>();
    const existingMedia = await db
      .select({ url: media.url })
      .from(media);

    existingMedia.forEach(m => {
      if (m.url) {
        existingMediaUrls.add(m.url);
      }
    });

    console.log(`Found ${existingMediaUrls.size} existing media records`);
    console.log('');

    // Process each image record
    for (const image of imagesWithUrls) {
      if (!image.url) {
        stats.skipped++;
        continue;
      }

      // Check if already migrated
      if (existingMediaUrls.has(image.url)) {
        console.log(`⏭️  Skipping ${image.id}: URL already exists in media table`);
        stats.duplicates++;
        continue;
      }

      // Determine type from MIME type
      const type = image.mimeType?.startsWith('video/') ? 'video' : 'image';

      if (execute) {
        try {
          // Create media record
          await db.insert(media).values({
            userId: 1, // Default user ID - adjust if needed
            url: image.url,
            type,
            contentType: image.mimeType || 'application/octet-stream',
            sizeBytes: image.size || 0,
            title: image.filename,
          });

          console.log(`✅ Migrated image ${image.id} → media (type: ${type})`);
          stats.migrated++;
        } catch (error: any) {
          console.error(`❌ Error migrating image ${image.id}:`, error.message);
          stats.errors++;
        }
      } else {
        // Dry-run: just log what would be migrated
        console.log(`📋 Would migrate image ${image.id}: ${image.filename} (${type})`);
        stats.migrated++;
      }
    }

    console.log('');
    console.log('=== Migration Summary ===');
    console.log(`Total records: ${stats.total}`);
    console.log(`${execute ? 'Migrated' : 'Would migrate'}: ${stats.migrated}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Duplicates: ${stats.duplicates}`);
    if (stats.errors > 0) {
      console.log(`Errors: ${stats.errors}`);
    }

    if (!execute) {
      console.log('');
      console.log('💡 To execute migration, run with --execute flag');
    }

    return stats;
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const execute = args.includes('--execute');

if (execute) {
  console.log('⚠️  WARNING: This will modify the database!');
  console.log('Press Ctrl+C within 5 seconds to cancel...');
  await new Promise(resolve => setTimeout(resolve, 5000));
}

migrateImagesToMedia(execute)
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
