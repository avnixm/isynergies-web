import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { featuredApp } from '../app/db/schema';
import { eq } from 'drizzle-orm';

const useProd = process.argv.includes('--prod');

// Local/dev config from env
const DEV_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isynergies',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

// Production defaults (matches scripts/setup-database-prod.ts)
const PROD_DB_CONFIG = {
  host: process.env.DB_HOST ?? 'isyn-cieloes.l.aivencloud.com',
  port: Number(process.env.DB_PORT ?? 26771),
  user: process.env.DB_USER ?? 'avnadmin',
  password: process.env.DB_PASSWORD ?? 'AVNS_nTTBVH-I7yN49JekEuK',
  database: process.env.DB_NAME ?? 'defaultdb',
  ssl:
    (process.env.DB_SSL ?? 'true') === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
};

const DB_CONFIG = useProd ? PROD_DB_CONFIG : DEV_DB_CONFIG;

async function updateBannerHeight() {
  let connection;
  try {
    console.log(`🔗 Connecting to database (${useProd ? 'production' : 'development'})...`);
    connection = await mysql.createConnection(DB_CONFIG);
    const db = drizzle(connection, { schema: { featuredApp }, mode: 'default' });

    // Check if any records exist
    const [existing] = await db.select().from(featuredApp).limit(1);

    if (existing) {
      console.log('📝 Updating existing featured app record...');
      await db
        .update(featuredApp)
        .set({ bannerHeight: 'h-60' })
        .where(eq(featuredApp.id, existing.id));
      
      console.log('✅ Successfully updated banner_height to h-60');
      console.log(`   Updated record ID: ${existing.id}`);
    } else {
      console.log('⚠️  No featured app record found. Creating new one with h-60...');
      await db.insert(featuredApp).values({
        bannerHeight: 'h-60',
        itemType: 'app',
      });
      console.log('✅ Successfully created new record with banner_height h-60');
    }

    console.log('✅ Done!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateBannerHeight()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
