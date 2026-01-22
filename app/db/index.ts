import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Create the connection pool with better connection management
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
  // Connection pool settings - reduced to prevent "too many connections" error
  connectionLimit: 5, // Reduced from 10 to prevent connection exhaustion
  queueLimit: 0, // Unlimited queue for connection requests
  idleTimeout: 60000, // Close idle connections after 1 minute (reduced from 5 minutes)
  // Timeout settings (in milliseconds)
  connectTimeout: 10000, // 10 seconds for initial connection (reduced from 2 minutes)
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
