




import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  details?: string;
  stack?: string;
}










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
    
  }

  return NextResponse.json(error, { status });
}




export function badRequest(message: string, code?: string): NextResponse {
  return createErrorResponse(message, 400, code);
}




export function unauthorized(message: string = 'Authentication required'): NextResponse {
  return createErrorResponse(message, 401, 'UNAUTHORIZED');
}




export function forbidden(message: string = 'Access forbidden'): NextResponse {
  return createErrorResponse(message, 403, 'FORBIDDEN');
}




export function notFound(message: string = 'Resource not found'): NextResponse {
  return createErrorResponse(message, 404, 'NOT_FOUND');
}




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
