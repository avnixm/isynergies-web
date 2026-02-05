'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MediaPreviewProps {
  url: string;
  type: 'image' | 'video';
  contentType?: string;
  className?: string;
  alt?: string;
  controls?: boolean;
}







export function MediaPreview({ 
  url, 
  type, 
  contentType,
  className = '', 
  alt = 'Media preview',
  controls = true 
}: MediaPreviewProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (type === 'video') {
    return (
      <div className={`relative w-full ${className}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-sm text-gray-500">Loading video...</div>
          </div>
        )}
        <video
          src={url}
          controls={controls}
          playsInline
          preload="metadata"
          className={`w-full h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded successfully:', url);
            setLoading(false);
            setError(false);
          }}
          onCanPlay={() => {
            console.log('Video can play:', url);
            setLoading(false);
            setError(false);
          }}
          onError={(e) => {
            const video = e.target as HTMLVideoElement;
            const code = video.error?.code ?? 'unknown';
            const message = (video.error?.message ?? '') || String(video.error?.code ?? '');
            console.error('Video preview error:', `code=${code} message=${message} url=${url} networkState=${video.networkState} readyState=${video.readyState}`);
            if (code === 4) {
              console.error('Video format not supported. URL:', url);
            } else if (code === 2) {
              console.error('Network error loading video. Check CORS and URL accessibility.');
            }
            setError(true);
            setLoading(false);
          }}
          onLoadStart={() => {
            console.log('Video load started:', url);
          }}
        >
          Your browser does not support the video tag.
        </video>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600">
            <div className="text-sm">Failed to load video</div>
          </div>
        )}
      </div>
    );
  }

  
  return (
    <div className={`relative w-full ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-sm text-gray-500">Loading image...</div>
        </div>
      )}
      <Image
        src={url}
        alt={alt}
        fill
        className={`object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        unoptimized
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-600">
          <div className="text-sm">Failed to load image</div>
        </div>
      )}
    </div>
  );
}
