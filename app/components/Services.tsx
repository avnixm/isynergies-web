'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import NumberFlow from '@number-flow/react';
import Loading from './ui/loading';

type HexImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  emphasized?: boolean;
};

function HexImage({ src, alt, className, emphasized }: HexImageProps) {
  const getImageUrl = (imageId: string | null): string | null => {
    if (!imageId) return null;
    
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
      return imageId;
    }
    
    return `/api/images/${imageId}`;
  };

  const imageUrl = getImageUrl(src);

  return (
    <div className={['group relative', className ?? ''].join(' ')}>
      <div
        className={[
          'relative',
          'w-[88px] h-[88px] sm:w-[116px] sm:h-[116px] md:w-[180px] md:h-[180px]',
          'transition-transform duration-300 ease-in-out',
          'group-hover:scale-[1.03]',
          emphasized ? '' : '',
        ].join(' ')}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)] transition-[filter] duration-300 ease-in-out group-hover:drop-shadow-[0_14px_24px_rgba(0,0,0,0.22)]"
            sizes="(min-width: 768px) 180px, (min-width: 640px) 116px, 88px"
            priority={false}
            unoptimized
            onError={(e) => {
              console.error(`Failed to load image: ${imageUrl}`, e);
            }}
            onLoad={() => {
              console.log(`Successfully loaded image: ${imageUrl}`);
            }}
          />
        ) : (
          <>
            {/* Muted foreground container if no image */}
            <div className="absolute inset-0 rounded-[32px] bg-white/10 border border-white/20 shadow-[0_10px_18px_rgba(0,0,0,0.25)]" />
            <div className="absolute inset-[18%] rounded-[28px] bg-white/5" />
            <div className="absolute inset-[34%] rounded-[22px] bg-white/10" />
          </>
        )}
      </div>
    </div>
  );
}

type Statistic = {
  id: number;
  label: string;
  value: string;
  displayOrder: number;
};

type TickerItem = {
  id: number;
  text: string;
  displayOrder: number;
};

type ServicesListItem = {
  id: number;
  label: string;
  displayOrder: number;
};

type AnimatedCounterProps = {
  value: string;
  isVisible: boolean;
};

function AnimatedCounter({ value, isVisible }: AnimatedCounterProps) {
  // Extract numeric part and suffix (e.g. "5000+" -> 5000 and "+")
  const match = value.match(/([\d,.]+)/);
  const suffix = match ? value.slice(match[1].length) : '';
  const targetNumber = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Ramp value from 0 to target over time so NumberFlow animates every digit
  useEffect(() => {
    if (!isVisible || !match || hasStarted || !targetNumber) return;
    setHasStarted(true);
    const duration = 2800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const current = Math.round(targetNumber * eased);
      setDisplayValue(current);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isVisible, hasStarted, targetNumber]);

  if (!match) {
    return <span>{value}</span>;
  }

  return (
    <NumberFlow
      value={displayValue}
      suffix={suffix}
      transformTiming={{ duration: 400, easing: 'ease-out' }}
      spinTiming={{ duration: 400, easing: 'ease-out' }}
    />
  );
}

export default function Services() {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [serviceIcons, setServiceIcons] = useState<{
    icon1: string | null;
    icon2: string | null;
    icon3: string | null;
    icon4: string | null;
  }>({
    icon1: null,
    icon2: null,
    icon3: null,
    icon4: null,
  });
  const [servicesListItems, setServicesListItems] = useState<ServicesListItem[]>([]);
  const [servicesSection, setServicesSection] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  });
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
        
        const statsResponse = await fetch('/api/admin/statistics');
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStatistics(data);
        } else {
          setStatistics([]);
        }

        const tickerResponse = await fetch('/api/admin/ticker');
        if (tickerResponse.ok) {
          const data = await tickerResponse.json();
          setTickerItems(data);
        } else {
          setTickerItems([]);
        }

        
        const servicesResponse = await fetch('/api/admin/services');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          
          const sortedServices = servicesData.sort((a: any, b: any) => a.displayOrder - b.displayOrder).slice(0, 4);
          setServiceIcons({
            icon1: sortedServices[0]?.icon || null,
            icon2: sortedServices[1]?.icon || null,
            icon3: sortedServices[2]?.icon || null,
            icon4: sortedServices[3]?.icon || null,
          });
        } else {
          console.error('Failed to fetch services:', servicesResponse.status, servicesResponse.statusText);
        }

        const listResponse = await fetch('/api/admin/services-list');
        if (listResponse.ok) {
          const listData = await listResponse.json();
          const sorted = (Array.isArray(listData) ? listData : []).sort((a: ServicesListItem, b: ServicesListItem) => a.displayOrder - b.displayOrder);
          setServicesListItems(sorted);
        } else {
          setServicesListItems([]);
        }

        const sectionResponse = await fetch('/api/admin/services-section');
        if (sectionResponse.ok) {
          const sectionData = await sectionResponse.json();
          setServicesSection({
            title: sectionData.title ?? '',
            description: sectionData.description ?? '',
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <section id="services" ref={sectionRef} aria-label="Our Services" className="relative text-white overflow-visible">
      <div className="relative overflow-visible" style={{
        background: 'linear-gradient(180deg, #07186E 0%, #004AB9 50%, #07186E 100%)',
      }}>
        {}
        <div className="container mx-auto flex max-w-7xl flex-col px-3 pt-6 pb-6 sm:px-4 sm:pt-8 sm:pb-8 md:px-6 md:pt-10 md:pb-8 lg:px-12">
          {}
          <div className="grid w-full items-start gap-5 md:items-center md:grid-cols-2 md:gap-3">
            {}
            <div className={`order-1 pl-4 pr-4 sm:pl-5 sm:pr-2 md:pl-0 md:pr-6 font-sans ml-0 sm:ml-2 md:ml-12 mt-0 md:-mt-10 slide-right-content ${
              isVisible ? 'animate' : 'opacity-0'
            }`}>
              <h2 
                className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-3 md:mb-6"
                dangerouslySetInnerHTML={{ __html: servicesSection.title }}
              />

              <p 
                className="text-xs leading-relaxed font-light text-white/85 max-w-xl mb-3 md:mb-6"
                dangerouslySetInnerHTML={{ __html: servicesSection.description }}
              />

              <ul className="space-y-2 sm:space-y-3 text-sm md:text-base font-semibold text-white">
                {servicesListItems.map((item) => {
                  const label = typeof item === 'string' ? item : item.label;
                  const key = typeof item === 'string' ? item : `list-${item.id}`;
                  return (
                    <li key={key} className="flex items-center gap-2">
                      <span className="text-base sm:text-[18px] leading-none text-white/90 shrink-0">
                        •
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: label }} />
                    </li>
                  );
                })}
              </ul>
            </div>

            {}
            <div className="order-2 flex justify-center md:justify-end overflow-hidden">
              {}
              <div className="md:hidden w-full max-w-[260px] sm:max-w-[300px]">
                <div className="grid grid-cols-2 grid-rows-2 place-items-center gap-4 sm:gap-5">
                  <div className={`slide-down-slow ${isVisible ? 'animate' : 'opacity-0'}`}>
                    <HexImage src={serviceIcons.icon1} alt="Sales" className="" emphasized />
                  </div>
                  <div className={`slide-down-slow ${isVisible ? 'animate' : 'opacity-0'}`} style={{ animationDelay: isVisible ? '0.15s' : '0s' }}>
                    <HexImage src={serviceIcons.icon2} alt="Analysis & Design" className="" />
                  </div>
                  <div className={`slide-up-slow ${isVisible ? 'animate' : 'opacity-0'}`}>
                    <HexImage src={serviceIcons.icon3} alt="Development" className="" />
                  </div>
                  <div className={`slide-up-slow ${isVisible ? 'animate' : 'opacity-0'}`} style={{ animationDelay: isVisible ? '0.15s' : '0s' }}>
                    <HexImage src={serviceIcons.icon4} alt="Support" className="" />
                  </div>
                </div>
              </div>
              {/* Desktop: honeycomb layout */}
              <div className="hidden md:block w-full max-w-[760px]">
                <div className="grid grid-cols-3 grid-rows-2 place-items-center gap-x-[70px] gap-y-0 mt-8">
                  <div className={`col-start-2 row-start-1 slide-down-slow ${isVisible ? 'animate' : 'opacity-0'}`}>
                    <HexImage src={serviceIcons.icon1} alt="Sales" className="" emphasized />
                  </div>
                  <div className={`col-start-3 row-start-1 slide-down-slow ${isVisible ? 'animate' : 'opacity-0'}`} style={{ animationDelay: isVisible ? '0.2s' : '0s' }}>
                    <HexImage src={serviceIcons.icon2} alt="Analysis & Design" className="" />
                  </div>
                  <div className={`col-start-1 row-start-2 -mt-[100px] translate-x-[110px] slide-up-slow ${isVisible ? 'animate' : 'opacity-0'}`}>
                    <HexImage src={serviceIcons.icon3} alt="Development" className="" />
                  </div>
                  <div className={`col-start-2 row-start-2 -mt-[100px] translate-x-[105px] slide-up-slow ${isVisible ? 'animate' : 'opacity-0'}`} style={{ animationDelay: isVisible ? '0.2s' : '0s' }}>
                    <HexImage src={serviceIcons.icon4} alt="Support" className="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Red Scrolling Ticker Bar - Separator */}
      <div
        className="relative left-1/2 w-screen -translate-x-1/2 services-ticker-bg services-ticker-strip py-2.5 sm:py-3 md:py-3 flex items-center min-h-[2.5rem] sm:min-h-[2.75rem]"
        style={{
          background: 'linear-gradient(90deg, #680000 0%, #A00000 50%, #680000 100%)',
        }}
      >
        <div className="ticker-container ticker-fade w-full">
          <div className="ticker-content">
            {}
            <div className="ticker-row">
              {tickerItems.map((item) => (
                <span key={`ticker-1-${item.id}`}>
                  <span className="ticker-item" dangerouslySetInnerHTML={{ __html: item.text }} />
                  <span className="ticker-star">•</span>
                </span>
              ))}
            </div>

            {}
            <div className="ticker-row" aria-hidden>
              {tickerItems.map((item) => (
                <span key={`ticker-2-${item.id}`}>
                  <span className="ticker-item" dangerouslySetInnerHTML={{ __html: item.text }} />
                  <span className="ticker-star">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#D7E1E4] pt-4 pb-4 sm:pt-5 sm:pb-5 md:pt-6 md:pb-6 overflow-visible">
        <div className={`container mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-12 slide-up-content relative z-10 ${
          isVisible ? 'animate' : 'opacity-0'
        }`}>
          <div className="text-center font-sans">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-gray-900">
              By the Numbers
            </h3>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:gap-x-6 sm:gap-y-4 md:grid-cols-4 md:gap-x-8 md:gap-y-6 relative">
              {loading ? (
                <div className="col-span-2 md:col-span-4">
                  <Loading message="Loading statistics" size="md" className="text-gray-900" />
                </div>
              ) : (
                statistics.map((stat) => (
                  <div key={stat.id} className="min-w-0 relative z-10">
                    <div 
                      className="font-sans text-center tabular-nums text-gray-900"
                      style={{
                        fontFamily: 'Encode Sans Expanded',
                        fontWeight: 600,
                        fontSize: 'clamp(2rem, 8vw, 4rem)',
                        lineHeight: '100%',
                        letterSpacing: '0%',
                        color: '#111827',
                      }}
                    >
                      <AnimatedCounter value={stat.value} isVisible={isVisible} />
                    </div>
                    <div 
                      className="mt-1 text-xs sm:text-sm md:text-base font-semibold text-gray-900" 
                      style={{ color: '#111827' }}
                      dangerouslySetInnerHTML={{ __html: stat.label }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {}
      {}
    </section>
  );
}
