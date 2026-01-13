import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Create the connection pool
const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isynergies',
});

// Create the Drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Export the schema for use in other files
export * from './schema';
