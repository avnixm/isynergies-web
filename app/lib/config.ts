/**
 * Centralized configuration and environment checks
 * Use this module for feature flags and environment gating
 */

export const config = {
  /**
   * Environment checks
   */
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  /**
   * Feature flags
   */
  enableTestApi: process.env.NEXT_PUBLIC_ENABLE_TEST_API === 'true',
  
  /**
   * Upload configuration
   */
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    chunkSize: 2 * 1024 * 1024, // 2MB base64 chunks
    allowedImageTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml'],
    allowedVideoTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg'],
  },

  /**
   * Database configuration
   */
  db: {
    uploadSessionExpiryHours: 24,
  },

  /**
   * Logging configuration
   */
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  },
} as const;
