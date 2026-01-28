import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { requireAuth } from '@/app/lib/auth-middleware';

/**
 * POST /api/admin/team-migrate
 *
 * One-time fix: ensures team_groups exists, team_members has group_id/group_order/is_featured,
 * then deletes all team data. Uses the same DB as the app (Vercel env).
 * Requires admin auth.
 */
export async function POST(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'isynergies',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } as const : undefined,
    connectTimeout: 10000,
  };

  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(config);
    const db = config.database;

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
    }

    // 2) Add group_id, group_order, is_featured to team_members if missing
    const [cols] = (await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'team_members'`,
      [db]
    )) as [{ COLUMN_NAME?: string }[], unknown];
    const names = (Array.isArray(cols) ? cols : []).map((c) => c?.COLUMN_NAME ?? '').filter(Boolean);

    if (!names.includes('group_id')) {
      await connection.execute(`ALTER TABLE team_members ADD COLUMN group_id int`);
    }
    if (!names.includes('group_order')) {
      await connection.execute(`ALTER TABLE team_members ADD COLUMN group_order int`);
    }
    if (!names.includes('is_featured')) {
      await connection.execute(
        `ALTER TABLE team_members ADD COLUMN is_featured tinyint(1) NOT NULL DEFAULT 0`
      );
    }

    // 3) Clear all team data
    const [dm] = await connection.execute<mysql.ResultSetHeader>(`DELETE FROM team_members`);
    const membersDeleted = dm?.affectedRows ?? 0;
    const [dg] = await connection.execute<mysql.ResultSetHeader>(`DELETE FROM team_groups`);
    const groupsDeleted = dg?.affectedRows ?? 0;

    return NextResponse.json({
      success: true,
      message: 'Team schema updated and data cleared.',
      membersDeleted,
      groupsDeleted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('team-migrate error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
