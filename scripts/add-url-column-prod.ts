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

async function addUrlColumn() {
  console.log('📦 Adding url column to images table in production database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(PROD_DB_CONFIG);
    
    // Check if column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'images' 
      AND COLUMN_NAME = 'url'
    `, [PROD_DB_CONFIG.database]);
    
    if (Array.isArray(columns) && columns.length > 0) {
      console.log('✅ Column url already exists');
      return;
    }
    
    // Add the column
    await connection.execute(`
      ALTER TABLE images 
      ADD COLUMN url VARCHAR(500) NULL 
      AFTER data
    `);
    
    console.log('✅ Successfully added url column!');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Column url already exists');
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
    console.log('🚀 Adding url column to production database...\n');
    await addUrlColumn();
    console.log('\n✅ Column addition completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to add column:', error.message);
    process.exit(1);
  }
}

main();
