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

async function addVideosTable() {
  console.log('📦 Creating videos table in production database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(PROD_DB_CONFIG);
    
    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'videos'
    `, [PROD_DB_CONFIG.database]);
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ Table videos already exists');
      return;
    }
    
    // Create the videos table
    await connection.execute(`
      CREATE TABLE videos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        blob_url VARCHAR(500) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        size_bytes INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Successfully created videos table!');
  } catch (error: any) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('✅ Table videos already exists');
    } else {
      console.error('❌ Error creating table:', error.message);
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
    console.log('🚀 Creating videos table in production database...\n');
    await addVideosTable();
    console.log('\n✅ Table creation completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to create table:', error.message);
    process.exit(1);
  }
}

main();
