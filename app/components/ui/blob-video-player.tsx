'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Settings,
  Link2,
  Copy,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from './button';

export interface BlobVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean; // Native browser controls (default false - we use custom)
  preload?: 'none' | 'metadata' | 'auto';
  objectFit?: 'contain' | 'cover'; // Default 'contain' for admin preview
  aspectRatio?: string; // e.g., '16/9', '4/3', '1/1' (default '16/9')
  onEnded?: () => void;
  onError?: (err: unknown) => void;
  onPlay?: () => void;
  onPause?: () => void;
  // Admin-specific props
  showCopyUrl?: boolean;
  showOpenInNewTab?: boolean;
}

export function BlobVideoPlayer({
  src,
  poster,
  title,
  className = '',
  autoPlay = false,
  muted = false,
  loop = false,
  controls = false,
  preload = 'metadata',
  objectFit = 'contain',
  aspectRatio = '16/9',
  onEnded,
  onError,
  onPlay,
  onPause,
  showCopyUrl = false,
  showOpenInNewTab = false,
}: BlobVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressUpdateRef = useRef<number | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPictureInPicture, setIsPictureInPicture] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate aspect ratio padding
  const [aspectRatioPadding, setAspectRatioPadding] = useState('56.25%'); // 16:9 default

  useEffect(() => {
    if (aspectRatio) {
      const [width, height] = aspectRatio.split('/').map(Number);
      const percentage = (height / width) * 100;
      setAspectRatioPadding(`${percentage}%`);
    }
  }, [aspectRatio]);

  // IntersectionObserver for auto-pause when offscreen
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isPlaying) {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, [isPlaying]);

  // Handle iOS autoplay rules
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (autoPlay && muted) {
      video.play().catch((err) => {
        console.warn('Autoplay failed:', err);
        setError('Autoplay blocked. Click play to start.');
      });
    }
  }, [autoPlay, muted]);

  // Update progress smoothly using requestAnimationFrame
  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || isDragging) return;

    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    // Calculate buffered progress
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const bufferedPercent = (bufferedEnd / video.duration) * 100;
      setBuffered(bufferedPercent);
    }

    if (isPlaying && !video.paused) {
      progressUpdateRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, isDragging]);

  useEffect(() => {
    if (isPlaying) {
      progressUpdateRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (progressUpdateRef.current) {
        cancelAnimationFrame(progressUpdateRef.current);
      }
    }

    return () => {
      if (progressUpdateRef.current) {
        cancelAnimationFrame(progressUpdateRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      if (onPlay) onPlay();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (onPause) onPause();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      const videoError = (e.target as HTMLVideoElement).error;
      const errorMessage =
        videoError?.message ||
        'Failed to load video. Please check the URL or try again.';
      setError(errorMessage);
      setIsLoading(false);
      if (onError) onError(videoError);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleEnterPictureInPicture = () => {
      setIsPictureInPicture(true);
    };

    const handleLeavePictureInPicture = () => {
      setIsPictureInPicture(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('volumechange', handleVolumeChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    video.addEventListener('enterpictureinpicture', handleEnterPictureInPicture);
    video.addEventListener('leavepictureinpicture', handleLeavePictureInPicture);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('volumechange', handleVolumeChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      video.removeEventListener('enterpictureinpicture', handleEnterPictureInPicture);
      video.removeEventListener('leavepictureinpicture', handleLeavePictureInPicture);
    };
  }, [onEnded, onError, onPlay, onPause]);

  // Controls visibility
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  const handleMouseMove = () => {
    resetControlsTimeout();
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.error('Play failed:', err);
        setError('Failed to play video');
      });
    }
  }, [isPlaying]);

  // Seek
  const handleSeek = useCallback((newTime: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    handleSeek(newTime);
  };

  const handleSeekBarMouseDown = () => {
    setIsDragging(true);
  };

  const handleSeekBarMouseUp = () => {
    setIsDragging(false);
  };

  // Volume
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
  }, [isMuted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Picture-in-Picture
  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPictureInPicture) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Picture-in-Picture failed:', err);
    }
  }, [isPictureInPicture]);

  // Playback speed
  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(duration, currentTime + 5));
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange({
            target: { value: String(Math.min(1, volume + 0.1)) },
          } as React.ChangeEvent<HTMLInputElement>);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange({
            target: { value: String(Math.max(0, volume - 0.1)) },
          } as React.ChangeEvent<HTMLInputElement>);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleSeek, currentTime, duration, volume, toggleFullscreen, toggleMute]);

  // Copy URL
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(src);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }, [src]);

  // Format time
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Check PiP support
  const supportsPictureInPicture =
    typeof document !== 'undefined' &&
    'pictureInPictureEnabled' in document &&
    document.pictureInPictureEnabled;

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-lg overflow-hidden shadow-lg border border-border/20 ${className}`}
      style={{ aspectRatio: aspectRatio }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        preload={preload}
        onClick={togglePlay}
        aria-label={title || 'Video player'}
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 z-30">
          <p className="text-sm mb-4 text-center">{error}</p>
          <div className="flex gap-2">
            {showOpenInNewTab && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(src, '_blank')}
                className="bg-white/10 hover:bg-white/20 border-white/20"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in new tab
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                const video = videoRef.current;
                if (video) {
                  video.load();
                }
              }}
              className="bg-white/10 hover:bg-white/20 border-white/20"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Big Play Button Overlay */}
      {!isPlaying && !error && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/20 z-10 transition-opacity duration-200 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={togglePlay}
        >
          <button
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Play video"
          >
            <Play className="w-10 h-10 md:w-12 md:h-12 text-black ml-1" fill="currentColor" />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-20 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seek Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group">
            {/* Buffered Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full transition-all"
              style={{ width: `${buffered}%` }}
            />
            {/* Current Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            {/* Seek Input */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeekBarChange}
              onMouseDown={handleSeekBarMouseDown}
              onMouseUp={handleSeekBarMouseUp}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seek video"
            />
            {/* Hover indicator */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity left-0"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-3 gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" fill="currentColor" />
              )}
            </button>

            {/* Volume */}
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black hidden sm:flex"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Volume Slider (Desktop) */}
            <div className="hidden md:flex items-center gap-2 w-24">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                aria-label="Volume"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-xs md:text-sm min-w-[80px] md:min-w-[100px] text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Playback speed"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 rounded-lg shadow-lg py-1 min-w-[120px] z-30">
                  {playbackRates.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full px-4 py-2 text-left text-sm text-white hover:bg-white/20 transition-colors ${
                        playbackRate === rate ? 'bg-white/10' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            {supportsPictureInPicture && (
              <button
                onClick={togglePictureInPicture}
                className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black hidden sm:flex"
                aria-label={isPictureInPicture ? 'Exit picture-in-picture' : 'Enter picture-in-picture'}
              >
                <PictureInPicture className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Copy URL (Admin) */}
            {showCopyUrl && (
              <button
                onClick={handleCopyUrl}
                className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Copy video URL"
              >
                <Copy className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Open in New Tab (Admin) */}
            {showOpenInNewTab && (
              <button
                onClick={() => window.open(src, '_blank')}
                className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
                aria-label="Open video in new tab"
              >
                <ExternalLink className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
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

      {/* Click outside speed menu to close */}
      {showSpeedMenu && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowSpeedMenu(false)}
        />
      )}
    </div>
  );
}
