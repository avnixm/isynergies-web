'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Loading from './ui/loading';
import { Star } from 'lucide-react';

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
  bannerHeight: string;
};

type FeaturedAppCarouselImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

type FeaturedAppFeature = {
  id: number;
  iconImage: string;
  label: string;
  displayOrder: number;
};

export default function FeaturedApp() {
  const [content, setContent] = useState<FeaturedAppContent | null>(null);
  const [carouselImages, setCarouselImages] = useState<FeaturedAppCarouselImage[]>([]);
  const [features, setFeatures] = useState<FeaturedAppFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      try {
        await Promise.all([fetchContent(), fetchCarouselImages(), fetchFeatures()]);
      } catch (error) {
        console.error('Error fetching Featured App data:', error);
      } finally {
        setLoading(false);
      }
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
          bannerHeight: data.bannerHeight || data.banner_height || 'h-48',
        });
      } else {
        console.error('Failed to fetch content:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching featured app content:', error);
      throw error;
    }
  };

  const fetchCarouselImages = async () => {
    try {
      const response = await fetch('/api/admin/featured-app/carousel');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: FeaturedAppCarouselImage, b: FeaturedAppCarouselImage) => a.displayOrder - b.displayOrder);
        setCarouselImages(sortedData);
      } else {
        console.error('Failed to fetch carousel images:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching carousel images:', error);
      throw error;
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
        console.error('Failed to fetch features:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
      throw error;
    }
  };

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
          className={`w-full ${content.bannerHeight || 'h-64'} relative overflow-hidden`}
          style={{
            background: `linear-gradient(${getGradientDirection(content.gradientDirection || 'to-r')}, ${content.gradientFrom || '#2563eb'}, ${content.gradientTo || '#1e40af'})`,
          }}
        >
          {/* Featured Badge - Top Right */}
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

          {/* App Logo - Left Side (Vertically Centered) */}
          {content.appLogo && (
            <div 
              className={`absolute left-8 top-1/2 -translate-y-1/2 z-10 ${
                isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
              }`}
              style={{
                animationDelay: isVisible ? '0.3s' : '0s',
              }}
            >
              <img
                src={getImageUrl(content.appLogo)}
                alt="App Logo"
                 className="w-auto object-contain"
                  style={{
                    height: '220px',
                    maxHeight: '220px',
                  }}
              />
            </div>
          )}

          {/* Feature Icons - Bottom Right */}
          {features.length > 0 && (
            <div 
              className={`absolute bottom-[-5px] right-18 z-10 hidden md:flex items-center gap-6 max-w-md justify-end ${
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
                        className="h-24 w-24 object-contain"
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

      {/* Block 2: Horizontal Carousel */}
      {carouselImages.length > 0 && (
        <div className="w-full py-4">
          <div 
            className={`flex overflow-x-auto gap-4 scrollbar-hide slide-left-row ${
              isVisible ? 'animate' : 'opacity-0'
            }`} 
            style={{ 
              paddingLeft: '10px',
              animationDelay: isVisible ? '0.3s' : '0s',
            }}
          >
            {carouselImages.map((img, index) => {
              const imageUrl = getImageUrl(img.image);
              const isFirst = index === 0;
              return (
                <div
                  key={img.id}
                  className={`flex-shrink-0 overflow-hidden bg-gray-200 rounded-lg ${
                    isFirst 
                      ? 'w-[400px] h-[180px] md:w-[550px] md:h-[220px]' 
                      : 'w-[250px] h-[180px] md:w-[350px] md:h-[220px]'
                  }`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={img.alt}
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
      )}

      {/* Block 3: Footer / Downloads */}
      {content && (
        <div 
          className="w-full py-4 relative"
          style={{
            backgroundColor: content.gradientTo || '#1e40af',
          }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-4 md:px-6 lg:px-8">
            {/* Left Side: App QR Codes or Website Hyperlink */}
            <div className="flex flex-row gap-2 md:gap-3 items-center -ml-2 md:-ml-4 lg:-ml-6">
              {content.itemType === 'app' ? (
                /* App Mode: Download Badges */
                <>
                  {content.downloadText && (
                    <p className="text-white text-sm md:text-base font-medium whitespace-nowrap">
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
                    <p className="text-white text-sm md:text-base font-medium whitespace-nowrap">
                      {content.visitText}
                    </p>
                  )}
                  {content.websiteUrl && (
                    <a
                      href={content.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-sm md:text-base font-medium underline hover:text-blue-200 transition-colors"
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

