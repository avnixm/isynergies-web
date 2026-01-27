/**
 * Unified API error response utilities
 * Ensures consistent error format across all API routes
 */

import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
  stack?: string;
}

/**
 * Create a standardized error response
 * 
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Optional error code
 * @param includeDetails - Include stack/details in development
 * @returns NextResponse with error JSON
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  includeDetails: boolean = process.env.NODE_ENV === 'development'
): NextResponse {
  const error: ApiError = {
    error: message,
  };

  if (code) {
    error.code = code;
  }

  if (includeDetails) {
    // Stack trace would be added by caller if needed
  }

  return NextResponse.json(error, { status });
}

/**
 * Create a 400 Bad Request error
 */
export function badRequest(message: string, code?: string): NextResponse {
  return createErrorResponse(message, 400, code);
}

/**
 * Create a 401 Unauthorized error
 */
export function unauthorized(message: string = 'Authentication required'): NextResponse {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Create a 403 Forbidden error
 */
export function forbidden(message: string = 'Access forbidden'): NextResponse {
  return createErrorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Create a 404 Not Found error
 */
export function notFound(message: string = 'Resource not found'): NextResponse {
  return createErrorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Create a 500 Internal Server Error
 */
export function internalError(
  message: string = 'Internal server error',
  details?: string
): NextResponse {
  const error: ApiError = {
    error: message,
    code: 'INTERNAL_ERROR',
  };

  if (process.env.NODE_ENV === 'development' && details) {
    error.details = details;
  }

  return NextResponse.json(error, { status: 500 });
}
