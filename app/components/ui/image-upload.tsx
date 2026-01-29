'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/app/lib/utils';
import { MediaPreview } from './media-preview';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  acceptVideo?: boolean; 
  mediaType?: 'image' | 'video'; 
}

export function ImageUpload({ value, onChange, disabled, acceptVideo = false, mediaType }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [detectedMediaType, setDetectedMediaType] = useState<'image' | 'video' | null>(null);

  
  const deleteOldBlob = useCallback(async (oldUrl: string, token: string) => {
    
    if (oldUrl && oldUrl.startsWith('https://') && oldUrl.includes('blob.vercel-storage.com')) {
      try {
        console.log(`[Blob Cleanup] Deleting old blob: ${oldUrl.substring(0, 60)}...`);
        const deleteResponse = await fetch('/api/admin/delete-blob', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ url: oldUrl }),
        });

        if (deleteResponse.ok) {
          const result = await deleteResponse.json().catch(() => ({}));
          console.log(`[Blob Cleanup] ✓ Successfully deleted old blob: ${oldUrl.substring(0, 60)}...`);
          return true;
        } else {
          const errorData = await deleteResponse.json().catch(() => ({ error: 'Failed to delete blob' }));
          console.warn(`[Blob Cleanup] ✗ Failed to delete old blob: ${errorData.error || 'Unknown error'}`);
          return false;
        }
      } catch (deleteError: any) {
        console.warn(`[Blob Cleanup] ✗ Error deleting old blob: ${deleteError?.message || String(deleteError)}`);
        return false;
      }
    } else {
      console.log(`[Blob Cleanup] Skipping deletion - not a Vercel Blob URL: ${oldUrl?.substring(0, 60) || 'null'}...`);
      return false;
    }
  }, []);

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

    
    const oldValue = value;
    let oldBlobUrl: string | null = null;

    
    if (oldValue) {
      if (oldValue.startsWith('https://') && oldValue.includes('blob.vercel-storage.com')) {
        
        oldBlobUrl = oldValue;
      } else if (oldValue.match(/^\d+$/)) {
        
        try {
          
          const mediaResponse = await fetch(`/api/admin/media/${oldValue}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData?.url && mediaData.url.startsWith('https://') && mediaData.url.includes('blob.vercel-storage.com')) {
              oldBlobUrl = mediaData.url;
            }
          } else {
            
            try {
              const imageRecordResponse = await fetch(`/api/admin/images/${oldValue}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              if (imageRecordResponse.ok) {
                const imageRecord = await imageRecordResponse.json();
                if (imageRecord?.url && imageRecord.url.startsWith('https://') && imageRecord.url.includes('blob.vercel-storage.com')) {
                  oldBlobUrl = imageRecord.url;
                  console.log(`Resolved image ID ${oldValue} to blob URL: ${imageRecord.url.substring(0, 50)}...`);
                }
              }
            } catch (e) {
              console.warn(`Failed to resolve image ID ${oldValue} to blob URL:`, e);
              
            }
          }
        } catch (e) {
          
        }
      }
    }

    try {
      console.log(`Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo && acceptVideo) {
        
        setUploadProgress('Uploading to Vercel Blob...');
        
        
        const { upload } = await import('@vercel/blob/client');
        
        
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/videos/upload',
          clientPayload: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            size: file.size,
            oldBlobUrl: oldBlobUrl, 
          }),
          onUploadProgress: (progress) => {
            const percentage = progress.percentage || 0;
            setUploadProgress(`Uploading: ${Math.round(percentage)}%`);
          },
        });

        if (!blob || !blob.url) {
          throw new Error('Upload failed: No blob URL returned');
        }

        
        
        setUploadProgress('Creating media record...');
        
        try {
          
          const createMediaResponse = await fetch('/api/admin/media', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              url: blob.url, 
              contentType: file.type,
              sizeBytes: file.size,
              title: file.name,
            }),
          });

          if (!createMediaResponse.ok) {
            const errorData = await createMediaResponse.json().catch(() => ({ error: 'Failed to create media record' }));
            throw new Error(errorData.error || `Failed to create media record: ${createMediaResponse.status}`);
          }

          const mediaData = await createMediaResponse.json();
          
          if (mediaData.id) {
            
            console.log(`Created media record: ID ${mediaData.id}, type ${mediaData.type}`);
            onChange(String(mediaData.id));
            
            
            if (oldBlobUrl) {
              await deleteOldBlob(oldBlobUrl, token);
            }
          } else {
            throw new Error('Media record created but no ID returned');
          }
        } catch (mediaError: any) {
          console.error('Error creating media record:', mediaError);
          
          console.warn('Falling back to storing blob URL directly:', blob.url);
          onChange(blob.url);
          
          
          if (oldBlobUrl) {
            await deleteOldBlob(oldBlobUrl, token);
          }
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
        
        // Delete old blob after successful upload
        if (oldBlobUrl) {
          await deleteOldBlob(oldBlobUrl, token);
        }
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
        
        
        if (oldBlobUrl) {
          await deleteOldBlob(oldBlobUrl, token);
        }
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
  }, [onChange, value, deleteOldBlob]);

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

  
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');
  const [resolvedMediaType, setResolvedMediaType] = useState<'image' | 'video' | null>(null);
  const [isFetchingMedia, setIsFetchingMedia] = useState(false);

  
  useEffect(() => {
    if (value && value.match(/^\d+$/)) {
      
      setIsFetchingMedia(true);
      const fetchMediaRecord = async () => {
        try {
          const token = localStorage.getItem('admin_token');
          if (!token) {
            
            console.log('No auth token, falling back to /api/images/ route');
            setIsFetchingMedia(false);
            return;
          }

          console.log(`Fetching media record for ID: ${value}`);
          const response = await fetch(`/api/admin/media/${value}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const mediaRecord = await response.json();
            
            if (mediaRecord && mediaRecord.url) {
              
              console.log(`Resolved media ID ${value} to URL: ${mediaRecord.url.substring(0, 50)}...`);
              setResolvedMediaUrl(mediaRecord.url);
              setResolvedMediaType(mediaRecord.type);
            } else {
              console.warn(`Media record ${value} found but has no URL`);
            }
          } else if (response.status === 404) {
            
            console.log(`Media ID ${value} not found in media table, falling back to images table`);
            
          } else {
            console.error(`Failed to fetch media record: ${response.status} ${response.statusText}`);
          }
        } catch (e) {
          console.error('Error fetching media record:', e);
          
        } finally {
          setIsFetchingMedia(false);
        }
      };
      fetchMediaRecord();
    } else if (!value) {
      
      setResolvedMediaUrl('');
      setResolvedMediaType(null);
      setIsFetchingMedia(false);
    }
  }, [value]);

  // Construct proper image/video URL for display
  // Priority: resolvedMediaUrl > direct URL > /api/images/ fallback
  // BUT: Don't use /api/images/ fallback until we've confirmed media record doesn't exist
  const displayUrl = value
    ? (resolvedMediaUrl 
        ? resolvedMediaUrl 
        : typeof value === 'string' && (value.startsWith('/api/images/') || value.startsWith('http'))
        ? value 
        : isFetchingMedia 
        ? '' // Wait for fetch to complete before falling back
        : `/api/images/${value}`) // Fallback to images table only after fetch completes
    : '';

  // Check if it's a video file - prioritize resolved type, then mediaType prop, then URL-based detection
  const isVideo = resolvedMediaType === 'video' || mediaType === 'video' || (displayUrl && (
    displayUrl.endsWith('.mp4') || 
    displayUrl.endsWith('.webm') || 
    displayUrl.endsWith('.mov') || 
    displayUrl.includes('video') ||
    (displayUrl.includes('blob.vercel-storage.com') && (displayUrl.includes('.mp4') || displayUrl.includes('.webm') || displayUrl.includes('.mov')))
  ));

  
  const previewType: 'image' | 'video' = resolvedMediaType || (isVideo ? 'video' : 'image');

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-muted/30">
          {displayUrl ? (
            <MediaPreview
              url={displayUrl}
              type={previewType}
              className="h-full"
              alt="Media preview"
              controls={true}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-sm text-gray-500">Loading media...</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed z-20"
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

