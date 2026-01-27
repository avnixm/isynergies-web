'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Loading from './ui/loading';
import { Star, X, ChevronLeft, ChevronRight, Play, SkipBack, SkipForward } from 'lucide-react';
import { CustomVideoPlayer } from './ui/custom-video-player';

type FeaturedAppContent = {
  headerImage: string; // Kept for backward compatibility
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

// Helper to convert video URLs to embed URLs
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

// Check if URL is a video embed URL
function isVideoEmbedUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('drive.google.com')
  );
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
      // Use Promise.allSettled so each fetch can fail independently
      // This way if one fails, the others can still load
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
        // Don't throw - just log the error and continue
        // The component will use default/empty values
        console.warn('Failed to fetch featured app content:', response.status, response.statusText);
      }
    } catch (error) {
      // Don't throw - just log the error
      // This allows other fetches to continue
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
        // Don't throw - just log and continue
        console.warn('Failed to fetch carousel images:', response.status, response.statusText);
      }
    } catch (error) {
      // Don't throw - just log the error
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
        // Don't throw - just log and continue
        console.warn('Failed to fetch features:', response.status, response.statusText);
      }
    } catch (error) {
      // Don't throw - just log the error
      console.warn('Error fetching features:', error);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Continuous auto-scroll for the main carousel on the right side
  const autoScrollAnimationFrame = useRef<number | null>(null);

  const videoItems = useMemo(() => {
    return carouselImages.filter((item) => item.mediaType === 'video' || isVideoEmbedUrl(item.image));
  }, [carouselImages]);

  // Reset video index when video list changes
  useEffect(() => {
    if (videoIndex >= videoItems.length) {
      setVideoIndex(0);
    }
  }, [videoItems.length, videoIndex]);

  // Determine primary video item for the left video section (fallback to first item)
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
      setEmbedAutoplay(false);

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

  // Only show non-video items in the right-side image carousel (prevents "duplicate video")
  const carouselDisplayItems = useMemo(() => {
    const base = carouselImages
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => !(item.mediaType === 'video' || isVideoEmbedUrl(item.image)));

    // Duplicate list for seamless looping, similar to Projects marquee
    return [...base, ...base];
  }, [carouselImages]);

  // One-time "slide in from the right" intro for the carousel track
  useEffect(() => {
    if (!isVisible) return;
    if (didCarouselEnter) return;
    if (carouselDisplayItems.length === 0) return;

    const t = window.setTimeout(() => {
      setDidCarouselEnter(true);
    }, 700);

    return () => window.clearTimeout(t);
  }, [isVisible, didCarouselEnter, carouselDisplayItems.length]);

  // Function to check scroll position and update arrow visibility
  const updateArrowVisibility = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      // Left arrow only shows when user has scrolled to the right (scrollLeft > 0)
      const canScrollLeft = scrollLeft > 1; // Use 1px threshold to be more responsive
      // Right arrow shows when there's more content to scroll
      // Use a larger threshold (50px) so arrow stays visible until user is very close to the end
      const remainingScroll = scrollWidth - clientWidth - scrollLeft;
      const canScrollRight = remainingScroll > 50; // Show arrow if more than 50px left to scroll
      
      setShowLeftArrow(canScrollLeft);
      setShowRightArrow(canScrollRight);
    }
  }, []);

  // Function to update modal arrow visibility
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

  // Open modal at specific index
  const openModal = (index: number) => {
    // Pause all carousel videos before opening modal
    setPauseCarouselVideos(true);
    setModalIndex(index);
    setIsModalOpen(true);
    setPlayingVideoIndex(null); // Reset playing video when opening modal
    // Update modal arrow visibility after opening
    setTimeout(() => {
      updateModalArrowVisibility();
    }, 100);
  };

  // Navigate modal carousel
  const navigateModal = (direction: 'left' | 'right') => {
    if (direction === 'left' && modalIndex > 0) {
      setModalIndex(modalIndex - 1);
      setPlayingVideoIndex(null); // Reset playing video when navigating
    } else if (direction === 'right' && modalIndex < carouselImages.length - 1) {
      setModalIndex(modalIndex + 1);
      setPlayingVideoIndex(null); // Reset playing video when navigating
    }
  };

  // Handle video play - pause all other videos
  const handleVideoPlay = (index: number) => {
    setPlayingVideoIndex(index);
  };

  // Update arrow visibility when carousel images change
  useEffect(() => {
    if (carouselImages.length > 0) {
      // Use multiple timeouts to ensure DOM is fully rendered and measured
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
      // Reset arrows when no images
      setShowLeftArrow(false);
      setShowRightArrow(false);
    }
  }, [carouselImages]);

  // Add scroll event listener and initial check
  useEffect(() => {
    const carousel = carouselRef.current;
    if (carousel && carouselImages.length > 0) {
      // Initial check after a short delay to ensure layout is complete
      const initialCheck = setTimeout(() => {
        updateArrowVisibility();
      }, 150);
      
      // Enhanced scroll handler that works with smooth scrolling
      const handleScroll = () => {
        updateArrowVisibility();
      };
      
      // Listen to scroll events
      carousel.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also listen for scrollend event if available (better for smooth scrolling)
      if ('onscrollend' in carousel) {
        carousel.addEventListener('scrollend', handleScroll);
      }
      
      // Also check on resize
      window.addEventListener('resize', updateArrowVisibility);
      
      // Use requestAnimationFrame to check during smooth scroll animations
      let rafId: number | null = null;
      const checkDuringScroll = () => {
        updateArrowVisibility();
        rafId = requestAnimationFrame(checkDuringScroll);
      };
      
      // Start checking when scrolling starts
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
      
      // Detect when smooth scroll ends
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
  }, [carouselImages, updateArrowVisibility]); // Re-run when images change to re-check visibility

  // Reset playing video when modal index changes
  useEffect(() => {
    if (isModalOpen) {
      setPlayingVideoIndex(null);
    }
  }, [modalIndex, isModalOpen]);

  // Update modal carousel scroll position when modalIndex changes
  useEffect(() => {
    if (isModalOpen && modalCarouselRef.current) {
      const scrollToIndex = () => {
        if (modalCarouselRef.current) {
          const container = modalCarouselRef.current;
          const activeItem = container.querySelector(`[data-index="${modalIndex}"]`) as HTMLElement;
          if (activeItem) {
            // Get container and item dimensions
            const containerWidth = container.clientWidth;
            const itemWidth = activeItem.offsetWidth;
            
            // Get the flex container to find item position
            const flexContainer = activeItem.parentElement;
            if (!flexContainer) return;
            
            // Calculate position by summing all previous items
            let itemLeft = 0;
            for (let i = 0; i < modalIndex; i++) {
              const prevItem = flexContainer.querySelector(`[data-index="${i}"]`) as HTMLElement;
              if (prevItem) {
                const prevWidth = prevItem.offsetWidth;
                const gap = window.innerWidth >= 768 ? 16 : 12; // gap-3 = 12px, gap-4 = 16px
                itemLeft += prevWidth + gap;
              }
            }
            
            // Get padding from flex container
            const flexStyle = getComputedStyle(flexContainer);
            const paddingLeft = parseFloat(flexStyle.paddingLeft) || 0;
            
            // Total left position including padding
            const totalItemLeft = paddingLeft + itemLeft;
            
            // Calculate scroll to center: item center should align with container center
            const itemCenter = totalItemLeft + (itemWidth / 2);
            const containerCenter = containerWidth / 2;
            const targetScrollLeft = itemCenter - containerCenter;
            
            // Clamp to valid range
            const maxScroll = Math.max(0, container.scrollWidth - containerWidth);
            const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));
            
            // Use requestAnimationFrame for smooth scrolling without bounce
            const startScroll = container.scrollLeft;
            const distance = finalScrollLeft - startScroll;
            const duration = 400; // milliseconds
            const startTime = performance.now();
            
            const animateScroll = (currentTime: number) => {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Use ease-out cubic for smooth deceleration
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
      // Wait for layout to update and transitions to complete
      setTimeout(scrollToIndex, 350);
      // Update arrow visibility after scroll completes
      setTimeout(() => {
        updateModalArrowVisibility();
      }, 900);
    }
  }, [modalIndex, isModalOpen, carouselImages.length, updateModalArrowVisibility]);

  // Handle keyboard navigation in modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && modalIndex > 0) {
        navigateModal('left');
      } else if (e.key === 'ArrowRight' && modalIndex < carouselImages.length - 1) {
        navigateModal('right');
      } else if (e.key === 'Escape') {
        setIsModalOpen(false);
        // Allow carousel videos to play again when modal closes
        setPauseCarouselVideos(false);
        setPlayingVideoIndex(null); // Reset playing video when modal closes
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, modalIndex, carouselImages.length]);

  // Continuous auto-scroll for the main carousel on the right side
  // NOTE: The actual infinite scrolling is now handled via CSS keyframes
  // (see .projects-marquee-track / projectsMarquee in globals.css).
  // We keep this effect as a no-op so hook order remains stable.
  useEffect(() => {
    return;
  }, [carouselDisplayItems.length, didCarouselEnter]);

  if (loading) {
    return (
      <section id="featured-app" ref={sectionRef} className="relative bg-white py-16">
        <Loading message="Loading Featured App section" />
      </section>
    );
  }

  const getImageUrl = (imageId: string | null | undefined): string => {
    if (!imageId) return '';
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
      return imageId;
    }
    return `/api/images/${imageId}`;
  };

  // Helper to convert video URLs to embed URLs
  // (moved to top-level helpers)

  // Convert gradient direction from Tailwind format to CSS format
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

  // Check if we should use new customizable banner or fallback to old headerImage
  const useCustomBanner = content && (content.appLogo || content.gradientFrom || content.gradientTo);

  return (
    <section id="featured-app" ref={sectionRef} className="relative bg-white">
      {/* Block 1: Customizable Banner or Fallback to Header Image */}
      {useCustomBanner ? (
        <div
          className={`w-full ${content.bannerHeight || 'h-60'} relative overflow-hidden`}
          style={{
            background: `linear-gradient(${getGradientDirection(content.gradientDirection || 'to-r')}, ${content.gradientFrom || '#2563eb'}, ${content.gradientTo || '#1e40af'})`,
          }}
        >
         
          <div 
            className={`absolute top-4 right-4 z-10 ${
              isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
            }`}
            style={{
              animationDelay: isVisible ? '0.3s' : '0s',
            }}
          >
            <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 border border-white/30">
              <Star className="h-4 w-4 text-white fill-white" />
              <span className="text-white text-sm font-semibold">Featured</span>
            </div>
          </div>

         
          <div 
            className={`absolute left-8 top-1/2 -translate-y-1/2 z-10 h-full flex items-center gap-1 ${
              isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
            }`}
            style={{
              animationDelay: isVisible ? '0.3s' : '0s',
              maxHeight: '100%',
              paddingTop: '1rem',
              paddingBottom: '1rem',
            }}
          >
            {content.appLogo && (
              <img
                src={getImageUrl(content.appLogo)}
                alt="App Logo"
                className="w-auto h-full object-contain"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                }}
              />
            )}
            {content.poweredByImage && (
              <img
                src={getImageUrl(content.poweredByImage)}
                alt="Powered By"
                className="w-auto h-full object-contain"
                style={{
                  maxHeight: '100%',
                  maxWidth: '100%',
                  marginTop: '5rem',
                }}
              />
            )}
          </div>

          {/* Feature Icons - Bottom Right */}
          {features.length > 0 && (
            <div 
              className={`absolute bottom-[-5px] right-8 z-10 hidden md:flex items-center gap-4 max-w-md justify-end ${
                isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
              }`}
              style={{
                animationDelay: isVisible ? '0.3s' : '0s',
              }}
            >
              {features.map((feature) => {
                const iconUrl = getImageUrl(feature.iconImage);
                return (
                  <div key={feature.id} className="flex items-center">
                    {iconUrl && (
                      <img
                        src={iconUrl}
                        alt={feature.label}
                        className="h-28 w-28 object-contain"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : content?.headerImage ? (
        // Fallback to old header image for backward compatibility
        <div className="w-full h-27 md:h-43 overflow-hidden">
          <img
            src={getImageUrl(content.headerImage)}
            alt="Featured App Header"
            className="w-full h-full object-fill"
          />
        </div>
      ) : null}

      {/* Block 2: Horizontal Carousel with Navigation */}
      {carouselImages.length > 0 && (
        <div className="w-full py-4 bg-[#D7E1E4] relative">
          <div className="relative w-full flex flex-col md:flex-row items-stretch gap-4 md:gap-6 px-4 md:px-6">
            {/* Left: Video Section (30% width on desktop) */}
            <div className="w-full md:w-[30%] flex items-center justify-center">
              {primaryVideoItem && (
                <div ref={featuredVideoContainerRef} className="relative w-full h-[180px] md:h-[220px]">
                  {/* Inner frame: rounded, clips video. All controls inside frame (YouTube-style). */}
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-200 shadow-md">
                    {/* Video content with slide transition */}
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
                        <CustomVideoPlayer
                          src={primaryVideoItem.image}
                          title={primaryVideoItem.alt || 'Featured video'}
                          className="w-full h-full"
                          shouldPause={pauseCarouselVideos}
                          onPlay={() => setIsLeftVideoPlaying(true)}
                          onPause={() => setIsLeftVideoPlaying(false)}
                          autoplay={embedAutoplay}
                        />
                      ) : (
                        <img
                          src={getImageUrl(primaryVideoItem.image)}
                          alt={primaryVideoItem.alt}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* YouTube-style controls: Prev | Play | Next – separate dark circles, inside frame */}
                    {(primaryVideoItem.mediaType === 'video' || isVideoEmbedUrl(primaryVideoItem.image)) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div
                          className={`pointer-events-auto flex items-center shrink-0 transition-[gap,width] duration-300 ${
                            isLeftVideoPlaying || isVideoSliding
                              ? 'w-full justify-between px-3 md:px-5'
                              : 'justify-center gap-2 md:gap-3'
                          }`}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          {videoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => navigateVideo('prev')}
                              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', outline: 'none' }}
                              aria-label="Previous video"
                            >
                              <SkipBack className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0 fill-white" />
                            </button>
                          )}
                          {!isLeftVideoPlaying && !isVideoSliding && (
                            <button
                              type="button"
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', outline: 'none' }}
                              onClick={() => {
                                setIsLeftVideoPlaying(true);
                                setEmbedAutoplay(true);
                                const el = featuredVideoContainerRef.current?.querySelector('iframe, video');
                                if (el) {
                                  try {
                                    (el as HTMLElement).focus();
                                    el.dispatchEvent(new MouseEvent('click', { bubbles: true, view: window }));
                                  } catch {
                                    /* native video click; iframe uses autoplay URL */
                                  }
                                }
                              }}
                              aria-label="Play"
                            >
                              <Play className="w-6 h-6 md:w-7 md:h-7 text-white fill-white ml-0.5 shrink-0" />
                            </button>
                          )}
                          {videoItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => navigateVideo('next')}
                              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110 shrink-0"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', outline: 'none' }}
                              aria-label="Next video"
                            >
                              <SkipForward className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0 fill-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Horizontal Carousel with Navigation (70% width on desktop) */}
            <div className="w-full md:w-[70%] relative">
              <div className="relative w-full h-full flex items-center">
                {/* Left Arrow Button - disabled while using infinite auto-scroll */}
                {false && showLeftArrow && (
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        const scrollAmount = 400;
                        carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                        // Check visibility after scroll animation
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

                {/* Scrollable Carousel */}
                <div ref={carouselRef} className="overflow-hidden pl-0">
                  {/* Wrapper handles intro + fade without overriding marquee animation */}
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
                      className="projects-marquee-track flex gap-[10px] pl-0"
                      style={{
                        paddingRight: 'clamp(60px, 8vw, 120px)', // Responsive padding: 60px mobile, scales up to 120px on larger screens
                        ['--marquee-duration' as any]: '22s', // shorter = faster scroll movement (px/s)
                        animationPlayState: isVisible ? 'running' : 'paused',
                      }}
                    >
                    {carouselDisplayItems.map(({ item, originalIndex }, displayIndex) => {
                      const mediaUrl = getImageUrl(item.image);
                      const isFirst = displayIndex === 0;
                      const isVideo = item.mediaType === 'video' || isVideoEmbedUrl(item.image);
                      const embedUrl = isVideo && item.image ? convertToEmbedUrl(item.image) : '';

                      return (
                        <div
                          key={`${item.id}-${displayIndex}`}
                          className={`group relative flex-shrink-0 overflow-hidden bg-gray-200 cursor-pointer ${
                            isFirst ? 'rounded-lg' : ''
                          } ${
                            isFirst
                              ? 'w-[350px] h-[180px] md:w-[450px] md:h-[220px]'
                              : 'w-[250px] h-[180px] md:w-[350px] md:h-[220px]'
                          }`}
                          onClick={() => openModal(originalIndex)}
                        >
                          {mediaUrl ? (
                            isVideo && embedUrl ? (
                              <CustomVideoPlayer
                                src={item.image}
                                title={item.alt || 'Video'}
                                className="w-full h-full"
                                shouldPause={pauseCarouselVideos}
                              />
                            ) : (
                              <img
                                src={mediaUrl}
                                alt={item.alt}
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>
                </div>

                {/* Right Arrow Button - disabled while using infinite auto-scroll */}
                {false && showRightArrow && (
                  <button
                    onClick={() => {
                      if (carouselRef.current) {
                        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
                        const remainingScroll = scrollWidth - clientWidth - scrollLeft;

                        // If we're close to the end, scroll to the very end (accounting for padding)
                        // Otherwise, scroll by the normal amount
                        if (remainingScroll < 450) {
                          // Scroll to end minus some padding to ensure space is visible
                          carouselRef.current.scrollTo({ left: scrollWidth - clientWidth, behavior: 'smooth' });
                        } else {
                          carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                        }

                        // Immediately check (for instant scroll)
                        updateArrowVisibility();
                        // Check visibility during and after scroll animation
                        const checkInterval = setInterval(() => {
                          updateArrowVisibility();
                        }, 50);
                        // Clear interval after scroll animation completes
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

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 md:p-8"
          onClick={() => {
            setIsModalOpen(false);
            // Allow carousel videos to play again when modal closes
            setPauseCarouselVideos(false);
            setPlayingVideoIndex(null); // Reset playing video when modal closes
          }}
        >
          {/* Close button */}
          <button
            onClick={() => {
              setIsModalOpen(false);
              // Allow carousel videos to play again when modal closes
              setPauseCarouselVideos(false);
              setPlayingVideoIndex(null); // Reset playing video when modal closes
            }}
            className="absolute top-4 right-4 z-60 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
            aria-label="Close"
          >
            <X className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
          </button>

          {/* Modal Carousel Container */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Arrow */}
            {modalShowLeftArrow && (
              <button
                onClick={() => navigateModal('left')}
                className="absolute left-2 md:left-4 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-gray-800" />
              </button>
            )}

            {/* Carousel Content */}
            <div
              ref={modalCarouselRef}
              className="overflow-x-auto scrollbar-hide w-full h-full"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollBehavior: 'auto', // Disable CSS smooth scroll to use our custom animation
              }}
              onScroll={updateModalArrowVisibility}
            >
              <div className="flex gap-3 md:gap-4 items-center h-full" style={{ 
                paddingLeft: 'calc(50vw - 42.5vw)',
                paddingRight: 'calc(50vw - 42.5vw)',
                minWidth: '100%',
              }}>
                {carouselImages.map((item, index) => {
                  const mediaUrl = getImageUrl(item.image);
                  const isVideo = item.mediaType === 'video' || isVideoEmbedUrl(item.image);
                  const isActive = index === modalIndex;
                  const embedUrl = isVideo && item.image ? convertToEmbedUrl(item.image) : '';
                  
                  return (
                    <div
                      key={item.id}
                      data-index={index}
                      className={`flex-shrink-0 transition-all duration-300 flex items-center justify-center ${
                        isActive 
                          ? 'w-[85vw] max-w-5xl h-[75vh] max-h-[700px]' 
                          : 'w-[120px] h-[80px] md:w-[150px] md:h-[100px] opacity-40'
                      }`}
                    >
                      {mediaUrl ? (
                        isVideo && embedUrl ? (
                          <CustomVideoPlayer
                            src={item.image}
                            title={item.alt || 'Video'}
                            className="w-full h-full rounded-lg"
                            onPlay={() => handleVideoPlay(index)}
                            playerId={index}
                            shouldPause={playingVideoIndex !== null && playingVideoIndex !== index}
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={item.alt}
                            className="w-full h-full object-contain rounded-lg"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg" />
                      )}
                    </div>
                  );
                })}
                {/* Add padding at the end to prevent cutting - equal to half container width for centering */}
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

            {/* Right Arrow */}
            {modalShowRightArrow && (
              <button
                onClick={() => navigateModal('right')}
                className="absolute right-2 md:right-4 z-20 w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-gray-800" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Block 3: Footer / Downloads */}
      {content && (
        <div 
          className="w-full py-4 relative bg-[#D7E1E4]"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4 md:px-6 lg:px-8">
            {/* Left Side: App QR Codes or Website Hyperlink */}
            <div className="flex flex-row gap-2 md:gap-3 items-center -ml-2 md:-ml-4 lg:-ml-6">
              {content.itemType === 'app' ? (
                /* App Mode: Download Badges */
                <>
                  {content.downloadText && (
                    <p className="text-gray-900 text-sm md:text-base font-medium whitespace-nowrap">
                      {content.downloadText}
                    </p>
                  )}
                  {content.appStoreImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(content.appStoreImage)}
                        alt="App Store"
                        className="h-20 md:h-24 object-contain"
                      />
                    </div>
                  )}
                  {content.googlePlayImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(content.googlePlayImage)}
                        alt="Google Play"
                        className="h-20 md:h-24 object-contain"
                      />
                    </div>
                  )}
                  {content.appGalleryImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={getImageUrl(content.appGalleryImage)}
                        alt="App Gallery"
                        className="h-20 md:h-24 object-contain"
                      />
                    </div>
                  )}
                </>
              ) : (
                /* Website Mode: Visit Link */
                <>
                  {content.visitText && (
                    <p className="text-gray-900 text-sm md:text-base font-medium whitespace-nowrap">
                      {content.visitText}
                    </p>
                  )}
                  {content.websiteUrl && (
                    <a
                      href={content.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-900 text-sm md:text-base font-medium underline hover:text-blue-600 transition-colors"
                    >
                      {content.websiteUrl}
                    </a>
                  )}
                </>
              )}
            </div>

            {/* Right Side: Logo (always in same position) */}
            {content.logoImage && (
              <div className="flex-shrink-0 -mr-2 md:-mr-4 lg:-mr-6">
                <img
                  src={getImageUrl(content.logoImage)}
                  alt="Logo"
                  className="h-10 md:h-12 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

