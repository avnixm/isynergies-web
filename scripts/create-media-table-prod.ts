import 'dotenv/config';
import mysql from 'mysql2/promise';


const PROD_DB_CONFIG = {
  host: 'isyn-cieloes.l.aivencloud.com',
  port: 26771,
  user: 'avnadmin',
  password: 'AVNS_nTTBVH-I7yN49JekEuK',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false },
};

async function createMediaTable() {
  let connection;
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      console.log(`📦 Creating media table in production database... (attempt ${retryCount + 1}/${maxRetries})`);
      console.log(`Connecting to: ${PROD_DB_CONFIG.host}:${PROD_DB_CONFIG.port}/${PROD_DB_CONFIG.database}`);
      
      connection = await mysql.createConnection({
        ...PROD_DB_CONFIG,
        connectTimeout: 10000, 
      });
    
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'media'
    `, [PROD_DB_CONFIG.database]);
    
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ Media table already exists');
      return;
    }
    
    
    await connection.execute(`
      CREATE TABLE media (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        url TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('image', 'video')),
        content_type VARCHAR(100) NOT NULL,
        size_bytes INT NOT NULL,
        title VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

      console.log('✅ Media table created successfully!');
      break; 
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.message?.includes('already exists')) {
        console.log('✅ Media table already exists');
        break; 
      } else if (error.code === 'ER_CON_COUNT_ERROR' && retryCount < maxRetries - 1) {
        
        retryCount++;
        const waitTime = (retryCount * 2) * 1000; 
        console.log(`⚠️  Too many connections. Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      } else {
        console.error('❌ Error creating media table:', error.message);
        console.error('Error code:', error.code);
        throw error;
      }
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
}

async function main() {
  try {
    console.log('🚀 Creating media table in production database...\n');
    await createMediaTable();
    console.log('\n✅ Media table creation completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to create media table:', error.message);
    process.exit(1);
  }
}

main();
