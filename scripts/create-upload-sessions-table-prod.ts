import 'dotenv/config';
import { db } from '../app/db';
import { sql } from 'drizzle-orm';







async function createUploadSessionsTable() {
  try {
    console.log('Creating upload_sessions table...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS upload_sessions (
        id VARCHAR(100) PRIMARY KEY,
        user_id INT NOT NULL,
        filename_original VARCHAR(255) NOT NULL,
        content_type VARCHAR(100) NOT NULL,
        size_bytes INT,
        status VARCHAR(20) NOT NULL DEFAULT 'initiated',
        image_id INT,
        chunk_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ upload_sessions table created successfully');
  } catch (error: any) {
    console.error('❌ Error creating upload_sessions table:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createUploadSessionsTable();
