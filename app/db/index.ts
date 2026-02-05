import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';


const isDevelopment = process.env.NODE_ENV === 'development';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value || '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseNonNegativeInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value || '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}




const resolvedConnectionLimit = parsePositiveInt(
  process.env.DB_CONNECTION_LIMIT,
  isDevelopment ? 5 : 10
);

const resolvedQueueLimit = parseNonNegativeInt(
  process.env.DB_QUEUE_LIMIT,
  isDevelopment ? 10 : 100
);

if (isDevelopment) {
  console.log('[DB] Using pool limits', {
    connectionLimit: resolvedConnectionLimit,
    queueLimit: resolvedQueueLimit,
  });
} else if (resolvedQueueLimit < 10) {
  console.warn(
    '[DB] DB_QUEUE_LIMIT is very low; chunked uploads and range requests may see queue errors under burst traffic.',
    { queueLimit: resolvedQueueLimit }
  );
}

const connection = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isynergies',
  timezone: '+00:00', 
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, 
  } : undefined,
  // MySQL2 pool sizing:
  // - cPanel/PM2 runs as a long-lived Node process, so we can safely use a higher pool size.
  // - Very small limits cause "Queue limit reached" under normal burst traffic (range requests, admin dashboard loads).
  connectionLimit: resolvedConnectionLimit,
  // 0 = unlimited in mysql2; use a higher default instead of a tiny queue to avoid hard failures.
  queueLimit: resolvedQueueLimit,
  idleTimeout: 5000,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '15000', 10), 
  waitForConnections: true, 
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});


export const db = drizzle(connection, { schema, mode: 'default' });


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
      
      
      const isConnectionError = 
        error?.code === 'ER_CON_COUNT_ERROR' ||
        error?.sqlMessage?.includes('Too many connections') ||
        error?.message?.includes('No connections available') ||
        error?.code === 'ECONNRESET' ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'PROTOCOL_CONNECTION_LOST';
      
      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }
      
      
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.warn(`Database connection error (attempt ${attempt}/${maxRetries}), retrying in ${waitTime}ms...`, error?.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}


export async function closeDatabaseConnections() {
  try {
    await connection.end();
    console.log('Database connections closed');
  } catch (error) {
    console.error('Error closing database connections:', error);
  }
}


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


export * from './schema';
