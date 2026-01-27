/**
 * Usage Examples for BlobVideoPlayer Component
 * 
 * This file demonstrates how to use the BlobVideoPlayer component
 * in different contexts (website playback vs admin preview).
 */

import { BlobVideoPlayer } from './blob-video-player';

// ============================================
// Example 1: Website Playback (Minimal)
// ============================================
export function WebsiteVideoExample() {
  const videoUrl = 'https://your-blob-url.public.blob.vercel-storage.com/video.mp4';
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <BlobVideoPlayer
        src={videoUrl}
        title="Featured Video"
        autoPlay={false}
        muted={false}
        aspectRatio="16/9"
        objectFit="cover"
      />
    </div>
  );
}

// ============================================
// Example 2: Admin Preview (With Admin Features)
// ============================================
export function AdminVideoPreviewExample() {
  const videoUrl = 'https://your-blob-url.public.blob.vercel-storage.com/video.mp4';
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <BlobVideoPlayer
        src={videoUrl}
        title="Video Preview"
        poster="https://your-poster-image.jpg"
        autoPlay={false}
        muted={true}
        aspectRatio="16/9"
        objectFit="contain" // Use 'contain' for admin preview to see full video
        showCopyUrl={true}
        showOpenInNewTab={true}
        onEnded={() => console.log('Video ended')}
        onError={(err) => console.error('Video error:', err)}
      />
    </div>
  );
}

// ============================================
// Example 3: Responsive Grid Layout
// ============================================
export function VideoGridExample() {
  const videos = [
    { id: 1, url: 'https://blob-url-1.mp4', title: 'Video 1' },
    { id: 2, url: 'https://blob-url-2.mp4', title: 'Video 2' },
    { id: 3, url: 'https://blob-url-3.mp4', title: 'Video 3' },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {videos.map((video) => (
        <BlobVideoPlayer
          key={video.id}
          src={video.url}
          title={video.title}
          aspectRatio="16/9"
          objectFit="cover"
          className="w-full"
        />
      ))}
    </div>
  );
}

// ============================================
// Example 4: Custom Aspect Ratio
// ============================================
export function CustomAspectRatioExample() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Square video */}
      <BlobVideoPlayer
        src="https://blob-url.mp4"
        title="Square Video"
        aspectRatio="1/1"
        objectFit="cover"
      />
      
      {/* 4:3 video */}
      <BlobVideoPlayer
        src="https://blob-url.mp4"
        title="4:3 Video"
        aspectRatio="4/3"
        objectFit="contain"
      />
      
      {/* 21:9 ultrawide */}
      <BlobVideoPlayer
        src="https://blob-url.mp4"
        title="Ultrawide Video"
        aspectRatio="21/9"
        objectFit="cover"
      />
    </div>
  );
}

// ============================================
// Example 5: With Event Handlers
// ============================================
export function VideoWithHandlersExample() {
  const handlePlay = () => {
    console.log('Video started playing');
    // Track analytics, etc.
  };
  
  const handlePause = () => {
    console.log('Video paused');
  };
  
  const handleEnded = () => {
    console.log('Video finished');
    // Show next video, etc.
  };
  
  const handleError = (err: unknown) => {
    console.error('Video error:', err);
    // Show error notification, etc.
  };
  
  return (
    <BlobVideoPlayer
      src="https://blob-url.mp4"
      title="Video with handlers"
      onPlay={handlePlay}
      onPause={handlePause}
      onEnded={handleEnded}
      onError={handleError}
    />
  );
}
