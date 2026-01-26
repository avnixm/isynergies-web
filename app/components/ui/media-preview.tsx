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

/**
 * MediaPreview component - renders images or videos based on type
 * 
 * Usage:
 * <MediaPreview url={media.url} type={media.type} />
 */
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
          crossOrigin="anonymous"
          className={`w-full h-full object-contain ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onLoadedMetadata={() => setLoading(false)}
          onError={(e) => {
            console.error('Video preview error:', e);
            setError(true);
            setLoading(false);
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

  // Image type
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
