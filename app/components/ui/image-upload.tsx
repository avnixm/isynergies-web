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

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutes timeout

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Return the image ID (which is part of the URL path)
      const rawId = data.id ?? (data.url ? data.url.split('/').pop() : null);
      const imageId = rawId != null ? String(rawId) : null;
      
      if (!imageId) {
        console.error('No image ID found in response:', data);
        throw new Error('No image ID returned from server');
      }
      
      onChange(imageId);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Upload error:', error);
      let errorMessage = 'Failed to upload file';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Upload timed out. The file may be too large. Please try a smaller file or check your connection.';
        } else {
          errorMessage = error.message;
        }
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

