import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { requireAuth } from '@/app/lib/auth-middleware';








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
  const created: string[] = [];

  try {
    connection = await mysql.createConnection(config);
    const db = config.database;

    const [tables] = (await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('about_us_gallery_images', 'featured_app_carousel_images')`,
      [db]
    )) as [{ TABLE_NAME?: string }[], unknown];
    const existing = (Array.isArray(tables) ? tables : []).map((t) => t?.TABLE_NAME ?? '').filter(Boolean);

    if (!existing.includes('about_us_gallery_images')) {
      await connection.execute(`
        CREATE TABLE about_us_gallery_images (
          id int AUTO_INCREMENT NOT NULL,
          image varchar(255) NOT NULL,
          alt varchar(255) NOT NULL DEFAULT 'About Us gallery image',
          display_order int NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT (CURRENT_TIMESTAMP),
          updated_at timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);
      created.push('about_us_gallery_images');
    }

    if (!existing.includes('featured_app_carousel_images')) {
      await connection.execute(`
        CREATE TABLE featured_app_carousel_images (
          id int AUTO_INCREMENT NOT NULL,
          image varchar(255) NOT NULL,
          alt varchar(255) NOT NULL DEFAULT 'Featured app carousel image',
          media_type varchar(20) DEFAULT 'image',
          display_order int NOT NULL DEFAULT 0,
          created_at timestamp DEFAULT (CURRENT_TIMESTAMP),
          updated_at timestamp DEFAULT (CURRENT_TIMESTAMP) ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);
      created.push('featured_app_carousel_images');
    }

    return NextResponse.json({
      success: true,
      message: created.length ? `Created tables: ${created.join(', ')}` : 'All tables already exist.',
      created,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('schema-ensure error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
