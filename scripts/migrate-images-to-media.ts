import 'dotenv/config';
import { db } from '../app/db';
import { images, media } from '../app/db/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';




















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
          
          await db.insert(media).values({
            userId: 1, 
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
