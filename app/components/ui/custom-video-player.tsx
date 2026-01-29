'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  
  objectFit?: 'contain' | 'cover';
  onPauseRequested?: () => void;
  shouldPause?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  playerId?: string | number;
  
  autoplay?: boolean;
}


function getDirectVideoUrl(url: string): string | null {
  if (!url) return null;

  
  
  if (url.startsWith('/api/images/') || url.startsWith('/api/media/')) {
    return url;
  }

  
  
  
  if (url.startsWith('https://') && url.includes('blob.vercel-storage.com')) {
    return url;
  }

  
  
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    
    return null;
  }

  
  if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)(\?|$)/i)) {
    return url;
  }

  
  const muxMatch = url.match(/mux\.com\/([a-zA-Z0-9]+)/);
  if (muxMatch) {
    return `https://stream.mux.com/${muxMatch[1]}.m3u8`;
  }

  
  const cloudflareMatch = url.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)/);
  if (cloudflareMatch) {
    
    return null;
  }

  
  if (url.startsWith('http') && url.match(/video|stream|media/i)) {
    return url;
  }

  
  
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

  
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (needsIframe) return;
    if (!autoplay) return;
    if (!directVideoUrl) return;
    if (shouldPause) return;

    
    const t = window.setTimeout(() => {
      video
        .play()
        .catch(() => {
          
          
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
      
      
      console.error('Video load error:', JSON.stringify(errorDetails, null, 2));

      
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
      
      
      if (directVideoUrl && !useIframeFallback) {
        console.log('Attempting iframe fallback for:', src);
        setUseIframeFallback(true);
        setIsLoading(false);
        return;
      }
      
      
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

  
  useEffect(() => {
    if (shouldPause) {
      
      const video = videoRef.current;
      if (video && !needsIframe && isPlaying) {
        video.pause();
        setIsPlaying(false);
        if (onPauseRequested) {
          onPauseRequested();
        }
      }
      
      
      if (needsIframe && iframeRef.current) {
        
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

  
  const extractUrlFromIframe = (html: string): string | null => {
    
    const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
      return iframeMatch[1];
    }
    
    
    const wistiaPlayerMatch = html.match(/<wistia-player[^>]+media-id=["']([^"']+)["']/i);
    if (wistiaPlayerMatch) {
      return `https://wistia.com/medias/${wistiaPlayerMatch[1]}`;
    }
    
    
    const wistiaScriptMatch = html.match(/wistia\.com\/embed\/([a-zA-Z0-9]+)\.js/i);
    if (wistiaScriptMatch) {
      return `https://wistia.com/medias/${wistiaScriptMatch[1]}`;
    }
    
    
    const wistiaMediasMatch = html.match(/wistia\.com\/embed\/medias\/([a-zA-Z0-9]+)/i);
    if (wistiaMediasMatch) {
      return `https://wistia.com/medias/${wistiaMediasMatch[1]}`;
    }
    
    return null;
  };

  
  if (needsIframe) {
    
    let embedUrl = src;
    
    
    const extractedUrl = extractUrlFromIframe(src);
    if (extractedUrl) {
      embedUrl = extractedUrl;
    }
    
    
    const driveMatch = embedUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      embedUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }
    
    else {
      const youtubeMatch = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (youtubeMatch) {
        const base = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
        embedUrl = autoplay ? `${base}?autoplay=1` : base;
      }
      
      else {
        const vimeoMatch = embedUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
        if (vimeoMatch) {
          
          try {
            
            const decodedUrl = embedUrl.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
            const urlObj = new URL(decodedUrl.startsWith('http') ? decodedUrl : `https://${decodedUrl}`);
            const videoId = vimeoMatch[1];
            const queryParams = urlObj.search;
            embedUrl = `https://player.vimeo.com/video/${videoId}${queryParams}`;
          } catch {
            
            embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
          }
        }
        
        else {
          const wistiaMatch = src.match(/wistia\.(?:com|net)\/(?:medias|embed)\/([a-zA-Z0-9]+)/);
          if (wistiaMatch) {
            embedUrl = `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`;
          }
          
          else {
            const loomMatch = src.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
            if (loomMatch) {
              embedUrl = `https://www.loom.com/embed/${loomMatch[1]}`;
            }
            
            else {
              const dailymotionMatch = src.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
              if (dailymotionMatch) {
                embedUrl = `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
              }
              
              else {
                const twitchMatch = src.match(/twitch\.tv\/(?:videos\/(\d+)|(\w+))/);
                if (twitchMatch) {
                  if (twitchMatch[1]) {
                    
                    embedUrl = `https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : ''}`;
                  } else if (twitchMatch[2]) {
                    
                    embedUrl = `https://player.twitch.tv/?channel=${twitchMatch[2]}&parent=${typeof window !== 'undefined' ? window.location.hostname : ''}`;
                  }
                }
                
                else {
                  const facebookMatch = src.match(/facebook\.com\/(?:watch\/\?v=|.*\/videos\/)(\d+)/);
                  if (facebookMatch) {
                    embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(src)}`;
                  }
                  
                  else {
                    const muxMatch = src.match(/mux\.com\/([a-zA-Z0-9]+)/);
                    if (muxMatch) {
                      embedUrl = `https://stream.mux.com/${muxMatch[1]}.m3u8`;
                    }
                    
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

      {}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {}
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

        {}
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
