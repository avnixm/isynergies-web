import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth-middleware';
import { del } from '@vercel/blob';

/**
 * DELETE /api/admin/delete-blob
 * Deletes a file from Vercel Blob storage
 * 
 * Body:
 * {
 *   url: string (Vercel Blob URL to delete)
 * }
 */
export async function DELETE(request: Request) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'url is required and must be a string' },
        { status: 400 }
      );
    }

    // Only allow deletion of Vercel Blob URLs
    if (!url.startsWith('https://') || !url.includes('blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: 'Invalid blob URL. Only Vercel Blob URLs can be deleted.' },
        { status: 400 }
      );
    }

    // Delete the blob
    const timestamp = new Date().toISOString();
    console.log(`\n🗑️  [${timestamp}] MANUAL BLOB DELETION`);
    console.log(`   URL: ${url.substring(0, 80)}...`);
    
    await del(url);

    console.log(`   ✅ Successfully deleted blob`);
    console.log('='.repeat(80) + '\n');

    return NextResponse.json({ success: true, message: 'Blob deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting blob:', error);
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === 'development'
          ? error?.message || 'Failed to delete blob'
          : 'Failed to delete blob',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
        }),
      },
      { status: 500 }
    );
  }
}
