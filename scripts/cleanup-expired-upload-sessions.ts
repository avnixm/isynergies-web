import 'dotenv/config';
import { db } from '../app/db';
import { uploadSessions } from '../app/db/schema';
import { eq, and, lt, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * Cleanup expired upload sessions
 * Run periodically (e.g., daily cron job)
 * Deletes sessions that are:
 * - Expired (expires_at < now) AND (status = 'complete' OR status = 'failed')
 * - Older than 7 days regardless of status
 * 
 * Run with: pnpm run cleanup-expired-upload-sessions
 * Or: pnpm tsx scripts/cleanup-expired-upload-sessions.ts
 */

async function cleanupExpiredSessions() {
  try {
    console.log('Cleaning up expired upload sessions...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Delete expired sessions that are complete or failed
    const expiredResult = await db
      .delete(uploadSessions)
      .where(
        and(
          sql`${uploadSessions.expiresAt} < ${now}`,
          or(
            eq(uploadSessions.status, 'complete'),
            eq(uploadSessions.status, 'failed')
          )
        )
      );

    console.log(`Deleted ${expiredResult.rowCount || 0} expired sessions`);

    // Delete sessions older than 7 days regardless of status
    const oldResult = await db
      .delete(uploadSessions)
      .where(sql`${uploadSessions.createdAt} < ${sevenDaysAgo}`);

    console.log(`Deleted ${oldResult.rowCount || 0} old sessions`);

    console.log('✅ Cleanup completed successfully');
  } catch (error: any) {
    console.error('❌ Error cleaning up sessions:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

cleanupExpiredSessions();
