






import 'dotenv/config';
import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isynergies',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
};

async function run() {
  console.log('📦 Phase 1: Adding team_groups table and columns to team_members...\n');

  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(config);

    
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'team_groups'`,
      [config.database]
    );
    if (Array.isArray(tables) && tables.length === 0) {
      await connection.execute(`
        CREATE TABLE team_groups (
          id int AUTO_INCREMENT NOT NULL,
          name varchar(255) NOT NULL,
          display_order int NOT NULL,
          created_at timestamp DEFAULT (now()),
          updated_at timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE (display_order)
        )
      `);
      console.log('✅ Created table team_groups');
    } else {
      console.log('✅ Table team_groups already exists');
    }

    
    const [cols] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'team_members'`,
      [config.database]
    );
    const colNames = (Array.isArray(cols) ? cols : []) as { COLUMN_NAME?: string }[];
    const names = colNames.map((c) => c?.COLUMN_NAME ?? '').filter(Boolean);

    if (!names.includes('group_id')) {
      await connection.execute(`ALTER TABLE team_members ADD COLUMN group_id int`);
      console.log('✅ Added team_members.group_id');
    } else {
      console.log('✅ team_members.group_id already exists');
    }
    if (!names.includes('group_order')) {
      await connection.execute(`ALTER TABLE team_members ADD COLUMN group_order int`);
      console.log('✅ Added team_members.group_order');
    } else {
      console.log('✅ team_members.group_order already exists');
    }
    if (!names.includes('is_featured')) {
      await connection.execute(
        `ALTER TABLE team_members ADD COLUMN is_featured tinyint(1) NOT NULL DEFAULT 0`
      );
      console.log('✅ Added team_members.is_featured');
    } else {
      console.log('✅ team_members.is_featured already exists');
    }

    console.log('\n✅ Phase 1 migration applied successfully.');
  } catch (err: any) {
    console.error('❌ Error:', err?.message || err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

run();
