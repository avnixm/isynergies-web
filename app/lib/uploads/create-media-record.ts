/**
 * Utilities for creating media records in the database
 */

import { db } from '@/app/db';
import { media } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { retryDbOperation, isRetryableError } from './db-retry';

export interface CreateMediaRecordParams {
  userId: number;
  url: string;
  type: 'image' | 'video';
  contentType: string;
  sizeBytes: number;
  title?: string;
}

export interface MediaRecord {
  id: number;
  url: string;
  type: string;
  contentType: string;
  sizeBytes: number;
  title?: string | null;
}

/**
 * Create a media record in the database with retry logic
 * 
 * @param params - Media record parameters
 * @returns Created media record
 * @throws Error if creation fails after retries
 */
export async function createMediaRecord(
  params: CreateMediaRecordParams
): Promise<MediaRecord> {
  const { userId, url, type, contentType, sizeBytes, title } = params;

  return retryDbOperation(
    async () => {
      const result = await db.insert(media).values({
        userId,
        url,
        type,
        contentType,
        sizeBytes,
        title: title || null,
      }).$returningId();

      const mediaId = result[0]?.id;
      if (!mediaId) {
        throw new Error('Failed to create media record: No ID returned');
      }

      // Fetch the created record to return full data
      const [created] = await db
        .select()
        .from(media)
        .where(eq(media.id, mediaId))
        .limit(1);

      if (!created) {
        throw new Error('Failed to retrieve created media record');
      }

      return {
        id: created.id,
        url: created.url,
        type: created.type,
        contentType: created.contentType,
        sizeBytes: created.sizeBytes,
        title: created.title,
      };
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      onRetry: (attempt, error) => {
        if (isRetryableError(error)) {
          console.warn(`Retrying media record creation (attempt ${attempt}):`, error.message);
        } else {
          // Non-retryable error, throw immediately
          throw error;
        }
      },
    }
  );
}
