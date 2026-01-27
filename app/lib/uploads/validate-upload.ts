/**
 * Upload validation utilities
 */

import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_MEDIA_TYPES, detectMimeType } from './mime-types';
import { config } from '@/app/lib/config';

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

/**
 * Validate file for upload
 * 
 * @param file - File object to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateUpload(
  file: File,
  allowedTypes: readonly string[] = ALLOWED_MEDIA_TYPES,
  maxSize: number = config.upload.maxFileSize
): UploadValidationResult {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Detect MIME type
  const detectedType = detectMimeType(file, file.name);

  // Check if type is allowed
  if (!allowedTypes.includes(detectedType)) {
    return {
      valid: false,
      error: `File type ${detectedType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      detectedType,
    };
  }

  return {
    valid: true,
    detectedType,
  };
}

/**
 * Validate image upload
 */
export function validateImageUpload(file: File): UploadValidationResult {
  return validateUpload(file, ALLOWED_IMAGE_TYPES);
}

/**
 * Validate video upload
 */
export function validateVideoUpload(file: File): UploadValidationResult {
  return validateUpload(file, ALLOWED_VIDEO_TYPES);
}
