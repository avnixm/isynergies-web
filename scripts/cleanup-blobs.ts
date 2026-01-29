






















import { list, del } from '@vercel/blob';
import { db } from '../app/db';
import { images, media } from '../app/db/schema';

function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.isyn_READ_WRITE_TOKEN;
}

async function cleanupBlobs(
  mode: 'orphaned' | 'all' | 'old' = 'orphaned',
  options: {
    dryRun?: boolean;
    keepCount?: number;
    olderThanMinutes?: number;
    limit?: number;
  } = {}
) {
  const {
    dryRun = false,
    keepCount = 1,
    olderThanMinutes = 60,
    limit = 1000,
  } = options;

  console.log(`\n🧹 Starting blob cleanup...`);
  console.log(`   Mode: ${mode}`);
  console.log(`   Dry run: ${dryRun}`);
  console.log(`   Limit: ${limit}`);

  
  let referencedUrls = new Set<string>();
  if (mode === 'orphaned') {
    console.log(`\n📊 Checking database for referenced blobs...`);
    const [dbImages, dbMedia] = await Promise.all([
      db.select({ url: images.url }).from(images),
      db.select({ url: media.url }).from(media),
    ]);

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

    console.log(`   Found ${referencedUrls.size} referenced blob URLs`);
  }

  
  console.log(`\n📦 Listing blobs from storage...`);
  const allBlobs: Array<{ url: string; uploadedAt: Date; pathname: string }> = [];
  let cursor: string | undefined;
  let totalChecked = 0;

  do {
    const listResult = await list({
      cursor,
      limit: Math.min(100, limit - totalChecked),
      token: getBlobToken(),
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

  console.log(`   Found ${allBlobs.length} blobs in storage`);

  
  let blobsToDelete: typeof allBlobs = [];

  if (mode === 'orphaned') {
    blobsToDelete = allBlobs.filter((blob) => !referencedUrls.has(blob.url));
    console.log(`\n🔍 Found ${blobsToDelete.length} orphaned blobs`);
  } else if (mode === 'all') {
    const sortedBlobs = [...allBlobs].sort((a, b) => 
      b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
    blobsToDelete = sortedBlobs.slice(keepCount);
    console.log(`\n📅 Keeping ${Math.min(keepCount, sortedBlobs.length)} most recent blobs`);
    console.log(`   Will delete ${blobsToDelete.length} older blobs`);
  } else if (mode === 'old') {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    blobsToDelete = allBlobs.filter((blob) => blob.uploadedAt < cutoffTime);
    console.log(`\n⏰ Found ${blobsToDelete.length} blobs older than ${olderThanMinutes} minutes`);
  }

  if (blobsToDelete.length === 0) {
    console.log(`\n✅ No blobs to delete!`);
    return;
  }

  
  console.log(`\n🗑️  Blobs to delete:`);
  blobsToDelete.slice(0, 10).forEach((blob, i) => {
    const age = Math.round((Date.now() - blob.uploadedAt.getTime()) / 1000 / 60);
    console.log(`   ${i + 1}. ${blob.pathname || blob.url.substring(0, 60)}... (${age} min ago)`);
  });
  if (blobsToDelete.length > 10) {
    console.log(`   ... and ${blobsToDelete.length - 10} more`);
  }

  if (dryRun) {
    console.log(`\n⚠️  DRY RUN - No blobs were actually deleted`);
    return;
  }

  
  console.log(`\n🗑️  Deleting ${blobsToDelete.length} blobs...`);
  let deleted = 0;
  let failed = 0;

  const batchSize = 10;
  for (let i = 0; i < blobsToDelete.length; i += batchSize) {
    const batch = blobsToDelete.slice(i, i + batchSize);
    
    await Promise.allSettled(
      batch.map(async (blob) => {
        try {
          await del(blob.url, { token: getBlobToken() });
          deleted++;
          process.stdout.write('.');
        } catch (error: any) {
          failed++;
          console.error(`\n   Failed to delete ${blob.pathname || blob.url.substring(0, 50)}...: ${error?.message}`);
        }
      })
    );

    if (i + batchSize < blobsToDelete.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`\n\n✅ Cleanup complete!`);
  console.log(`   Deleted: ${deleted}`);
  console.log(`   Failed: ${failed}`);
}


const args = process.argv.slice(2);
const mode = (args[0] as 'orphaned' | 'all' | 'old') || 'orphaned';
const options: any = {};

args.slice(1).forEach((arg) => {
  if (arg === '--dryRun' || arg === '--dry-run') {
    options.dryRun = true;
  } else if (arg.startsWith('--keepCount=')) {
    options.keepCount = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--olderThanMinutes=')) {
    options.olderThanMinutes = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  }
});

cleanupBlobs(mode, options).catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
