import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Create the connection pool optimized for serverless environments (Vercel production)
// These settings apply to both development and production
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
  // Connection pool settings optimized for serverless (Vercel production)
  // Each serverless function instance gets its own pool, so we need very low limits
  // This prevents "Too many connections" errors in production
  connectionLimit: 1, // Single connection per instance to minimize total connections
  queueLimit: 10, // Limit queue to prevent memory issues
  idleTimeout: 20000, // Close idle connections after 20 seconds (faster cleanup for production)
  // Timeout settings (in milliseconds)
  connectTimeout: 5000, // 5 seconds for initial connection
  // Enable connection reuse
  waitForConnections: true, // Queue connection requests when pool is exhausted
  // Automatically close idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Create the Drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Graceful shutdown function to close all connections
export async function closeDatabaseConnections() {
  try {
    await connection.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}

// Handle process termination to close connections
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await closeDatabaseConnections();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await closeDatabaseConnections();
    process.exit(0);
  });
}

// Export the schema for use in other files
export * from './schema';
