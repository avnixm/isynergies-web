'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Loading from './ui/loading';

type WhatWeDoContent = {
  mainText: string;
  tagline: string;
};

type WhatWeDoImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

export default function WhatWeDo() {
  const [content, setContent] = useState<WhatWeDoContent | null>(null);
  const [images, setImages] = useState<WhatWeDoImage[]>([]);
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
        await Promise.all([fetchContent(), fetchImages()]);
      } catch (error) {
        console.error('Error fetching What We Do data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/what-we-do');
      if (response.ok) {
        const data = await response.json();
        setContent({
          mainText: data.mainText || data.main_text || '',
          tagline: data.tagline || '',
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch content:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('Error fetching what we do content:', error);
      throw error;
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/what-we-do/images');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: WhatWeDoImage, b: WhatWeDoImage) => a.displayOrder - b.displayOrder);
        setImages(sortedData);
      } else {
        console.error('Failed to fetch images:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <section
        id="what-we-do"
        ref={sectionRef}
        className="relative bg-[#D7E1E4] py-16"
      >
        <Loading message="Loading What We Do section" />
      </section>
    );
  }

  const getImageUrl = (imageId: string | null): string => {
    if (!imageId) return '';
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
      return imageId;
    }
    return `/api/images/${imageId}`;
  };

  return (
    <section
      id="what-we-do"
      ref={sectionRef}
      className="relative bg-[#D7E1E4]"
    >
      {/* Header Banner */}
      <div
        className={`w-full h-[60px] z-10 flex items-center px-4 md:px-8 lg:px-16 ${
          isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
        }`}
        style={{
          background:
            'linear-gradient(90deg, #030068 0%, #050094 22%, rgba(0, 10, 104, 0) 100%)',
          animationDelay: isVisible ? '0.25s' : '0s',
        }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-white">What we do</h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 relative z-10 pb-16 pt-8">
        {/* Images Carousel */}
        <div
          className={`mb-8 slide-left-bouncy ${isVisible ? 'animate' : ''}`}
          style={{
            animationDelay: isVisible ? '1.5s' : '0s',
          }}
        >
          <div className="what-we-do-carousel-scrollbar">
            <div className="flex overflow-x-auto gap-4 pb-2">
              {images.length > 0 ? (
                images.map((img) => {
                  const imageUrl = getImageUrl(img.image);
                  return (
                    <div
                      key={img.id}
                      className="flex-shrink-0 w-[280px] h-[200px] md:w-[350px] md:h-[250px] overflow-hidden bg-gray-200"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={img.alt}
                          width={350}
                          height={250}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200" />
                      )}
                    </div>
                  );
                })
              ) : (
                // Placeholder if no images
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[280px] h-[200px] md:w-[350px] md:h-[250px] rounded-lg bg-gradient-to-br from-blue-100 to-blue-200"
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Text Section */}
        {content && (
          <div
            className={`md:p-3 space-y-4 text-center ${
              isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
            }`}
            style={{
              animationDelay: isVisible ? '0.8s' : '0s',
            }}
          >
            <div
              className="text-gray-900 text-xs leading-relaxed font-normal max-w-4xl mx-auto"
              dangerouslySetInnerHTML={{ __html: content.mainText }}
            />
            <p className="text-gray-900 text-xs leading-relaxed font-normal mt-4" dangerouslySetInnerHTML={{ __html: content.tagline }} />
          </div>
        )}
      </div>
    </section>
  );
}

