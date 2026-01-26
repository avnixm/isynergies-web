'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  acceptVideo?: boolean; // Allow video files
  mediaType?: 'image' | 'video'; // Current media type for preview
}

export function ImageUpload({ value, onChange, disabled, acceptVideo = false, mediaType }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

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
      console.log(`Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      // For videos, use Vercel Blob direct upload via handleUpload pattern
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo && acceptVideo) {
        // Use Vercel Blob client upload pattern
        setUploadProgress('Uploading to Vercel Blob...');
        
        // Import the upload function dynamically to avoid SSR issues
        const { upload } = await import('@vercel/blob/client');
        
        // Upload directly to Vercel Blob using the client upload endpoint
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/videos/upload',
          clientPayload: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
          }),
          onUploadProgress: (progress) => {
            const percentage = progress.percentage || 0;
            setUploadProgress(`Uploading: ${Math.round(percentage)}%`);
          },
        });

        if (!blob || !blob.url) {
          throw new Error('Upload failed: No blob URL returned');
        }

        // The blob URL is automatically saved to the database in the onUploadCompleted callback
        // We need to find the image ID that was created by querying for the blob URL
        setUploadProgress('Saving metadata...');
        
        // Retry logic to find the image ID (database write might take a moment)
        let imageId: string | null = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
          
          const findImageResponse = await fetch(`/api/admin/find-image-by-url?url=${encodeURIComponent(blob.url)}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (findImageResponse.ok) {
            const imageData = await findImageResponse.json();
            if (imageData.id) {
              imageId = String(imageData.id);
              break;
            }
          }
        }

        if (imageId) {
          // Store the image ID (compatible with existing system)
          onChange(imageId);
        } else {
          // Fallback: store blob URL directly (Hero component handles http URLs)
          console.warn('Could not find image ID for blob URL, storing URL directly:', blob.url);
          onChange(blob.url);
        }
        
        setUploadProgress('');
        return;
      }

      // For images, use the existing upload flow
      // Vercel has a 4.5MB limit, and MySQL has max_allowed_packet limits
      // Base64 encoding increases size by ~33%, so we need smaller chunks
      // Use 1MB raw chunks = ~1.33MB base64 (safe for both Vercel and MySQL)
      const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB raw chunks (~1.33MB base64)
      const useChunkedUpload = file.size > 4 * 1024 * 1024; // 4MB threshold

      if (useChunkedUpload) {
        // Chunked upload for large files
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        let imageId: number | null = null;

        console.log(`File is large (${(file.size / 1024 / 1024).toFixed(2)} MB), using chunked upload (${totalChunks} chunks)`);
        setUploadProgress(`Uploading chunk 1/${totalChunks}...`);

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          setUploadProgress(`Uploading chunk ${chunkIndex + 1}/${totalChunks}...`);
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const chunkFormData = new FormData();
          chunkFormData.append('file', chunk);
          chunkFormData.append('uploadId', uploadId);
          chunkFormData.append('chunkIndex', chunkIndex.toString());
          chunkFormData.append('totalChunks', totalChunks.toString());
          chunkFormData.append('fileName', file.name);
          chunkFormData.append('fileType', file.type);
          chunkFormData.append('fileSize', file.size.toString());

          const chunkResponse = await fetch('/api/admin/upload-chunk', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: chunkFormData,
          });

          if (!chunkResponse.ok) {
            const errorData = await chunkResponse.json().catch(() => ({ error: 'Chunk upload failed' }));
            throw new Error(errorData.error || `Chunk ${chunkIndex + 1}/${totalChunks} upload failed with status ${chunkResponse.status}`);
          }

          const chunkData = await chunkResponse.json();
          if (chunkIndex === 0) {
            imageId = chunkData.id;
          }

          console.log(`Uploaded chunk ${chunkIndex + 1}/${totalChunks}`);
        }

        if (!imageId) {
          throw new Error('Upload succeeded but no image ID was returned');
        }

        // Finalize the upload to clean up filename and verify all chunks
        const finalizeResponse = await fetch('/api/admin/upload-finalize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uploadId,
            imageId,
          }),
        });

        if (!finalizeResponse.ok) {
          const errorData = await finalizeResponse.json().catch(() => ({ error: 'Finalization failed' }));
          throw new Error(errorData.error || 'Failed to finalize upload');
        }

        console.log('Upload finalized successfully');
        setUploadProgress('');
        onChange(String(imageId));
      } else {
        // Direct upload for small files
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
          throw new Error(errorData.error || `Upload failed with status ${uploadResponse.status}`);
        }

        const uploadData = await uploadResponse.json();
        
        if (!uploadData.id) {
          throw new Error('Upload succeeded but no image ID was returned');
        }

        onChange(String(uploadData.id));
      }
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
      setUploadProgress('');
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
                <p className="text-sm text-gray-600">{uploadProgress || 'Uploading...'}</p>
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

