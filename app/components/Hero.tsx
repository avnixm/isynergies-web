'use client';

import { useEffect, useState, useRef, ReactNode, MouseEvent } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import Loading from './ui/loading';
import { getLogoImageSrc } from '@/app/lib/resolve-image-src';

type HeroSection = {
  weMakeItLogo: string | null;
  isLogo: string | null;
  fullLogo: string | null;
  backgroundImage: string | null; 
  backgroundVideo: string | null; 
  heroImagesBackgroundImage: string | null; 
  useHeroImages?: boolean;
};

type HeroTickerItem = {
  id: number;
  text: string;
  displayOrder: number;
};

type SiteSettings = {
  logoImage: string | null;
};

type NavLink = {
  label: string;
  href: string;
};

type HeroProps = {
  navLinks: NavLink[];
};

export default function Hero({ navLinks }: HeroProps) {
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [heroTickerItems, setHeroTickerItems] = useState<HeroTickerItem[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [videoCachedSrc, setVideoCachedSrc] = useState<string | null>(null);
  const [videoCacheFailed, setVideoCacheFailed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const videoObjectUrlRef = useRef<string | null>(null);
  const previousVideoUrlRef = useRef<string | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const announcementRef = useRef<HTMLDivElement>(null);
  const [useMarquee, setUseMarquee] = useState(false);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const sectionRes = await fetch('/api/admin/hero-section');
        if (sectionRes.ok) {
          const sectionData = await sectionRes.json();
          setHeroSection(sectionData);
        }

        const tickerRes = await fetch('/api/admin/hero-ticker');
        if (tickerRes.ok) {
          const tickerData = await tickerRes.json();
          if (Array.isArray(tickerData) && tickerData.length > 0) {
            setHeroTickerItems(tickerData);
          }
        } else {
          const errorText = await tickerRes.text();
          console.error('Failed to fetch hero ticker items:', tickerRes.status, tickerRes.statusText, errorText);
        }

        
        const settingsRes = await fetch('/api/admin/site-settings');
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSiteSettings({ logoImage: settingsData.logoImage || null });
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  
  const getImageUrl = (value: string | null): string | null => {
    if (!value) return null;
    if (value.startsWith('/api/images/') || value.startsWith('/api/media/') || value.startsWith('http') || value.startsWith('/')) return value;
    return `/api/images/${value}`;
  };

  const bgImage = heroSection?.useHeroImages
    ? getImageUrl(heroSection?.heroImagesBackgroundImage ?? null)
    : getImageUrl(heroSection?.backgroundImage ?? null);
  const bgVideo = getImageUrl(heroSection?.backgroundVideo ?? null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!bgVideo) {
      setVideoSrc(null);
      return;
    }
    if (bgVideo.startsWith('http')) {
      setVideoSrc(bgVideo);
      return;
    }
    if (typeof window !== 'undefined') {
      setVideoSrc(window.location.origin + (bgVideo.startsWith('/') ? bgVideo : '/' + bgVideo));
    } else {
      setVideoSrc(null);
    }
  }, [bgVideo]);
  const weMakeItImage = getImageUrl(heroSection?.weMakeItLogo ?? null);
  const isLogoImage = getImageUrl(heroSection?.isLogo ?? null);
  const fullLogoImage = getImageUrl(heroSection?.fullLogo ?? null);
  const logoSrc = getLogoImageSrc(siteSettings?.logoImage ?? null);

  
  const tickerItems = heroTickerItems;

  function parseTextWithLinks(text: string): ReactNode[] {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
      const href = match[2];
      const isHashLink = typeof href === 'string' && href.startsWith('#');
      parts.push(
        <a
          key={key++}
          href={href}
          {...(!isHashLink ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="underline hover:text-gray-300 transition-colors"
          onClick={(e) => {
            if (!isHashLink) return;
            e.preventDefault();
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.substring(lastIndex));
    return parts.length > 0 ? parts : [text];
  }

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    const isHashLink = typeof href === 'string' && href.startsWith('#');
    if (isHashLink) {
      event.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  const announcementBarContent = (
    <>
      {tickerItems.map((item, index) => (
        <div key={item.id} className="flex items-center gap-3 text-[inherit] font-medium text-white whitespace-nowrap sm:gap-4">
          {index > 0 && <span className="text-white/50 font-bold">-</span>}
          <span>{parseTextWithLinks(item.text)}</span>
        </div>
      ))}
    </>
  );
  const barClasses =
    'flex items-center justify-center gap-3 rounded-xl sm:rounded-2xl bg-gray-800/90 backdrop-blur-xl px-4 py-3 text-[11px] sm:gap-4 sm:px-6 sm:py-4 sm:text-[12px] shadow-2xl shadow-black/25 border border-gray-700/50 w-fit ticker-slow-fade';

  
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const prev = lastScrollY.current;
      lastScrollY.current = y;
      if (y <= 80) {
        setHeaderVisible(true);
        return;
      }
      if (y > prev) setHeaderVisible(false);
      else if (y < prev) setHeaderVisible(true);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  useEffect(() => {
    if (tickerItems.length === 0) return;
    const measure = () => {
      const el = announcementRef.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width;
      const maxW = window.innerWidth * 0.8;
      setUseMarquee(w > maxW);
    };
    const t = setTimeout(measure, 0);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, [tickerItems]);

  useEffect(() => {
    if (!bgVideo || videoError || heroSection?.useHeroImages) return;
    if (typeof caches === 'undefined') return;

    setVideoCacheFailed(false);
    const cacheName = 'hero-video-v1';
    const request = new Request(bgVideo, { mode: 'cors' });
    const previousUrl = previousVideoUrlRef.current;
    let aborted = false;

    const load = async () => {
      try {
        const cache = await caches.open(cacheName);
        
        if (previousUrl && previousUrl !== bgVideo) {
          try {
            await cache.delete(new Request(previousUrl, { mode: 'cors' }));
          } catch {
            
          }
        }
        previousVideoUrlRef.current = bgVideo;

        const res = await cache.match(request);
        if (res?.ok && !aborted) {
          const blob = await res.blob();
          if (aborted) return;
          const u = URL.createObjectURL(blob);
          videoObjectUrlRef.current = u;
          setVideoCachedSrc(u);
          return;
        }
        if (aborted) return;
        const fetchRes = await fetch(request, { mode: 'cors' });
        if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
        await cache.put(request, fetchRes.clone());
        if (aborted) return;
        const blob = await fetchRes.blob();
        if (aborted) return;
        const u = URL.createObjectURL(blob);
        videoObjectUrlRef.current = u;
        setVideoCachedSrc(u);
      } catch (e) {
        if (!aborted) {
          console.warn('Hero video cache fetch failed, using direct src:', e);
          setVideoCacheFailed(true);
          previousVideoUrlRef.current = null;
        }
      }
    };

    load();

    return () => {
      aborted = true;
      const u = videoObjectUrlRef.current;
      if (u) {
        URL.revokeObjectURL(u);
        videoObjectUrlRef.current = null;
      }
      setVideoCachedSrc(null);
    };
  }, [bgVideo, videoError, heroSection?.useHeroImages]);

  
  useEffect(() => {
    if (!videoRef.current || !heroRef.current || !bgVideo || videoError) return;

    const video = videoRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((error) => {
              console.warn('Video autoplay failed:', error);
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [bgVideo, videoError, videoCachedSrc, videoCacheFailed]);

  return (
    <section id="home" ref={heroRef} aria-label="Hero" className="relative min-h-[100dvh] min-h-screen overflow-hidden">
      {}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <Image
            src={bgImage as string}
            alt="iSynergies background"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0D1E66] via-[#003C9D] to-[#001A4F]" />
        )}
      </div>

      {}
      {!heroSection?.useHeroImages && bgVideo && !videoError && (videoCachedSrc || videoSrc) && (typeof caches === 'undefined' || videoCacheFailed ? true : !!videoCachedSrc) && (
        <div className="absolute inset-0 z-[5] overflow-hidden">
          <video
            ref={videoRef}
            src={(typeof caches !== 'undefined' && !videoCacheFailed && videoCachedSrc ? videoCachedSrc : videoSrc) as string}
            loop
            muted
            playsInline
            autoPlay
            preload={typeof caches !== 'undefined' && !videoCacheFailed && videoCachedSrc ? 'auto' : 'metadata'}
            crossOrigin="anonymous"
            className="w-full h-full object-cover opacity-40 scale-110"
            style={{ objectFit: 'cover', transform: 'scale(1.1)' }}
            onError={(e) => {
              const video = e.target as HTMLVideoElement;
              const code = video.error?.code ?? 'unknown';
              const message = (video.error?.message ?? '') || String(video.error?.code ?? '');
              console.error(
                'Background video failed to load:',
                `code=${code} message=${message} src=${bgVideo} networkState=${video.networkState} readyState=${video.readyState}`
              );
              console.warn('Background video failed to load, falling back to images');
              setVideoError(true);
            }}
            onLoadStart={() => {
              console.log('Background video load started:', bgVideo);
            }}
            onLoadedMetadata={() => {
              console.log('Background video metadata loaded');
            }}
            onCanPlay={() => {
              console.log('Background video loaded successfully and can play');
            }}
            onStalled={() => {
              console.warn('Background video stalled during loading');
            }}
            onSuspend={() => {
              
              
              
            }}
          />
          {}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-28 backdrop-blur-[18px] bg-slate-950/20"
            style={{
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.65), rgba(0,0,0,0))",
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.95), rgba(0,0,0,0.65), rgba(0,0,0,0))",
            }}
          />

          {}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 backdrop-blur-[18px] bg-slate-950/20"
            style={{
              WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.65), rgba(0,0,0,0))",
              maskImage: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.65), rgba(0,0,0,0))",
            }}
          />
        </div>
      )}

      {}
      {!loading && (
        <nav
          className={`fixed left-1/2 top-4 sm:top-6 z-30 w-[92%] max-w-4xl -translate-x-1/2 transition-transform duration-300 ease-out sm:w-[85%] ${
            headerVisible ? 'translate-y-0' : '-translate-y-[calc(100%+1.5rem)] sm:-translate-y-[calc(100%+2rem)]'
          }`}
        >
          <div className="navbar-dropdown flex items-center justify-between rounded-xl sm:rounded-2xl bg-gray-800/90 backdrop-blur-xl px-3 py-2 shadow-2xl shadow-black/25 border border-gray-700/50 sm:px-4">
            <div className="flex items-center min-w-0">
              {logoSrc ? (
                <div className="relative h-[28px] w-28 sm:h-[34px] sm:w-36 md:w-56 shrink-0">
                  <Image
                    src={logoSrc as string}
                    alt="iSynergies Inc."
                    fill
                    className="object-contain object-left"
                    sizes="(max-width: 640px) 112px, (max-width: 768px) 144px, 224px"
                    priority={false}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-[28px] w-28 sm:h-[34px] sm:w-36 md:w-56 rounded-lg bg-white/10 border border-white/20 shrink-0" />
              )}
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(event) => handleNavClick(event, link.href)}
                  className="text-white transition-colors hover:text-blue-300 scroll-smooth"
                >
                  {link.label}
                </a>
              ))}
            </div>
            {}
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-white md:hidden hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 -mr-1"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {}
          {mobileMenuOpen && (
            <div className="mt-1.5 rounded-xl sm:rounded-2xl bg-gray-900/95 backdrop-blur-xl px-3 py-2.5 shadow-2xl shadow-black/40 border border-gray-700/70 md:hidden sm:mt-2 sm:px-4 sm:py-3">
              <div className="flex flex-col gap-1 text-sm font-medium sm:gap-2">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(event) => handleNavClick(event, link.href)}
                    className="block rounded-lg px-2.5 py-2 text-white/90 hover:text-blue-300 hover:bg-white/5 transition-colors active:bg-white/10 touch-manipulation sm:px-2"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>
      )}

      {}
      {weMakeItImage && heroSection?.useHeroImages && (
        <div className="slide-right absolute left-4 top-[100px] z-20 w-[min(200px,55vw)] sm:left-6 sm:top-[130px] sm:w-[260px] md:left-11 md:top-[200px] md:w-[480px] md:-translate-y-1/2 lg:w-[580px]">
          <Image
            src={weMakeItImage as string}
            alt="We make IT possible"
            width={800}
            height={500}
            className="h-auto w-full object-contain object-left"
            priority
            loading="eager"
            unoptimized
          />
        </div>
      )}

      {}
      {isLogoImage && heroSection?.useHeroImages && (
        <div className="fade-in absolute right-2 top-[88px] z-10 w-[100px] opacity-90 sm:right-4 sm:top-[100px] sm:w-[140px] md:right-0 md:top-[100px] md:w-[500px] md:-translate-y-1/4 lg:w-[750px]">
          <Image
            src={isLogoImage as string}
            alt="iSynergies iS logo"
            width={1200}
            height={1200}
            className="h-auto w-full object-contain object-right"
            priority
            loading="eager"
            unoptimized
          />
        </div>
      )}

      {}
      {fullLogoImage && heroSection?.useHeroImages && (
        <div className="fade-in absolute left-1/2 top-[48%] z-20 w-[min(240px,72vw)] -translate-x-1/2 -translate-y-1/2 sm:w-[300px] md:left-auto md:right-2 md:top-[45%] md:w-[600px] md:translate-x-0 md:-translate-y-1/3 lg:right-[-40px] lg:w-[700px]">
          <Image
            src={fullLogoImage as string}
            alt="iSynergies Inc. full logo"
            width={750}
            height={375}
            className="h-auto w-full object-contain"
            priority
            loading="eager"
            unoptimized
          />
        </div>
      )}

      {}
      {tickerItems.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {}
          <div
            ref={announcementRef}
            aria-hidden
            className={`invisible absolute -top-[9999px] left-0 ${barClasses}`}
          >
            {announcementBarContent}
          </div>
          <div className="pointer-events-auto absolute bottom-5 left-1/2 z-10 w-full max-w-[90vw] -translate-x-1/2 px-3 sm:bottom-8 sm:max-w-[80vw] sm:px-4">
            <div className="flex justify-center">
              {useMarquee ? (
                <div className={`hero-announcement-marquee w-full max-w-full overflow-hidden rounded-xl border border-gray-700/50 bg-gray-800/90 px-4 py-3 text-[11px] shadow-2xl shadow-black/25 backdrop-blur-xl sm:rounded-2xl sm:px-6 sm:py-4 sm:text-[12px] ${'ticker-slow-fade'}`}>
                  <div className="hero-announcement-marquee-track">
                    <div className="flex min-w-max items-center justify-center gap-3 font-medium text-white whitespace-nowrap sm:gap-4">
                      {announcementBarContent}
                    </div>
                    <span className="flex-shrink-0 px-1 text-[11px] font-bold text-white/50 sm:text-[12px]">-</span>
                    <div className="flex min-w-max items-center justify-center gap-3 font-medium text-white whitespace-nowrap sm:gap-4">
                      {announcementBarContent}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={barClasses}>
                  {announcementBarContent}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
