/**
 * MIME type detection and validation utilities
 * Centralized MIME type mapping to avoid duplication
 */

export interface MimeTypeMap {
  [extension: string]: string;
}

/**
 * MIME type mapping by file extension
 */
export const MIME_TYPE_MAP: MimeTypeMap = {
  // Images
  'png': 'image/png',
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  
  // Videos
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  'mkv': 'video/x-matroska',
  'mpeg': 'video/mpeg',
  'mpg': 'video/mpeg',
};

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
] as const;

/**
 * Allowed video MIME types
 */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/mpeg',
] as const;

/**
 * All allowed media types (images + videos)
 */
export const ALLOWED_MEDIA_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_VIDEO_TYPES,
] as const;

/**
 * Detect MIME type from file extension
 * 
 * @param filename - File name or path
 * @param fallback - Default MIME type if detection fails
 * @returns Detected MIME type or fallback
 */
export function detectMimeTypeFromExtension(
  filename: string,
  fallback: string = 'application/octet-stream'
): string {
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) {
    return fallback;
  }
  
  return MIME_TYPE_MAP[extension] || fallback;
}

/**
 * Detect MIME type from file, with fallback to extension detection
 * 
 * @param file - File object with type property
 * @param filename - File name for extension fallback
 * @returns Detected MIME type
 */
export function detectMimeType(
  file: { type?: string },
  filename: string
): string {
  // Use file.type if available and not generic
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }
  
  // Fallback to extension detection
  return detectMimeTypeFromExtension(filename);
}

/**
 * Check if MIME type is an image
 */
export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if MIME type is a video
 */
export function isVideoType(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Check if MIME type is allowed
 */
export function isAllowedType(mimeType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(mimeType);
}
