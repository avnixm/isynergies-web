'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Video } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { MediaPreview } from './media-preview';

const MAX_SINGLE_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

interface VideoUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function VideoUpload({ value, onChange, disabled }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const deleteOldBlob = useCallback(async (oldUrl: string, token: string) => {
    if (oldUrl && oldUrl.startsWith('https://') && oldUrl.includes('blob.vercel-storage.com')) {
      try {
        const deleteResponse = await fetch('/api/admin/delete-blob', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ url: oldUrl }),
        });
        if (deleteResponse.ok) return true;
      } catch {
        /* ignore */
      }
    }
    return false;
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
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
      if (oldValue?.startsWith('https://') && oldValue.includes('blob.vercel-storage.com')) {
        oldBlobUrl = oldValue;
      } else if (oldValue?.match(/^\d+$/)) {
        try {
          const mediaResponse = await fetch(`/api/admin/media/${oldValue}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (mediaResponse.ok) {
            const mediaData = await mediaResponse.json();
            if (mediaData?.url?.startsWith('https://') && mediaData.url.includes('blob.vercel-storage.com')) {
              oldBlobUrl = mediaData.url;
            }
          }
        } catch {
          /* ignore */
        }
      }

      try {
        const blobRes = await fetch('/api/admin/blob-available', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blobPayload = blobRes.ok
          ? await blobRes.json().catch(() => ({ available: false, singleVideoUploadOnly: false }))
          : { available: false, singleVideoUploadOnly: false };
        const blobAvailable = !!blobPayload.available;
        const singleVideoUploadOnly = !!blobPayload.singleVideoUploadOnly;

        if (blobAvailable) {
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
              setUploadProgress(`Uploading: ${Math.round(progress.percentage || 0)}%`);
            },
          });

          if (!blob?.url) {
            throw new Error('Upload failed: No blob URL returned');
          }

          setUploadProgress('Creating media record...');
          try {
            const createMediaResponse = await fetch('/api/admin/media', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                url: blob.url,
                contentType: file.type,
                sizeBytes: file.size,
                title: file.name,
              }),
            });

            if (!createMediaResponse.ok) {
              const err = await createMediaResponse.json().catch(() => ({ error: 'Failed to create media record' }));
              throw new Error(err.error || 'Failed to create media record');
            }

            const mediaData = await createMediaResponse.json();
            if (mediaData.id) {
              onChange(String(mediaData.id));
              if (oldBlobUrl) await deleteOldBlob(oldBlobUrl, token);
            } else {
              throw new Error('Media record created but no ID returned');
            }
          } catch (mediaError) {
            console.warn('Falling back to storing blob URL directly:', blob.url);
            onChange(blob.url);
            if (oldBlobUrl) await deleteOldBlob(oldBlobUrl, token);
          }
          setUploadProgress('');
          return;
        }

        // DB upload path
        if (singleVideoUploadOnly && file.size > MAX_SINGLE_UPLOAD_BYTES) {
          setUploading(false);
          setUploadProgress('');
          alert(
            `Video must be under 20MB when Blob storage is not configured. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB. Set BLOB_READ_WRITE_TOKEN for larger videos, or use a smaller file.`
          );
          return;
        }

        setUploadProgress('Uploading video to database...');
        const CHUNK_SIZE = 1 * 1024 * 1024;
        const useChunkedUpload = !singleVideoUploadOnly && file.size > 4 * 1024 * 1024;
        let imageId: number | null = null;

        if (useChunkedUpload) {
          const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
          const uploadId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
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
              headers: { Authorization: `Bearer ${token}` },
              body: chunkFormData,
            });
            if (!chunkResponse.ok) {
              const err = await chunkResponse.json().catch(() => ({ error: 'Chunk upload failed' }));
              throw new Error(err.error || `Chunk ${chunkIndex + 1}/${totalChunks} upload failed`);
            }
            const chunkData = await chunkResponse.json();
            if (chunkIndex === 0) imageId = chunkData.id;
          }
          if (!imageId) throw new Error('Upload succeeded but no image ID was returned');
          const finalizeResponse = await fetch('/api/admin/upload-finalize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId, imageId }),
          });
          if (!finalizeResponse.ok) {
            const err = await finalizeResponse.json().catch(() => ({ error: 'Finalization failed' }));
            throw new Error(err.error || 'Failed to finalize upload');
          }
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const uploadResponse = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          if (!uploadResponse.ok) {
            const err = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(err.error || 'Upload failed');
          }
          const uploadData = await uploadResponse.json();
          if (!uploadData.id) throw new Error('Upload succeeded but no image ID was returned');
          imageId = uploadData.id;
        }

        setUploadProgress('Creating media record...');
        const createMediaResponse = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            url: `/api/images/${imageId}`,
            type: 'video',
            contentType: file.type,
            sizeBytes: file.size,
            title: file.name,
          }),
        });
        if (!createMediaResponse.ok) {
          const err = await createMediaResponse.json().catch(() => ({ error: 'Failed to create media record' }));
          throw new Error(err.error || 'Failed to create media record');
        }
        const mediaData = await createMediaResponse.json();
        if (mediaData.id) {
          onChange(String(mediaData.id));
          if (oldBlobUrl) await deleteOldBlob(oldBlobUrl, token);
        } else {
          throw new Error('Media record created but no ID returned');
        }
        setUploadProgress('');
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        alert(msg.includes('token') || msg.includes('unauthorized') ? 'Unauthorized. Please log in again.' : `Upload failed: ${msg}`);
      } finally {
        setUploading(false);
        setUploadProgress('');
      }
    },
    [onChange, value, deleteOldBlob]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/webm': ['.webm'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    disabled: disabled || uploading,
  });

  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');
  const [isFetchingMedia, setIsFetchingMedia] = useState(false);

  useEffect(() => {
    if (!value) {
      setResolvedMediaUrl('');
      setIsFetchingMedia(false);
      return;
    }
    if (value.match(/^\d+$/)) {
      setResolvedMediaUrl('');
      setIsFetchingMedia(true);
      let cancelled = false;
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setIsFetchingMedia(false);
        return;
      }
      fetch(`/api/admin/media/${value}`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((mediaRecord) => {
          if (!cancelled && mediaRecord?.url) setResolvedMediaUrl(mediaRecord.url);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setIsFetchingMedia(false);
        });
      return () => {
        cancelled = true;
      };
    }
    setResolvedMediaUrl('');
    setIsFetchingMedia(false);
  }, [value]);

  const displayUrl = value
    ? resolvedMediaUrl ||
      (typeof value === 'string' && (value.startsWith('/api/images/') || value.startsWith('http')) ? value : null) ||
      (isFetchingMedia ? '' : `/api/images/${value}`)
    : '';

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-muted/30">
          {displayUrl ? (
            <MediaPreview
              url={displayUrl}
              type="video"
              className="h-full"
              alt="Video preview"
              controls={true}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-sm text-gray-500">Loading video...</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed z-20"
            disabled={disabled}
            aria-label="Delete video"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition',
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
            disabled && 'opacity-50 cursor-not-allowed'
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
                    <p className="text-sm text-blue-600 font-medium">Drop the video here</p>
                  </>
                ) : (
                  <>
                    <Video className="h-12 w-12 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">MP4, WebM, MOV</p>
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
