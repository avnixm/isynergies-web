'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Loading from './ui/loading';

type AboutUsContent = {
  title: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  paragraph4: string;
  paragraph5: string;
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
};

type AboutUsGalleryImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

export default function AboutUs() {
  const [content, setContent] = useState<AboutUsContent | null>(null);
  const [galleryImages, setGalleryImages] = useState<AboutUsGalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isBoardSectionVisible, setIsBoardSectionVisible] = useState(false);

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
    fetchContent();
    fetchGalleryImages();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/about-us');
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching about us content:', error);
      
      setContent({
        title: 'About Us',
        paragraph1: 'Isynergies, Inc was established and officially registered with the Securities and Exchange Commission (SEC) on October 30, 2012 as Stock Corporation inline in Other Software and Consultancy and Supply industry.',
        paragraph2: 'The office is based in ASKI Building 105 Maharlika Highway, Cabanatuan City, Nueva Ecija.',
        paragraph3: 'iSynergies, Inc. is a strategic business unit of ASKI Group of Companies, Inc. responsible for providing hardware and software solutions. It also offers products and services to the public and is composed of the Marketing and Sales Unit, Software Development and Quality Assurance Unit, and System Technical and Network Administration Unit.',
        paragraph4: 'The Software Development unit creates web, mobile, and computer applications that help companies digitize manual processes and improve transaction speed and efficiency. The System Technical unit ensures network and hardware security through proper licensing, configurations, server maintenance, and the installation of security systems such as digital locks, biometrics, and CCTV. The Marketing and Sales unit provides essential hardware and software products, including computers, printers, software licenses, and mobile phones to support daily business operations.',
        paragraph5: 'Our team helps your IT to the next level. We make your IT plans possible.',
        missionTitle: 'Our Mission',
        missionText: 'To provide Information Technology Solutions to clientele rendered by skilled and competent workforce.',
        visionTitle: 'Our Vision',
        visionText: 'A Trusted Partner of Every Businesses in Software and Hardware Technological Transformation.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch('/api/admin/about-us/gallery-images');
      if (!response.ok) return;
      const data = await response.json();
      setGalleryImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching about us gallery images:', error);
    }
  };

  if (loading) {
    return (
      <section
        ref={sectionRef}
        id="about"
        aria-label="About Us"
        className="relative min-h-[50vh] sm:min-h-[70vh] md:min-h-screen pb-5 flex items-center justify-center"
        style={{ backgroundColor: '#D7E1E4' }}
      >
        <Loading message="Loading About Us content" size="lg" />
      </section>
    );
  }

  if (!content) return null;

  const getImageSrc = (value: string | null | undefined, fallback?: string) => {
    if (value && value.toString().trim() !== '') {
      const v = value.toString();
      if (v.startsWith('/api/images/') || v.startsWith('http') || v.startsWith('/')) return v;
      return `/api/images/${v}`;
    }
    if (fallback && fallback.toString().trim() !== '') {
      const v = fallback.toString();
      if (v.startsWith('/api/images/') || v.startsWith('http') || v.startsWith('/')) return v;
      return `/api/images/${v}`;
    }
    return '';
  };

  // Get gallery images from database, sorted by display order
  const baseGallery = galleryImages.length
    ? [...galleryImages]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((g) => ({
        key: `db-${g.id}`,
        src: getImageSrc(g.image),
        alt: g.alt || 'About Us gallery image',
      }))
    : [];

  const orderedGallery = [...baseGallery];
  const tiledGallery = [...orderedGallery, ...orderedGallery];
  const tileHeight = orderedGallery.length > 0 ? `${100 / orderedGallery.length}%` : '0%';
  const scrollSeconds = Math.max(20, baseGallery.length * 6);

  return (
      <section
        ref={sectionRef}
        id="about"
        aria-label="About Us"
        className="relative"
        style={{ backgroundColor: '#D7E1E4' }}
      >
        {}
        <div 
          className="absolute top-32 left-0 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:top-60 md:w-[400px] md:h-[400px] -translate-x-1/2 -translate-y-1/2 z-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.3) 20%, rgba(220, 38, 38, 0.2) 40%, rgba(220, 38, 38, 0.15) 50%, rgba(220, 38, 38, 0.1) 60%, rgba(220, 38, 38, 0.05) 75%, transparent 100%)',
            filter: 'blur(40px)',
            WebkitFilter: 'blur(40px)',
          }}
        />
        {}
        <div className="container mx-auto max-w-7xl px-3 sm:px-4 md:px-8 lg:px-16 relative z-10 py-6 sm:py-8 md:py-0">
          <div className="flex flex-col md:flex-row gap-0.5 md:gap-6 items-stretch min-h-0 md:min-h-[600px]">
            {}
            <div className="md:w-1/2 md:pr-8 md:order-1 relative z-10 font-sans flex flex-col justify-center order-1 pl-4 pr-4 sm:pl-5 sm:pr-5 md:pl-0 pt-8 pb-3 md:py-0">
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-5 sm:mb-6 md:mb-8">{content.title}</h2>
                
                <div className={`slide-right-content space-y-2 md:space-y-3 text-gray-900 text-[11px] sm:text-xs leading-relaxed font-normal ${isVisible ? 'animate' : ''}`}>
                  {content.paragraph1 && <p dangerouslySetInnerHTML={{ __html: content.paragraph1 }} />}
                  {content.paragraph2 && <p dangerouslySetInnerHTML={{ __html: content.paragraph2 }} />}
                  {content.paragraph3 && <p dangerouslySetInnerHTML={{ __html: content.paragraph3 }} />}
                  {content.paragraph4 && <p dangerouslySetInnerHTML={{ __html: content.paragraph4 }} />}
                  {content.paragraph5 && <p dangerouslySetInnerHTML={{ __html: content.paragraph5 }} />}
                </div>

                {}
                <div className={`slide-up-content grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4 md:mt-6 ${isVisible ? 'animate' : ''}`}>
                  <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-200">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1.5 md:mb-2">{content.missionTitle}</h3>
                    <p className="text-gray-900 text-[10px] leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: content.missionText }} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 md:p-5 border border-gray-200">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1.5 md:mb-2">{content.visionTitle}</h3>
                    <p className="text-gray-900 text-[10px] leading-relaxed font-normal" dangerouslySetInnerHTML={{ __html: content.visionText }} />
                  </div>
                </div>
              </div>
            </div>

            {}
            {baseGallery.length > 0 && (
            <div className="md:w-1/2 md:order-2 order-2 w-full pl-4 pr-4 sm:pl-5 sm:pr-5 md:pl-0 md:pr-0 -mt-0">
              <div className={`slide-up-container relative h-[260px] sm:h-[320px] md:h-[600px] w-full overflow-hidden rounded-xl md:rounded-none md:shadow-lg ${isVisible ? 'animate' : ''}`}>
                <div
                  className="scroll-animation absolute top-0 left-0 w-full flex flex-col"
                  style={{ height: '200%', animationDuration: `${scrollSeconds}s` }}
                >
                  {tiledGallery.map((item, idx) => (
                    <div
                      key={`${item.key}-${idx}`}
                      className="w-full"
                      style={{ height: tileHeight }}
                    >
                      {item.src ? (
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={600}
                          height={600}
                          className="w-full h-full object-cover"
                          unoptimized
                          sizes="(min-width: 768px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300/40" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </section>
  );
}
