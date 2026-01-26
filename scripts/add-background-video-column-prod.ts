import 'dotenv/config';
import mysql from 'mysql2/promise';

// Force production database configuration
const PROD_DB_CONFIG = {
  host: 'isyn-cieloes.l.aivencloud.com',
  port: 26771,
  user: 'avnadmin',
  password: 'AVNS_nTTBVH-I7yN49JekEuK',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false },
};

async function addBackgroundVideoColumn() {
  console.log('📦 Adding background_video column to hero_section table in production database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(PROD_DB_CONFIG);
    
    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'hero_section' 
      AND COLUMN_NAME = 'background_video'
    `, [PROD_DB_CONFIG.database]);
    
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('✅ Column background_video already exists');
      return;
    }
    
    // Add the column
    await connection.execute(`
      ALTER TABLE hero_section 
      ADD COLUMN background_video VARCHAR(255) NULL 
      AFTER background_image
    `);
    
    console.log('✅ Successfully added background_video column!');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Column background_video already exists');
    } else {
      console.error('❌ Error adding column:', error.message);
      throw error;
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function main() {
  try {
    console.log('🚀 Adding background_video column to production database...\n');
    await addBackgroundVideoColumn();
    console.log('\n✅ Column addition completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to add column:', error.message);
    process.exit(1);
  }
}

main();
