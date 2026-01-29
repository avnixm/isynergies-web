import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isynergies',
  ssl: process.env.DB_SSL === 'true' ? ({ rejectUnauthorized: false } as const) : undefined,
  connectTimeout: 10000,
};

export async function ensureServicesTables(): Promise<void> {
  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection(config);
    const db = config.database;
    const [tables] = (await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('services_list', 'services_section')`,
      [db]
    )) as [{ TABLE_NAME?: string }[], unknown];
    const existing = (Array.isArray(tables) ? tables : []).map((t) => t?.TABLE_NAME ?? '').filter(Boolean);

    if (!existing.includes('services_list')) {
      await connection.execute(`
        CREATE TABLE services_list (
          id int AUTO_INCREMENT NOT NULL,
          label varchar(255) NOT NULL,
          display_order int NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT (CURRENT_TIMESTAMP),
          updated_at timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);
    }

    if (!existing.includes('services_section')) {
      await connection.execute(`
        CREATE TABLE services_section (
          id int AUTO_INCREMENT NOT NULL,
          title varchar(255) NOT NULL DEFAULT 'Our Services',
          description text NOT NULL,
          updated_at timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);
    }
  } finally {
    if (connection) await connection.end();
  }
}
