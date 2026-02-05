'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Loading from './ui/loading';
import { Star, X, ChevronLeft, ChevronRight, Play, SkipBack, SkipForward } from 'lucide-react';
import { CustomVideoPlayer } from './ui/custom-video-player';

type FeaturedAppContent = {
  headerImage: string; 
  itemType: 'app' | 'website';
  downloadText: string;
  appStoreImage: string;
  googlePlayImage: string;
  appGalleryImage: string;
  visitText: string;
  websiteUrl: string;
  logoImage: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: string;
  appLogo: string;
  poweredByImage: string;
  bannerHeight: string;
};

type FeaturedAppCarouselImage = {
  id: number;
  image: string;
  alt: string;
  mediaType?: string;
  displayOrder: number;
};

type FeaturedAppFeature = {
  id: number;
  iconImage: string;
  label: string;
  displayOrder: number;
};


function convertToEmbedUrl(url: string): string {
  if (!url) return '';

  // Google Drive video
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // If it's already an embed URL, return as is
  if (url.includes('/embed/') || url.includes('iframe')) {
    return url;
  }

  return url;
}


function isVideoEmbedUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('drive.google.com')
  );
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test((value || '').trim());
}

export default function FeaturedApp() {
  const [content, setContent] = useState<FeaturedAppContent | null>(null);
  const [carouselImages, setCarouselImages] = useState<FeaturedAppCarouselImage[]>([]);
  const [features, setFeatures] = useState<FeaturedAppFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const modalCarouselRef = useRef<HTMLDivElement>(null);
  const featuredVideoContainerRef = useRef<HTMLDivElement>(null);
  const [modalShowLeftArrow, setModalShowLeftArrow] = useState(false);
  const [modalShowRightArrow, setModalShowRightArrow] = useState(true);
  const [pauseCarouselVideos, setPauseCarouselVideos] = useState(false);
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);
  const [didCarouselEnter, setDidCarouselEnter] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const [videoSlideDir, setVideoSlideDir] = useState<'next' | 'prev'>('next');
  const [isVideoSliding, setIsVideoSliding] = useState(false);
  const [isLeftVideoPlaying, setIsLeftVideoPlaying] = useState(false);
  const [embedAutoplay, setEmbedAutoplay] = useState(false);
  const [autoPlayRequested, setAutoPlayRequested] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      
      
      await Promise.allSettled([fetchContent(), fetchCarouselImages(), fetchFeatures()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/featured-app');
      if (response.ok) {
        const data = await response.json();
        setContent({
          headerImage: data.headerImage || data.header_image || '',
          itemType: (data.itemType || data.item_type || 'app') as 'app' | 'website',
          downloadText: data.downloadText || data.download_text || 'Download now via',
          appStoreImage: data.appStoreImage || data.app_store_image || '',
          googlePlayImage: data.googlePlayImage || data.google_play_image || '',
          appGalleryImage: data.appGalleryImage || data.app_gallery_image || '',
          visitText: data.visitText || data.visit_text || 'Visit the link to',
          websiteUrl: data.websiteUrl || data.website_url || '',
          logoImage: data.logoImage || data.logo_image || '',
          gradientFrom: data.gradientFrom || data.gradient_from || '#2563eb',
          gradientTo: data.gradientTo || data.gradient_to || '#1e40af',
          gradientDirection: data.gradientDirection || data.gradient_direction || 'to-r',
          appLogo: data.appLogo || data.app_logo || '',
          poweredByImage: data.poweredByImage || data.powered_by_image || '',
          bannerHeight: data.bannerHeight || data.banner_height || 'h-60',
        });
      } else {
        
        
        console.warn('Failed to fetch featured app content:', response.status, response.statusText);
      }
    } catch (error) {
      
      
      console.warn('Error fetching featured app content:', error);
    }
  };

  const fetchCarouselImages = async () => {
    try {
      const response = await fetch('/api/admin/featured-app/carousel');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched carousel images:', data);
        const sortedData = data.sort((a: FeaturedAppCarouselImage, b: FeaturedAppCarouselImage) => a.displayOrder - b.displayOrder);
        console.log('Sorted carousel images:', sortedData);
        setCarouselImages(sortedData);
      } else {
        
        console.warn('Failed to fetch carousel images:', response.status, response.statusText);
      }
    } catch (error) {
      
      console.warn('Error fetching carousel images:', error);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/admin/featured-app/features');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: FeaturedAppFeature, b: FeaturedAppFeature) => a.displayOrder - b.displayOrder);
        setFeatures(sortedData);
      } else {
        
        console.warn('Failed to fetch features:', response.status, response.statusText);
      }
    } catch (error) {
      
      console.warn('Error fetching features:', error);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  
  
  const autoScrollAnimationFrame = useRef<number | null>(null);

  const videoItems = useMemo(() => {
    return carouselImages.filter((item) => item.mediaType === 'video' || isVideoEmbedUrl(item.image));
  }, [carouselImages]);

  const hasVideos = videoItems.length > 0;

  
  useEffect(() => {
    if (videoIndex >= videoItems.length) {
      setVideoIndex(0);
    }
  }, [videoItems.length, videoIndex]);

  
  const primaryVideoItem = useMemo(() => {
    if (videoItems.length > 0) {
      return videoItems[Math.min(videoIndex, videoItems.length - 1)] || videoItems[0];
    }
    if (carouselImages.length === 0) return null;
    return carouselImages[0];
  }, [carouselImages, videoItems, videoIndex]);

  const navigateVideo = useCallback(
    (direction: 'prev' | 'next') => {
      if (videoItems.length <= 1) return;
      setVideoSlideDir(direction);
      setIsVideoSliding(true);
      setIsLeftVideoPlaying(false);
      
      setEmbedAutoplay(true);
      setAutoPlayRequested(true);

      window.setTimeout(() => {
        setVideoIndex((prev) => {
          const total = videoItems.length;
          if (direction === 'prev') return (prev - 1 + total) % total;
          return (prev + 1) % total;
        });
        setIsVideoSliding(false);
      }, 320);
    },
    [videoItems.length]
  );

  
  
  
  useEffect(() => {
    if (!autoPlayRequested) return;
    if (!primaryVideoItem) return;

    const t = window.setTimeout(() => {
      const el = featuredVideoContainerRef.current?.querySelector('video, iframe') as
        | HTMLVideoElement
        | HTMLIFrameElement
        | null;
      if (el && el.tagName.toLowerCase() === 'video') {
        try {
          (el as HTMLVideoElement).play().catch(() => {
            
          });
        } catch {
          
        }
      }
      setAutoPlayRequested(false);
    }, 50);

    return () => window.clearTimeout(t);
  }, [autoPlayRequested, primaryVideoItem]);

  
  const carouselDisplayItems = useMemo(() => {
    const base = carouselImages
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => !(item.mediaType === 'video' || isVideoEmbedUrl(item.image)));

    
    
    return [...base, ...base, ...base];
  }, [carouselImages]);

  
  const modalDisplayItems = useMemo(() => {
    return carouselImages
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => !(item.mediaType === 'video' || isVideoEmbedUrl(item.image)));
  }, [carouselImages]);

  
  useEffect(() => {
    if (!isVisible) return;
    if (didCarouselEnter) return;
    if (carouselDisplayItems.length === 0) return;

    const t = window.setTimeout(() => {
      setDidCarouselEnter(true);
    }, 700);

    return () => window.clearTimeout(t);
  }, [isVisible, didCarouselEnter, carouselDisplayItems.length]);

  
  const updateArrowVisibility = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      
      const canScrollLeft = scrollLeft > 1; 
      
      
      const remainingScroll = scrollWidth - clientWidth - scrollLeft;
      const canScrollRight = remainingScroll > 50; 
      
      setShowLeftArrow(canScrollLeft);
      setShowRightArrow(canScrollRight);
    }
  }, []);

  
  const updateModalArrowVisibility = useCallback(() => {
    if (modalCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = modalCarouselRef.current;
      const canScrollLeft = scrollLeft > 1;
      const remainingScroll = scrollWidth - clientWidth - scrollLeft;
      const canScrollRight = remainingScroll > 50;
      
      setModalShowLeftArrow(canScrollLeft);
      setModalShowRightArrow(canScrollRight);
    }
  }, []);


  
  const openModal = (originalIndex: number) => {
    
    setPauseCarouselVideos(true);
    
    const modalItemIndex = modalDisplayItems.findIndex(({ originalIndex: idx }) => idx === originalIndex);
    if (modalItemIndex !== -1) {
      setModalIndex(modalItemIndex);
    } else {
      
      setModalIndex(0);
    }
    setIsModalOpen(true);
    setPlayingVideoIndex(null); 
    
    setTimeout(() => {
      updateModalArrowVisibility();
    }, 100);
  };


  
  const navigateModal = (direction: 'left' | 'right') => {
    if (direction === 'left' && modalIndex > 0) {
      setModalIndex(modalIndex - 1);
      setPlayingVideoIndex(null); 
    } else if (direction === 'right' && modalIndex < modalDisplayItems.length - 1) {
      setModalIndex(modalIndex + 1);
      setPlayingVideoIndex(null); 
    }
  };


  
  const handleVideoPlay = (index: number) => {
    setPlayingVideoIndex(index);
  };

  
  useEffect(() => {
    if (carouselImages.length > 0) {
      
      const timeout1 = setTimeout(() => {
        updateArrowVisibility();
      }, 100);
      
      const timeout2 = setTimeout(() => {
        updateArrowVisibility();
      }, 300);
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    } else {
      
      setShowLeftArrow(false);
      setShowRightArrow(false);
    }
  }, [carouselImages]);

  
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel && carouselImages.length > 0) {
      
      const initialCheck = setTimeout(() => {
        updateArrowVisibility();
      }, 150);
      
      
      const handleScroll = () => {
        updateArrowVisibility();
      };
      
      
      carousel.addEventListener('scroll', handleScroll, { passive: true });
      
      
      if ('onscrollend' in carousel) {
        carousel.addEventListener('scrollend', handleScroll);
      }
      
      
      window.addEventListener('resize', updateArrowVisibility);
      
      
      let rafId: number | null = null;
      const checkDuringScroll = () => {
        updateArrowVisibility();
        rafId = requestAnimationFrame(checkDuringScroll);
      };
      
      
      let isScrolling = false;
      const scrollStartHandler = () => {
        if (!isScrolling) {
          isScrolling = true;
          rafId = requestAnimationFrame(checkDuringScroll);
        }
      };
      
      const scrollEndHandler = () => {
        isScrolling = false;
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        updateArrowVisibility();
      };
      
      carousel.addEventListener('scroll', scrollStartHandler, { passive: true });
      
      
      let scrollTimeout: NodeJS.Timeout;
      const detectScrollEnd = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          scrollEndHandler();
        }, 100);
      };
      
      carousel.addEventListener('scroll', detectScrollEnd, { passive: true });
      
      return () => {
        clearTimeout(initialCheck);
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
        clearTimeout(scrollTimeout);
        carousel.removeEventListener('scroll', handleScroll);
        carousel.removeEventListener('scroll', scrollStartHandler);
        carousel.removeEventListener('scroll', detectScrollEnd);
        if ('onscrollend' in carousel) {
          carousel.removeEventListener('scrollend', handleScroll);
        }
        window.removeEventListener('resize', updateArrowVisibility);
      };
    }
  }, [carouselImages, updateArrowVisibility]); 

  
  useEffect(() => {
    if (isModalOpen) {
      setPlayingVideoIndex(null);
    }
  }, [modalIndex, isModalOpen]);


  
  useEffect(() => {
    if (isModalOpen && modalCarouselRef.current) {
      const scrollToIndex = () => {
        if (modalCarouselRef.current) {
          const container = modalCarouselRef.current;
          const activeItem = container.querySelector(`[data-index="${modalIndex}"]`) as HTMLElement;
          if (activeItem) {
            
            const containerWidth = container.clientWidth;
            const itemWidth = activeItem.offsetWidth;
            
            
            const flexContainer = activeItem.parentElement;
            if (!flexContainer) return;
            
            
            let itemLeft = 0;
            for (let i = 0; i < modalIndex; i++) {
              const prevItem = flexContainer.querySelector(`[data-index="${i}"]`) as HTMLElement;
              if (prevItem) {
                const prevWidth = prevItem.offsetWidth;
                const gap = window.innerWidth >= 768 ? 16 : 12; 
                itemLeft += prevWidth + gap;
              }
            }
            
            
            const flexStyle = getComputedStyle(flexContainer);
            const paddingLeft = parseFloat(flexStyle.paddingLeft) || 0;
            
            
            const totalItemLeft = paddingLeft + itemLeft;
            
            
            const itemCenter = totalItemLeft + (itemWidth / 2);
            const containerCenter = containerWidth / 2;
            const targetScrollLeft = itemCenter - containerCenter;
            
            
            const maxScroll = Math.max(0, container.scrollWidth - containerWidth);
            const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));
            
            
            const startScroll = container.scrollLeft;
            const distance = finalScrollLeft - startScroll;
            const duration = 400; 
            const startTime = performance.now();
            
            const animateScroll = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);
              
              const currentScroll = startScroll + (distance * easeOutCubic);
              container.scrollLeft = currentScroll;
              
              if (progress < 1) {
                requestAnimationFrame(animateScroll);
              }
            };
            
            requestAnimationFrame(animateScroll);
          }
        }
      };
      
      setTimeout(scrollToIndex, 350);
      
      setTimeout(() => {
        updateModalArrowVisibility();
      }, 900);
    }
  }, [modalIndex, isModalOpen, modalDisplayItems.length, updateModalArrowVisibility]);

  
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && modalIndex > 0) {
        navigateModal('left');
      } else if (e.key === 'ArrowRight' && modalIndex < modalDisplayItems.length - 1) {
        navigateModal('right');
      } else if (e.key === 'Escape') {
        setIsModalOpen(false);
        
        setPauseCarouselVideos(false);
        setPlayingVideoIndex(null); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, modalIndex, modalDisplayItems.length]);


  
  
  
  
  useEffect(() => {
    return;
  }, [carouselDisplayItems.length, didCarouselEnter]);

  if (loading) {
    return (
      <section id="featured-app" ref={sectionRef} aria-label="Featured App" className="relative bg-white py-10 sm:py-12 md:py-16">
        <Loading message="Loading Featured App section" />
      </section>
    );
  }

  const getMediaUrl = (value: string | null | undefined, kind: 'image' | 'video' = 'image'): string => {
    if (!value) return '';

    // Videos can be stored either:
    // - as a media ID (from `media` table), or
    // - as a DB image/video record served by `/api/images/:id`, or
    // - as a Vercel Blob URL.
    //
    // We use `/api/images/:id` for numeric IDs because it can serve BOTH images and media IDs
    // without redirects (important: Chromium can block media loads that go through redirects).
    if (kind === 'video' && isNumericId(value)) {
      return `/api/images/${value.trim()}`;
    }

    
    if (
      value.startsWith('/api/images/') ||
      value.startsWith('/api/media/') ||
      value.startsWith('http') ||
      value.startsWith('/')
    ) {
      return value;
    }

    
    return `/api/images/${value}`;
  };

  
  

  
  const getGradientDirection = (direction: string): string => {
    const directionMap: Record<string, string> = {
      'to-r': 'to right',
      'to-l': 'to left',
      'to-b': 'to bottom',
      'to-t': 'to top',
      'to-br': 'to bottom right',
      'to-bl': 'to bottom left',
      'to-tr': 'to top right',
      'to-tl': 'to top left',
    };
    return directionMap[direction] || 'to right';
  };

  
  const useCustomBanner = content && (content.appLogo || content.gradientFrom || content.gradientTo);

  return (
    <section id="featured-app" ref={sectionRef} aria-label="Featured App" className="relative bg-white">
      {}
      {useCustomBanner ? (
        <div
          className="w-full h-36 sm:h-44 md:h-52 lg:h-60 relative overflow-hidden"
          style={{
            background: `linear-gradient(${getGradientDirection(content.gradientDirection || 'to-r')}, ${content.gradientFrom || '#2563eb'}, ${content.gradientTo || '#1e40af'})`,
          }}
        >
         
          <div 
            className={`absolute top-3 right-3 z-10 sm:top-4 sm:right-4 ${
              isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
            }`}
            style={{
              animationDelay: isVisible ? '0.3s' : '0s',
            }}
          >
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 border border-white/30 sm:gap-2 sm:px-4 sm:py-2">
              <Star className="h-3.5 w-3.5 text-white fill-white sm:h-4 sm:w-4 shrink-0" />
              <span className="text-white text-xs font-semibold sm:text-sm">Featured</span>
            </div>
          </div>

         
          <div 
            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 h-[70%] max-h-full flex items-center gap-1 sm:left-6 md:left-8 ${
              isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
            }`}
            style={{
              animationDelay: isVisible ? '0.3s' : '0s',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
            }}
          >
            {content.appLogo && (
              <img
                src={getMediaUrl(content.appLogo, 'image')}
                alt="App Logo"
                className="w-auto h-full max-w-[45vw] object-contain"
              />
            )}
            {content.poweredByImage && (
              <img
                src={getMediaUrl(content.poweredByImage, 'image')}
                alt="Powered By"
                className="w-auto h-full max-w-[35vw] object-contain mt-6 sm:mt-8 md:mt-[5rem]"
              />
            )}
          </div>

          {}
          {features.length > 0 && (
            <div 
              className={`absolute bottom-0 right-4 z-10 flex items-center gap-2 max-w-[85%] justify-end overflow-x-auto py-2 md:bottom-[-5px] md:right-8 md:gap-4 md:overflow-visible md:py-0 ${
                isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
              }`}
              style={{
                animationDelay: isVisible ? '0.3s' : '0s',
              }}
            >
              {features.map((feature) => {
                const iconUrl = getMediaUrl(feature.iconImage, 'image');
                return (
                  <div key={feature.id} className="flex shrink-0 items-center">
                    {iconUrl && (
                      <img
                        src={iconUrl}
                        alt={feature.label}
                        className="h-12 w-12 object-contain sm:h-16 sm:w-16 md:h-24 md:w-24 lg:h-28 lg:w-28"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : content?.headerImage ? (
        
        <div className="w-full h-40 sm:h-52 md:h-64 overflow-hidden">
          <img
            src={getMediaUrl(content.headerImage, 'image')}
            alt="Featured App Header"
            className="w-full h-full object-cover"
          />
        </div>
      ) : null}

      {}
      {carouselImages.length > 0 && (
        <div className="w-full py-3 sm:py-4 bg-[#D7E1E4] relative">
          <div className="relative w-full flex flex-col md:flex-row items-stretch gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-6">
            {}
            {hasVideos && (
              <div className="w-full md:w-[30%] flex items-center justify-center">
                {primaryVideoItem && (
                <div 
                  ref={featuredVideoContainerRef} 
                  className="relative w-full h-[150px] sm:h-[180px] md:h-[220px]"
                  onMouseEnter={() => {
                    
                    setEmbedAutoplay(true);
                    setAutoPlayRequested(true);
                  }}
                >
                  {}
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-200 shadow-md">
                    {}
                    <div
                      key={`featured-video-${primaryVideoItem.id}-${videoIndex}`}
                      className={`w-full h-full ${isVideoSliding ? 'opacity-0' : 'opacity-100'}`}
                      style={{
                        transition: 'opacity 180ms ease-out, transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                        transform: isVideoSliding
                          ? videoSlideDir === 'next'
                            ? 'translateX(-24px)'
                            : 'translateX(24px)'
                          : 'translateX(0)',
                      }}
                    >
                      {primaryVideoItem.mediaType === 'video' || isVideoEmbedUrl(primaryVideoItem.image) ? (
                        <div className="w-full h-full overflow-hidden">
                          <CustomVideoPlayer
                            
                            
                            src={getMediaUrl(primaryVideoItem.image, 'video')}
                            title={primaryVideoItem.alt || 'Featured video'}
                            className="w-full h-full"
                            objectFit="cover"
                            shouldPause={pauseCarouselVideos}
                            onPlay={() => setIsLeftVideoPlaying(true)}
                            onPause={() => setIsLeftVideoPlaying(false)}
                            autoplay={embedAutoplay}
                          />
                        </div>
                      ) : (
                          <img
                            src={getMediaUrl(primaryVideoItem.image, 'image')}
                          alt={primaryVideoItem.alt}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {}
                    {(primaryVideoItem.mediaType === 'video' || isVideoEmbedUrl(primaryVideoItem.image)) && (
                      <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <div
                          className={`pointer-events-auto flex items-center shrink-0 transition-[gap,width] duration-300 ${
                            isLeftVideoPlaying || isVideoSliding
                              ? 'w-full justify-between px-2 sm:px-3 md:px-5'
                              : 'justify-center gap-1.5 sm:gap-2 md:gap-3'
                          }`}
                          style={{ backgroundColor: 'transparent' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          {videoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                navigateVideo('prev');
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shrink-0 touch-manipulation"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', outline: 'none' }}
                              aria-label="Previous video"
                            >
                              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white shrink-0 fill-white" />
                            </button>
                          )}
                          {!isLeftVideoPlaying && !isVideoSliding && (
                            <button
                              type="button"
                              className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shrink-0 touch-manipulation"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', outline: 'none' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsLeftVideoPlaying(true);
                                setEmbedAutoplay(true);
                                const el = featuredVideoContainerRef.current?.querySelector('iframe, video');
                                if (el) {
                                  try {
                                    (el as HTMLElement).focus();
                                    el.dispatchEvent(new MouseEvent('click', { bubbles: false, view: window }));
                                  } catch {
                                    
                                  }
                                }
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              aria-label="Play"
                            >
                              <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white fill-white ml-0.5 shrink-0" />
                            </button>
                          )}
                          {videoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                navigateVideo('next');
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shrink-0 touch-manipulation"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', outline: 'none' }}
                              aria-label="Next video"
                            >
                              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white shrink-0 fill-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}

            {}
            <div className={`w-full ${hasVideos ? 'md:w-[70%]' : 'md:w-full'} relative`}>
              <div className="relative w-full h-full flex items-center">
                {}
                {false && showLeftArrow && (
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        const scrollAmount = 400;
                        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                        
                        setTimeout(() => {
                          updateArrowVisibility();
                        }, 500);
                      }
                    }}
                    className="absolute left-0 -ml-2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-gray-800" />
                  </button>
                )}

                {}
                <div ref={carouselRef} className="overflow-hidden pl-0">
                  {}
                  <div
                    className={`${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                    style={{
                      animationDelay: isVisible ? '0.3s' : '0s',
                      animation:
                        isVisible && !didCarouselEnter
                          ? 'featured-carousel-slide-left 900ms cubic-bezier(0.22, 1, 0.36, 1) both'
                          : undefined,
                    }}
                  >
                    <div
                      className="projects-marquee-track flex gap-2 sm:gap-[10px] pl-0"
                      style={{
                        paddingRight: 'clamp(40px, 6vw, 120px)',
                        ['--marquee-duration' as any]: '22s',
                        animationPlayState: isVisible ? 'running' : 'paused',
                      }}
                    >
                    {carouselDisplayItems.map(({ item, originalIndex }, displayIndex) => {
                      const mediaUrl = getMediaUrl(item.image, 'image');
                      const isFirst = displayIndex === 0;

                      return (
                        <div
                          key={`${item.id}-${displayIndex}`}
                          className={`group relative flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 cursor-pointer touch-manipulation ${
                            isFirst
                              ? 'w-[260px] h-[140px] sm:w-[300px] sm:h-[160px] md:w-[450px] md:h-[220px]'
                              : 'w-[180px] h-[140px] sm:w-[220px] sm:h-[160px] md:w-[350px] md:h-[220px]'
                          }`}
                          onClick={() => openModal(originalIndex)}
                        >
                          {mediaUrl ? (
                            <img
                              src={mediaUrl}
                              alt={item.alt}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>

                {}
                {false && showRightArrow && (
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
                        const remainingScroll = scrollWidth - clientWidth - scrollLeft;

                        
                        
                        if (remainingScroll < 450) {
                          
                          carouselRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
                        } else {
                          carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                        }

                        
                        updateArrowVisibility();
                        
                        const checkInterval = setInterval(() => {
                          updateArrowVisibility();
                        }, 50);
                        
                        setTimeout(() => {
                          clearInterval(checkInterval);
                          updateArrowVisibility();
                        }, 600);
                      }
                    }}
                    className="absolute right-0 -mr-2 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-gray-800" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-3 sm:p-4 md:p-8"
          onClick={() => {
            setIsModalOpen(false);
            
            setPauseCarouselVideos(false);
            setPlayingVideoIndex(null); 
          }}
        >
          {}
          <button
            onClick={() => {
              setIsModalOpen(false);
              
              setPauseCarouselVideos(false);
              setPlayingVideoIndex(null); 
            }}
            className="absolute top-3 right-3 z-60 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 touch-manipulation sm:top-4 sm:right-4"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-800" />
          </button>

          {}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {}
            {modalShowLeftArrow && (
              <button
                onClick={() => navigateModal('left')}
                className="absolute left-1 sm:left-2 md:left-4 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 touch-manipulation"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-800" />
              </button>
            )}

            {}
            <div
              ref={modalCarouselRef}
              className="overflow-x-auto scrollbar-hide w-full h-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollBehavior: 'auto', 
              }}
              onScroll={updateModalArrowVisibility}
            >
              <div className="flex gap-3 md:gap-4 items-center h-full" style={{ 
                paddingLeft: 'calc(50vw - 42.5vw)',
                paddingRight: 'calc(50vw - 42.5vw)',
                minWidth: '100%',
              }}>
                {modalDisplayItems.map(({ item, originalIndex }, index) => {
                  const mediaUrl = getMediaUrl(item.image, 'image');
                  const isActive = index === modalIndex;
                  
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      className={`flex-shrink-0 transition-all duration-300 flex items-center justify-center ${
                        isActive 
                          ? 'w-[90vw] max-w-5xl h-[70vh] max-h-[700px] sm:w-[85vw] sm:h-[75vh]' 
                          : 'w-[64px] h-[44px] sm:w-[90px] sm:h-[60px] md:w-[150px] md:h-[100px] opacity-40'
                      }`}
                    >
                      {mediaUrl ? (
                        <img
                          src={mediaUrl}
                          alt={item.alt}
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg" />
                      )}
                    </div>
                  );
                })}
                {}
                <div 
                  className="flex-shrink-0" 
                  style={{ 
                    width: 'calc(50vw - 42.5vw)',
                    minWidth: '100px',
                    maxWidth: '200px'
                  }} 
                />
              </div>
            </div>

            {}
            {modalShowRightArrow && modalIndex < modalDisplayItems.length - 1 && (
              <button
                onClick={() => navigateModal('right')}
                className="absolute right-1 sm:right-2 md:right-4 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 touch-manipulation"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gray-800" />
              </button>
            )}
          </div>
        </div>
      )}

      {}
      {content && (
        <div 
          className="w-full py-3 sm:py-4 relative bg-[#D7E1E4]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 px-3 sm:px-4 md:px-6">
            {}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3 items-center">
              {content.itemType === 'app' ? (
                
                <>
                  {content.downloadText && (
                    <p className="text-gray-900 text-xs sm:text-sm md:text-base font-medium whitespace-nowrap w-full text-center md:w-auto md:text-left">
                      {content.downloadText}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2">
                    {content.appStoreImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={getMediaUrl(content.appStoreImage, 'image')}
                          alt="App Store"
                          className="h-12 sm:h-16 md:h-20 lg:h-24 object-contain"
                        />
                      </div>
                    )}
                    {content.googlePlayImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={getMediaUrl(content.googlePlayImage, 'image')}
                          alt="Google Play"
                          className="h-12 sm:h-16 md:h-20 lg:h-24 object-contain"
                        />
                      </div>
                    )}
                    {content.appGalleryImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={getMediaUrl(content.appGalleryImage, 'image')}
                          alt="App Gallery"
                          className="h-12 sm:h-16 md:h-20 lg:h-24 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                
                <>
                  {content.visitText && (
                    <p className="text-gray-900 text-xs sm:text-sm md:text-base font-medium whitespace-nowrap">
                      {content.visitText}
                    </p>
                  )}
                  {content.websiteUrl && (
                    <a
                      href={content.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 text-xs sm:text-sm md:text-base font-medium underline hover:text-blue-600 transition-colors break-all text-center md:text-left"
                    >
                      {content.websiteUrl}
                    </a>
                  )}
                </>
              )}
            </div>

            {}
            {content.logoImage && (
              <div className="flex-shrink-0">
                <img
                  src={getMediaUrl(content.logoImage, 'image')}
                  alt="Logo"
                  className="h-8 sm:h-10 md:h-12 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

