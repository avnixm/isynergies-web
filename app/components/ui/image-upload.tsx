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

    // Vercel has a 4.5 MB hard limit for request body
    // For files larger than 4 MB, we need to chunk them client-side
    const MAX_CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB per chunk (safe margin under 4.5 MB limit)
    const fileSize = file.size;

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      let imageId: string | null = null;

      if (fileSize > MAX_CHUNK_SIZE) {
        // Large file: chunk it client-side and upload in pieces
        const totalChunks = Math.ceil(fileSize / MAX_CHUNK_SIZE);
        const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        console.log(`Uploading large file in ${totalChunks} chunks...`);

        // Upload chunks sequentially
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * MAX_CHUNK_SIZE;
          const end = Math.min(start + MAX_CHUNK_SIZE, fileSize);
          const chunk = file.slice(start, end);

          const chunkFormData = new FormData();
          chunkFormData.append('file', chunk);
          chunkFormData.append('uploadId', uploadId);
          chunkFormData.append('chunkIndex', chunkIndex.toString());
          chunkFormData.append('totalChunks', totalChunks.toString());
          chunkFormData.append('fileName', file.name);
          chunkFormData.append('fileType', file.type);
          chunkFormData.append('fileSize', fileSize.toString());

          const response = await fetch('/api/admin/upload-chunk', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: chunkFormData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errorData.error || `Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`);
          }

          const data = await response.json();
          if (data.id) {
            imageId = String(data.id);
          }

          console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded`);
        }

        // Finalize the upload
        if (imageId) {
          const finalizeResponse = await fetch('/api/admin/upload-finalize', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ uploadId, imageId }),
          });

          if (!finalizeResponse.ok) {
            throw new Error('Failed to finalize upload');
          }
        }
      } else {
        // Small file: upload directly
        const formData = new FormData();
        formData.append('file', file);

        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorMessage = 'Upload failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `Upload failed with status ${response.status}`;
            console.error('Upload API error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
            });
          } catch (parseError) {
            let text = 'Unknown error';
            try {
              text = await response.text();
            } catch (textError) {
              text = response.statusText || 'Unknown error';
            }
            
            if (response.status === 403) {
              errorMessage = 'File too large. Maximum size is 4.5 MB per upload.';
            } else if (response.status === 401) {
              errorMessage = 'Unauthorized. Please log in again.';
            } else if (response.status === 500) {
              errorMessage = `Server error: ${text}`;
            } else {
              errorMessage = `Upload failed: ${response.status} ${response.statusText} - ${text}`;
            }
            
            console.error('Failed to parse error response:', parseError, 'Response text:', text);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Return the image ID (which is part of the URL path)
        const rawId = data.id ?? (data.url ? data.url.split('/').pop() : null);
        imageId = rawId != null ? String(rawId) : null;
        
        if (!imageId) {
          console.error('No image ID found in response:', data);
          throw new Error('No image ID returned from server');
        }
      }
      
      if (!imageId) {
        throw new Error('Failed to get image ID from upload');
      }
      
      onChange(imageId);
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.error('Upload error:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      let errorMessage = 'Failed to upload file';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Upload timed out. The file may be too large. Please try a smaller file or check your connection.';
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

