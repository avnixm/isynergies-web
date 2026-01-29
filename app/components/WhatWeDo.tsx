'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Encode_Sans_Expanded } from 'next/font/google';
import Loading from './ui/loading';

const encodeSansExpanded = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

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
        aria-label="What We Do"
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
      aria-label="What We Do"
      className="relative bg-[#D7E1E4] overflow-visible"
    >
      {/* Blue gradient bar header (moved from About Us so sections never overlap) */}
      <div
        className={`w-full h-[60px] z-10 flex items-center justify-start px-4 md:px-8 lg:px-16 dropdown-smooth ${
          isVisible ? 'animate' : ''
        }`}
        style={{
          background:
            'linear-gradient(to right, #030068 0%, #050094 22%, rgba(0, 10, 104, 0) 100%)',
          animationDelay: isVisible ? '0.3s' : '0s',
        }}
      >
        <p className="text-2xl md:text-3xl font-semibold text-white">What We Do</p>
      </div>

      {/* Gray background carousel section - edge to edge */}
      {images.length > 0 && (
        <div 
          className="bg-[#D7E1E4] pt-2.5 pb-1.5  projects-marquee relative left-1/2 w-screen -translate-x-1/2"
          style={{
            ['--marquee-duration' as any]: '40s',
          }}
        >
          <div className={`projects-marquee-row ${isVisible ? 'animate' : 'opacity-0'}`}
            style={{
              animationDelay: isVisible ? '0.3s' : '0s',
            }}
          >
            <div className="projects-marquee-track" style={{ gap: '6px' }}>
              {[...images, ...images].map((img, index) => {
                const imageUrl = getImageUrl(img.image);
                return (
                  <div
                    key={img.id + '-' + index}
                    className="flex-shrink-0 w-[360px] h-[200px] md:w-[480px] md:h-[250px] overflow-hidden "
                  >
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={img.alt}
                        width={480}
                        height={250}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Text Section */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 py-5" style={{
        background: 'linear-gradient(180deg, #071B6E 0%, #004AB9 100%)',
      }}>
        <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-16 relative z-10">
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
                className="text-white/85 max-w-6xl mx-auto text-xs md:text-sm leading-relaxed font-sans text-center"
                dangerouslySetInnerHTML={{ __html: content.mainText }}
              />
              <p 
                className="text-white/85 mt-4 max-w-6xl mx-auto text-xs md:text-sm leading-relaxed font-sans text-center"
                dangerouslySetInnerHTML={{ __html: content.tagline }} 
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

