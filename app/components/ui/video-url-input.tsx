'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import { Input } from './input';
import { Label } from './label';
import { Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface VideoUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

// Helper function to extract URL from iframe embed code or other embed formats
function extractUrlFromIframe(html: string): string | null {
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
}

// Helper function to convert various video URLs to embed URLs
function convertToEmbedUrl(url: string): string {
  if (!url) return '';

  // First, check if it's an iframe embed code and extract the URL
  const extractedUrl = extractUrlFromIframe(url);
  if (extractedUrl) {
    url = extractedUrl;
  }

  // Google Drive video
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // YouTube
  // Various formats: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  // Format: vimeo.com/ID or player.vimeo.com/video/ID
  // Also handle URLs with query parameters like: player.vimeo.com/video/1157088946?badge=0&autopause=0
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    // Extract query parameters if they exist
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const videoId = vimeoMatch[1];
    // Preserve query parameters from original URL
    const queryParams = urlObj.search;
    return `https://player.vimeo.com/video/${videoId}${queryParams}`;
  }

  // Wistia
  // Format: wistia.com/medias/ID or wistia.net/embed/ID
  const wistiaMatch = url.match(/wistia\.(?:com|net)\/(?:medias|embed)\/([a-zA-Z0-9]+)/);
  if (wistiaMatch) {
    return `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`;
  }

  // Loom
  // Format: loom.com/share/ID or loom.com/embed/ID
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  // Dailymotion
  // Format: dailymotion.com/video/ID
  const dailymotionMatch = url.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/);
  if (dailymotionMatch) {
    return `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}`;
  }

  // Twitch
  // Format: twitch.tv/videos/ID or twitch.tv/channel
  const twitchMatch = url.match(/twitch\.tv\/(?:videos\/(\d+)|(\w+))/);
  if (twitchMatch) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    if (twitchMatch[1]) {
      return `https://player.twitch.tv/?video=${twitchMatch[1]}&parent=${hostname}`;
    } else if (twitchMatch[2]) {
      return `https://player.twitch.tv/?channel=${twitchMatch[2]}&parent=${hostname}`;
    }
  }

  // Facebook Video
  // Format: facebook.com/watch?v=ID or facebook.com/.../videos/ID
  const facebookMatch = url.match(/facebook\.com\/(?:watch\/\?v=|.*\/videos\/)(\d+)/);
  if (facebookMatch) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
  }

  // Mux
  // Format: mux.com/ID (returns HLS stream URL for direct playback)
  const muxMatch = url.match(/mux\.com\/([a-zA-Z0-9]+)/);
  if (muxMatch) {
    return `https://stream.mux.com/${muxMatch[1]}.m3u8`;
  }

  // Cloudflare Stream
  // Format: cloudflarestream.com/ID
  const cloudflareMatch = url.match(/cloudflarestream\.com\/([a-zA-Z0-9]+)/);
  if (cloudflareMatch) {
    return `https://iframe.videodelivery.net/${cloudflareMatch[1]}`;
  }

  // If it's already an embed URL or iframe src, return as is
  if (url.includes('/embed/') || url.includes('iframe')) {
    return url;
  }

  // Return original URL if no match (user can paste embed URL directly)
  return url;
}

// Helper to detect if URL is a video embed URL
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('youtube.com/embed') ||
    url.includes('youtu.be') ||
    url.includes('youtube.com/watch') ||
    url.includes('vimeo.com') ||
    url.includes('drive.google.com') ||
    url.includes('player.vimeo.com') ||
    url.includes('wistia.com') ||
    url.includes('wistia.net') ||
    url.includes('loom.com') ||
    url.includes('dailymotion.com') ||
    url.includes('twitch.tv') ||
    url.includes('facebook.com') ||
    url.includes('mux.com') ||
    url.includes('cloudflarestream.com') ||
    url.includes('videodelivery.net')
  );
}

export function VideoUrlInput({ value, onChange, disabled, label = 'Video URL' }: VideoUrlInputProps) {
  const [inputValue, setInputValue] = useState(value || '');

  // Sync input value when prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (newValue: string) => {
    setInputValue(newValue);
    // Extract URL from iframe if needed
    const extractedUrl = extractUrlFromIframe(newValue);
    onChange(extractedUrl || newValue); // Store extracted URL or original value
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
  };

  const embedUrl = inputValue ? convertToEmbedUrl(inputValue) : '';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-url">{label}</Label>
        <div className="flex gap-2">
          <Input
            id="video-url"
            type="url"
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Paste video URL (Google Drive, YouTube, Vimeo, etc.)"
            disabled={disabled}
            className="flex-1"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={disabled}
              aria-label="Clear video URL"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Supports: Google Drive, YouTube, Vimeo, Wistia, Loom, Dailymotion, Twitch, Facebook, Mux, Cloudflare Stream, or any embed URL
        </p>
      </div>

      {embedUrl && (
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
            />
          </div>
        </div>
      )}

      {inputValue && !isVideoUrl(inputValue) && (
        <p className="text-sm text-amber-600">
          ⚠️ This doesn't look like a recognized video URL. Make sure it's from Google Drive, YouTube, or Vimeo.
        </p>
      )}
    </div>
  );
}
