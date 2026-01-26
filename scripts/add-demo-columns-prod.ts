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

async function addDemoColumns() {
  console.log('📦 Adding demo-related columns to contact_messages table in production database...');
  
  let connection;
  try {
    connection = await mysql.createConnection(PROD_DB_CONFIG);
    
    const columnsToAdd = [
      { name: 'wants_demo', type: 'BOOLEAN DEFAULT FALSE', after: 'project_title' },
      { name: 'demo_month', type: 'VARCHAR(2) NULL', after: 'wants_demo' },
      { name: 'demo_day', type: 'VARCHAR(2) NULL', after: 'demo_month' },
      { name: 'demo_year', type: 'VARCHAR(4) NULL', after: 'demo_day' },
      { name: 'demo_time', type: 'VARCHAR(50) NULL', after: 'demo_year' },
    ];
    
    for (const column of columnsToAdd) {
      // Check if column exists
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'contact_messages' 
        AND COLUMN_NAME = ?
      `, [PROD_DB_CONFIG.database, column.name]);
      
      if (Array.isArray(columns) && columns.length > 0) {
        console.log(`✅ Column ${column.name} already exists`);
        continue;
      }
      
      // Add the column
      try {
        await connection.execute(`
          ALTER TABLE contact_messages 
          ADD COLUMN ${column.name} ${column.type}
          ${column.after ? `AFTER ${column.after}` : ''}
        `);
        console.log(`✅ Successfully added ${column.name} column!`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`✅ Column ${column.name} already exists`);
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function main() {
  try {
    console.log('🚀 Adding demo columns to production database...\n');
    await addDemoColumns();
    console.log('\n✅ Column addition completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Failed to add columns:', error.message);
    process.exit(1);
  }
}

main();
