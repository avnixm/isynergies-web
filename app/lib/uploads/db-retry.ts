/**
 * Retry utility for database operations with exponential backoff
 * Used to handle transient DB failures during upload callbacks
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a database operation with exponential backoff
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 10000, // 10 seconds
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All retries exhausted, throw the last error
  throw lastError || new Error('Operation failed after retries');
}

/**
 * Check if an error is retryable (transient database error)
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  // MySQL connection errors
  const retryableCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ER_LOCK_WAIT_TIMEOUT',
    'ER_LOCK_DEADLOCK',
    'ER_QUERY_INTERRUPTED',
  ];

  // Check error code
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }

  // Check error message for transient issues
  const errorMessage = error.message?.toLowerCase() || '';
  const retryableMessages = [
    'connection',
    'timeout',
    'deadlock',
    'lock wait',
    'temporary',
    'try again',
  ];

  return retryableMessages.some(msg => errorMessage.includes(msg));
}
