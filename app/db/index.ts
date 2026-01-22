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
  queueLimit: 3, // Reduced queue limit to fail fast when pool is exhausted
  idleTimeout: 5000, // Close idle connections after 5 seconds (very aggressive for serverless - Vercel recommendation)
  // Timeout settings (in milliseconds)
  connectTimeout: 3000, // 3 seconds for initial connection (faster timeout)
  // Enable connection reuse
  waitForConnections: false, // Don't queue - fail fast if connection unavailable (prevents connection buildup)
  // Automatically close idle connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Create the Drizzle instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Helper function to execute queries with retry logic for connection errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on connection-related errors
      const isConnectionError = 
        error?.code === 'ER_CON_COUNT_ERROR' ||
        error?.sqlMessage?.includes('Too many connections') ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'PROTOCOL_CONNECTION_LOST';
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.warn(`Database connection error (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`, error?.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

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
