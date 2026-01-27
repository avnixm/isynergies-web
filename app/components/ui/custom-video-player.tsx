'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  /** How the video should fit inside its container (default: contain). */
  objectFit?: 'contain' | 'cover';
  onPauseRequested?: () => void;
  shouldPause?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  playerId?: string | number;
  /** When true, embed URL includes autoplay=1 (YouTube/etc.) so play works. */
  autoplay?: boolean;
}

// Helper to extract direct video URL from various sources
function getDirectVideoUrl(url: string): string | null {
  if (!url) return null;

  // API image/media routes - these resolve to blob URLs (direct video URLs)
  // The route handles redirects to actual video files
  if (url.startsWith('/api/images/') || url.startsWith('/api/media/')) {
    return url;
  }

  // Vercel Blob URLs (used for uploaded videos)
  // These are already direct video URLs and should be played with a <video> tag,
  // not inside an iframe "page" (which looks like a static image thumbnail).
  if (url.startsWith('https://') && url.includes('blob.vercel-storage.com')) {
    return url;
  }

  // Google Drive - always use iframe embedding (preview URL)
  // The direct download URL doesn't work for video streaming
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    // Return null to force iframe embedding
    return null;
  }

  // If it's already a direct video URL (mp4, webm, etc.), return as is
  if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i)) {
    return url;
  }

  // Mux - supports direct HLS streaming
  const muxMatch = url.match(/mux\.com\/([a-zA-Z0-9]+)/);
  if (muxMatch) {
    return `https://stream.mux.com/${muxMatch[1]}.m3u8`;
  }

  // Cloudflare Stream - supports direct playback via iframe (no direct URL)
  const cloudflareMatch = url.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)/);
  if (cloudflareMatch) {
    // Cloudflare Stream uses iframe embedding, not direct URLs
    return null;
  }

  // Direct video URLs from other sources (CDN, etc.)
  if (url.startsWith('http') && url.match(/video|stream|media/i)) {
    return url;
  }

  // YouTube, Vimeo, Wistia, Loom, Dailymotion, Twitch, Facebook don't allow direct video access without API
  // Return null to indicate we need to use iframe fallback
  return null;
}

export function CustomVideoPlayer({
  src,
  poster,
  title,
  className = '',
  objectFit = 'contain',
  onPauseRequested,
  shouldPause = false,
  onPlay,
  onPause,
  playerId,
  autoplay = false,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeKey, setIframeKey] = useState(0);

  const directVideoUrl = getDirectVideoUrl(src);
  const needsIframe = !directVideoUrl || useIframeFallback;

  // Autoplay for direct <video> sources (e.g., Vercel Blob URLs, /api/images/:id redirects).
  // For iframe embeds, autoplay is handled by appending `?autoplay=1` to the embed URL.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (needsIframe) return;
    if (!autoplay) return;
    if (!directVideoUrl) return;
    if (shouldPause) return;

    // Attempt to play on next tick so the element has updated src.
    const t = window.setTimeout(() => {
      video
        .play()
        .catch(() => {
          // Autoplay might be blocked by browser policy if not muted / no user gesture.
          // We keep silent here; the user can still press play.
        });
    }, 0);

    return () => window.clearTimeout(t);
  }, [autoplay, directVideoUrl, needsIframe, shouldPause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || needsIframe) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      if (onPlay) {
        onPlay();
      }
    };
    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      const video = e.target as HTMLVideoElement;
      const error = video.error;
      
      // Extract detailed error information - ensure all values are properly serialized
      const errorDetails: {
        originalSrc: string;
        directVideoUrl: string | null;
        videoSrc: string | null;
        networkState: number;
        networkStateText: string;
        readyState: number;
        readyStateText: string;
        errorCode?: number;
        errorMessage?: string;
        errorDescription?: string;
      } = {
        originalSrc: src,
        directVideoUrl: directVideoUrl,
        videoSrc: video.src || null,
        networkState: video.networkState,
        networkStateText: ['EMPTY', 'IDLE', 'LOADING', 'NO_SOURCE'][video.networkState] || 'UNKNOWN',
        readyState: video.readyState,
        readyStateText: ['HAVE_NOTHING', 'HAVE_METADATA', 'HAVE_CURRENT_DATA', 'HAVE_FUTURE_DATA', 'HAVE_ENOUGH_DATA'][video.readyState] || 'UNKNOWN',
      };
      
      if (error) {
        errorDetails.errorCode = error.code;
        errorDetails.errorMessage = error.message || 'No error message available';
        
        // MediaError codes:
        // 1 = MEDIA_ERR_ABORTED
        // 2 = MEDIA_ERR_NETWORK
        // 3 = MEDIA_ERR_DECODE
        // 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
        const errorMessages: { [key: number]: string } = {
          1: 'Video loading was aborted',
          2: 'Network error while loading video',
          3: 'Video decoding error',
          4: 'Video format not supported or source not found',
        };
        
        errorDetails.errorDescription = errorMessages[error.code] || 'Unknown video error';
      } else {
        errorDetails.errorMessage = 'No error object available (video element error is null)';
      }
      
      // Log with JSON.stringify to ensure proper serialization
      console.error('Video load error:', JSON.stringify(errorDetails, null, 2));

      // Use warn + stringified snapshot so DevTools/Next overlay doesn't collapse it to `{}`.
      console.warn(
        'Video element state:',
        JSON.stringify(
          {
            src: video.src,
            currentSrc: video.currentSrc,
            networkState: video.networkState,
            readyState: video.readyState,
            error: error ? { code: error.code, message: error.message } : null,
          },
          null,
          2
        )
      );
      
      // If direct video fails, try iframe fallback
      if (directVideoUrl && !useIframeFallback) {
        console.log('Attempting iframe fallback for:', src);
        setUseIframeFallback(true);
        setIsLoading(false);
        return;
      }
      
      // Set user-friendly error message
      let userErrorMessage = 'Failed to load video.';
      if (error) {
        if (error.code === 4) {
          userErrorMessage = 'Video format not supported or source not accessible. Please check the video URL.';
        } else if (error.code === 2) {
          userErrorMessage = 'Network error while loading video. Please check your connection.';
        } else if (error.code === 3) {
          userErrorMessage = 'Video file appears to be corrupted or in an unsupported format.';
        }
      } else {
        // If no error object, provide generic message
        userErrorMessage = 'Video failed to load. The source may be inaccessible or in an unsupported format.';
      }
      
      setError(userErrorMessage);
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [needsIframe, directVideoUrl, useIframeFallback, onPlay, onPause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle external pause request
  useEffect(() => {
    if (shouldPause) {
      // Pause direct video players
      const video = videoRef.current;
      if (video && !needsIframe && isPlaying) {
        video.pause();
        setIsPlaying(false);
        if (onPauseRequested) {
          onPauseRequested();
        }
      }
      
      // For iframe videos, reload them to stop playback
      if (needsIframe && iframeRef.current) {
        // Reload iframe by changing key to force remount
        setIframeKey(prev => prev + 1);
      }
    }
  }, [shouldPause, isPlaying, needsIframe, onPauseRequested]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen().catch(() => {
        console.error('Failed to enter fullscreen');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper to extract URL from iframe embed code or other embed formats
  const extractUrlFromIframe = (html: string): string | null => {
    // Match iframe src attribute
    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      return iframeMatch[1];
    }
    
    // Match Wistia embed code - extract media-id from <wistia-player> tag
    const wistiaPlayerMatch = html.match(/<wistia-player[^>]+media-id=["']([^"']+)["']/i);
    if (wistiaPlayerMatch) {
      return `https://wistia.com/medias/${wistiaPlayerMatch[1]}`;
    }
    
    // Match Wistia embed script - extract media ID from embed script URL
    const wistiaScriptMatch = html.match(/wistia\.com\/embed\/([a-zA-Z0-9]+)\.js/i);
    if (wistiaScriptMatch) {
      return `https://wistia.com/medias/${wistiaScriptMatch[1]}`;
    }
    
    // Match Wistia embed script - extract media ID from medias path
    const wistiaMediasMatch = html.match(/wistia\.com\/embed\/medias\/([a-zA-Z0-9]+)/i);
    if (wistiaMediasMatch) {
      return `https://wistia.com/medias/${wistiaMediasMatch[1]}`;
    }
    
    return null;
  };

  // If we can't get direct video URL, show iframe fallback
  if (needsIframe) {
    // Convert to embed URL for iframe
    let embedUrl = src;
    
    // First, check if it's an iframe embed code and extract the URL
    const extractedUrl = extractUrlFromIframe(src);
    if (extractedUrl) {
      embedUrl = extractedUrl;
    }
    
    // Google Drive
    const driveMatch = embedUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      embedUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    // YouTube
    else {
      const youtubeMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch) {
        const base = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        embedUrl = autoplay ? `${base}?autoplay=1` : base;
      }
      // Vimeo
      else {
        const vimeoMatch = embedUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
        if (vimeoMatch) {
          // Extract query parameters if they exist
          try {
            // Decode HTML entities (like &amp; to &)
            const decodedUrl = embedUrl.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            const urlObj = new URL(decodedUrl.startsWith('http') ? decodedUrl : `https://${decodedUrl}`);
            const videoId = vimeoMatch[1];
            const queryParams = urlObj.search;
            embedUrl = `https://player.vimeo.com/video/${videoId}${queryParams}`;
          } catch {
            // If URL parsing fails, use simple format
            embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          }
        }
        // Wistia
        else {
          const wistiaMatch = src.match(/wistia\.(?:com|net)\/(?:medias|embed)\/([a-zA-Z0-9]+)/);
          if (wistiaMatch) {
            embedUrl = `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`;
          }
          // Loom
          else {
            const loomMatch = src.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
            if (loomMatch) {
              embedUrl = `https://www.loom.com/embed/${loomMatch[1]}`;
            }
            // Dailymotion
            else {
              const dailymotionMatch = src.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
              if (dailymotionMatch) {
                embedUrl = `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
              }
              // Twitch
              else {
                const twitchMatch = src.match(/twitch\.tv\/(?:videos\/(\d+)|(\w+))/);
                if (twitchMatch) {
                  if (twitchMatch[1]) {
                    // Video VOD
                    embedUrl = `https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : ''}`;
                  } else if (twitchMatch[2]) {
                    // Live channel
                    embedUrl = `https://player.twitch.tv/?channel=${twitchMatch[2]}&parent=${typeof window !== 'undefined' ? window.location.hostname : ''}`;
                  }
                }
                // Facebook Video
                else {
                  const facebookMatch = src.match(/facebook\.com\/(?:watch\/\?v=|.*\/videos\/)(\d+)/);
                  if (facebookMatch) {
                    embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(src)}`;
                  }
                  // Mux
                  else {
                    const muxMatch = src.match(/mux\.com\/([a-zA-Z0-9]+)/);
                    if (muxMatch) {
                      embedUrl = `https://stream.mux.com/${muxMatch[1]}.m3u8`;
                    }
                    // Cloudflare Stream
                    else {
                      const cloudflareMatch = src.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)/);
                      if (cloudflareMatch) {
                        embedUrl = `https://iframe.videodelivery.net/${cloudflareMatch[1]}`;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <iframe
          key={`${iframeKey}-${autoplay}`}
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          style={{ border: 'none', display: 'block' }}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video'}
          onLoad={() => {
            // When iframe loads, if it's set to autoplay, notify parent
            // This is a best-effort approach for iframe videos
            // Note: Due to cross-origin restrictions, we can't directly detect iframe video playback
            if (onPlay && embedUrl.includes('autoplay=1') && !shouldPause) {
              setTimeout(() => {
                if (onPlay) onPlay();
              }, 500);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full bg-black group overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
    >
      <video
        ref={videoRef}
        src={directVideoUrl || undefined}
        poster={poster}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
        onClick={togglePlay}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white p-4 text-center">
          <div>
            <p className="text-sm mb-2">{error}</p>
            <p className="text-xs text-gray-400 mb-2">
              For Google Drive videos, make sure the file is:
            </p>
            <ul className="text-xs text-gray-400 text-left list-disc list-inside space-y-1">
              <li>Publicly shared (Anyone with the link can view)</li>
              <li>A video file format (MP4, WebM, etc.)</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              If issues persist, the video may need to be uploaded to a different hosting service.
            </p>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pt-2 pb-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
            style={{
              background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, #4B5563 ${(currentTime / duration) * 100}%, #4B5563 100%)`,
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-3 gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
            />

            <span className="text-white text-sm min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
