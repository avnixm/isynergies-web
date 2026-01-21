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
  timezone: '+00:00', // Tell mysql2 to treat returned timestamps as UTC
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // For cloud databases with self-signed certificates
  } : undefined,
  // Connection pool settings for handling large uploads
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0, // Unlimited queue for connection requests
  idleTimeout: 60000, // Close idle connections after 60 seconds
  // Timeout settings (in milliseconds)
  connectTimeout: 60000, // 60 seconds for initial connection
  // Enable connection reuse
  waitForConnections: true, // Queue connection requests when pool is exhausted
});

// Create the Drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Export the schema for use in other files
export * from './schema';
