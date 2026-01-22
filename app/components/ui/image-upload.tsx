'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';
import { upload } from '@vercel/blob/client';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  acceptVideo?: boolean; // Allow video files
  mediaType?: 'image' | 'video'; // Current media type for preview
}

export function ImageUpload({ value, onChange, disabled, acceptVideo = false, mediaType }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);

    const token = localStorage.getItem('admin_token');
    if (!token) {
      setUploading(false);
      alert('No authentication token found. Please log in again.');
      return;
    }

    try {
      // Use Vercel Blob for direct client-side upload
      // This bypasses Vercel's 4.5 MB serverless limit and avoids database connection issues
      const timestamp = Date.now();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const pathname = `uploads/${timestamp}-${sanitizedFilename}`;

      console.log(`Uploading file to Vercel Blob: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Upload directly to Vercel Blob using client-side upload
      // This supports multipart uploads for large files (up to 5 TB)
      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload-blob',
        multipart: file.size > 10 * 1024 * 1024, // Use multipart for files > 10 MB
        clientPayload: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });

      console.log('File uploaded to Vercel Blob:', blob.url);

      // The onUploadCompleted callback in the API route should have saved the blob URL to the database
      // Wait a moment for the database save to complete, then query for the image ID
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Query the database to find the image by URL (with retries)
      let imageId: string | null = null;
      let retries = 3;
      
      while (!imageId && retries > 0) {
        const findImageResponse = await fetch(`/api/admin/find-image-by-url?url=${encodeURIComponent(blob.url)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (findImageResponse.ok) {
          const imageData = await findImageResponse.json();
          imageId = imageData.id ? String(imageData.id) : null;
        }

        if (!imageId) {
          retries--;
          if (retries > 0) {
            console.log(`Image not found, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }

      // If we still couldn't find it, create it manually (fallback)
      if (!imageId) {
        console.warn('Image not found in database after upload, creating record...');
        const createResponse = await fetch('/api/admin/create-image-from-blob', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            url: blob.url,
          }),
        });

        if (createResponse.ok) {
          const createData = await createResponse.json();
          imageId = createData.id ? String(createData.id) : null;
        }
      }

      if (!imageId) {
        throw new Error('Failed to get image ID after upload. The file was uploaded but could not be saved to the database.');
      }

      onChange(imageId);
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      let errorMessage = 'Failed to upload file';
      if (error instanceof Error) {
        if (error.message.includes('token') || error.message.includes('unauthorized')) {
          errorMessage = 'Unauthorized. Please log in again.';
        } else if (error.message && error.message !== 'Upload failed') {
          errorMessage = error.message;
        } else {
          errorMessage = `Upload failed: ${error.message || 'Unknown error'}`;
        }
      } else {
        errorMessage = `Upload failed: ${String(error)}`;
      }
      
      alert(`Upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptVideo
      ? {
          'image/png': ['.png'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/gif': ['.gif'],
          'image/webp': ['.webp'],
          'image/svg+xml': ['.svg'],
          'video/mp4': ['.mp4'],
          'video/webm': ['.webm'],
          'video/quicktime': ['.mov'],
        }
      : {
          'image/png': ['.png'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/gif': ['.gif'],
          'image/webp': ['.webp'],
          'image/svg+xml': ['.svg'],
        },
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  // Construct proper image/video URL for display
  const displayUrl = value
    ? (typeof value === 'string' && (value.startsWith('/api/images/') || value.startsWith('http'))
        ? value 
        : `/api/images/${value}`)
    : '';

  // Check if it's a video file - use mediaType prop if available, otherwise check URL
  const isVideo = mediaType === 'video' || (displayUrl && (displayUrl.endsWith('.mp4') || displayUrl.endsWith('.webm') || displayUrl.endsWith('.mov') || displayUrl.includes('video')));

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-muted/30">
          {isVideo ? (
            <video
              src={displayUrl}
              controls
              className="w-full h-full object-contain"
            />
          ) : (
            <Image
              src={displayUrl}
              alt="Upload"
              fill
              className="object-contain"
              unoptimized
            />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            aria-label="Delete media"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition",
            isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                {isDragActive ? (
                  <>
                    <Upload className="h-12 w-12 text-blue-500" />
                    <p className="text-sm text-blue-600 font-medium">Drop the {acceptVideo ? 'file' : 'image'} here</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      {acceptVideo ? 'PNG, JPG, JPEG, GIF, WEBP, SVG, MP4, WEBM, MOV' : 'PNG, JPG, JPEG, GIF, WEBP, SVG'}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

