/**
 * Centralized logging utility
 * Replaces console.log statements with environment-aware logging
 */

import { config } from './config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

const shouldLog = (level: LogLevel): boolean => {
  if (config.isProduction) {
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }
  // In development, log everything
  return true;
};

export const logger: Logger = {
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },

  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  error: (message: string, ...args: any[]) => {
    // Always log errors, even in production
    console.error(`[ERROR] ${message}`, ...args);
  },
};

/**
 * Log upload-related operations
 */
export const uploadLogger = {
  start: (filename: string, size: number) => {
    logger.debug(`Upload started: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);
  },
  progress: (filename: string, percentage: number) => {
    logger.debug(`Upload progress: ${filename} - ${Math.round(percentage)}%`);
  },
  complete: (filename: string, url: string) => {
    logger.info(`Upload complete: ${filename} → ${url.substring(0, 50)}...`);
  },
  error: (filename: string, error: Error | string) => {
    logger.error(`Upload failed: ${filename}`, error);
  },
};

/**
 * Log database operations
 */
export const dbLogger = {
  query: (operation: string, details?: any) => {
    logger.debug(`DB ${operation}`, details);
  },
  error: (operation: string, error: Error | string) => {
    logger.error(`DB ${operation} failed`, error);
  },
};
