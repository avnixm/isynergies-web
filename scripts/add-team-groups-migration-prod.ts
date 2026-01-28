/**
 * Create team_groups table and add group_id, group_order, is_featured to team_members
 * in the production database (Aiven MySQL).
 *
 * Usage: npm run add-team-groups-migration:prod
 * Or: npx tsx scripts/add-team-groups-migration-prod.ts
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

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

async function run() {
  console.log('📦 Adding team_groups table and columns to team_members (production)...\n');

  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection({
      ...PROD_DB_CONFIG,
      connectTimeout: 10000,
    });

    const db = PROD_DB_CONFIG.database;

    // 1) Create team_groups if not exists
    const [tables] = (await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'team_groups'`,
      [db]
    )) as [unknown[], unknown];
    if (Array.isArray(tables) && tables.length === 0) {
      await connection.execute(`
        CREATE TABLE team_groups (
          id int AUTO_INCREMENT NOT NULL,
          name varchar(255) NOT NULL,
          display_order int NOT NULL,
          created_at timestamp DEFAULT (CURRENT_TIMESTAMP),
          updated_at timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE (display_order)
        )
      `);
      console.log('✅ Created table team_groups');
    } else {
      console.log('✅ Table team_groups already exists');
    }

    // 2) Add group_id, group_order, is_featured to team_members if missing
    const [cols] = (await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'team_members'`,
      [db]
    )) as [{ COLUMN_NAME?: string }[], unknown];
    const names = (Array.isArray(cols) ? cols : []).map((c) => c?.COLUMN_NAME ?? '').filter(Boolean);

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

    console.log('\n✅ Team groups migration applied successfully to production.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('❌ Error:', msg);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

run();
