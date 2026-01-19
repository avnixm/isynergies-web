'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
          'w-[140px] h-[140px]',
          'md:w-[170px] md:h-[170px]',
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
            sizes="(min-width: 768px) 170px, 140px"
            priority={false}
            unoptimized
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
        // Fetch statistics
        const statsResponse = await fetch('/api/admin/statistics');
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStatistics(data);
        } else {
          // Fallback to default data
          setStatistics([
            { id: 1, label: 'Clients', value: '30+', displayOrder: 0 },
            { id: 2, label: 'Customers', value: '5000+', displayOrder: 1 },
            { id: 3, label: 'Projects', value: '100+', displayOrder: 2 },
            { id: 4, label: 'Dedicated Staff', value: '16', displayOrder: 3 },
          ]);
        }

        // Fetch ticker items
        const tickerResponse = await fetch('/api/admin/ticker');
        if (tickerResponse.ok) {
          const data = await tickerResponse.json();
          setTickerItems(data);
        } else {
          // Fallback to default ticker items
          setTickerItems([
            { id: 1, text: 'SOFTWARE DEVELOPMENT', displayOrder: 0 },
            { id: 2, text: 'UI/UX DESIGN', displayOrder: 1 },
            { id: 3, text: 'SOFTWARE INSTALLATION', displayOrder: 2 },
            { id: 4, text: 'HARDWARE REPAIRS', displayOrder: 3 },
            { id: 5, text: 'CCTV INSTALLATION', displayOrder: 4 },
            { id: 6, text: 'GADGETS', displayOrder: 5 },
            { id: 7, text: 'PRINTERS', displayOrder: 6 },
            { id: 8, text: 'LAPTOP', displayOrder: 7 },
          ]);
        }

        // Fetch service icons from services API
        const servicesResponse = await fetch('/api/admin/services');
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          // Sort by displayOrder and take first 4
          const sortedServices = servicesData.sort((a: any, b: any) => a.displayOrder - b.displayOrder).slice(0, 4);
          setServiceIcons({
            icon1: sortedServices[0]?.icon || null,
            icon2: sortedServices[1]?.icon || null,
            icon3: sortedServices[2]?.icon || null,
            icon4: sortedServices[3]?.icon || null,
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
    <section id="services" ref={sectionRef} className="relative bg-[#0D1E66] text-white">
      <div className="relative min-h-screen overflow-hidden">
        {/* subtle hex background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 6 L101 30 L101 90 L60 114 L19 90 L19 30 Z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E\")",
            backgroundSize: '120px 120px',
          }}
        />

        {/* Layout wrapper (fits in one desktop viewport) */}
        <div className="container mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-4 py-10 md:px-8 md:py-10 lg:px-16">
          {/* Top area: left copy + right hex cluster */}
          <div className="grid w-full items-center gap-10 md:grid-cols-2">
            {/* Left copy */}
            <div className={`space-y-2 pr-4 md:pr-8 font-sans -mt-[50px] slide-right-content ${
              isVisible ? 'animate' : 'opacity-0'
            }`}>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Our Services
              </h2>

              <p className="text-xs leading-relaxed font-normal text-white/85 max-w-xl">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed
                consequat quam. Sed vel lorem finibus enim consectetur eleifend sit
                amet vel neque.
              </p>

              <ul className="mt-5 space-y-3 text-sm md:text-base font-semibold text-white">
                {['Development', 'Support', 'Analysis & Design', 'Sales'].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-3">
                      <span className="text-[18px] leading-none text-white/90">
                        •
                      </span>
                      <span>{t}</span>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Right hex cluster */}
            <div className="flex justify-center md:justify-end">
              <div className="w-full max-w-[760px]">
                <div className="grid grid-cols-3 grid-rows-2 place-items-center gap-x-[80px] md:gap-x-[88px] gap-y-8">
                  {/* top row */}
                  <div className={`col-start-2 row-start-1 slide-down-slow ${
                    isVisible ? 'animate' : 'opacity-0'
                  }`}>
                    <HexImage
                      src={serviceIcons.icon1}
                      alt="Sales"
                      className=""
                      emphasized
                    />
                  </div>
                  <div className={`col-start-3 row-start-1 slide-down-slow ${
                    isVisible ? 'animate' : 'opacity-0'
                  }`}
                  style={{ animationDelay: isVisible ? '0.2s' : '0s' }}>
                    <HexImage
                      src={serviceIcons.icon2}
                      alt="Analysis & Design"
                      className=""
                    />
                  </div>

                  {/* bottom row (offset upward for honeycomb) */}
                  <div className={`col-start-1 row-start-2 -mt-6 md:-mt-[170px] translate-x-[82px] md:translate-x-[100px] slide-up-slow ${
                    isVisible ? 'animate' : 'opacity-0'
                  }`}>
                    <HexImage
                      src={serviceIcons.icon3}
                      alt="Development"
                      className=""
                    />
                  </div>
                  <div className={`col-start-2 row-start-2 -mt-6 md:-mt-[165px] translate-x-[82px] md:translate-x-[100px] slide-up-slow ${
                    isVisible ? 'animate' : 'opacity-0'
                  }`}
                  style={{ animationDelay: isVisible ? '0.2s' : '0s' }}>
                    <HexImage
                      src={serviceIcons.icon4}
                      alt="Support"
                      className=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Red Scrolling Ticker Bar */}
          <div
            className="relative left-1/2 w-screen -translate-x-1/2 services-ticker-bg py-2.5 md:py-3"
            style={{
              background: 'linear-gradient(90deg, #680000 0%, #A00000 52%, #680000 100%)',
            }}
          >
            <div className="ticker-container ticker-fade">
              <div className="ticker-content">
                {/* One loop */}
                <div className="ticker-row">
                  {tickerItems.map((item) => (
                    <span key={`ticker-1-${item.id}`}>
                      <span className="ticker-item">{item.text}</span>
                      <span className="ticker-star">*</span>
                    </span>
                  ))}
                </div>

                {/* Duplicate loop for seamless scroll */}
                <div className="ticker-row" aria-hidden>
                  {tickerItems.map((item) => (
                    <span key={`ticker-2-${item.id}`}>
                      <span className="ticker-item">{item.text}</span>
                      <span className="ticker-star">*</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* By the Numbers (kept compact so it stays visible) */}
          <div className={`pt-8 md:pt-8 slide-up-content ${
            isVisible ? 'animate' : 'opacity-0'
          }`}>
            <div className="text-center font-sans">
              <h3 className="text-2xl md:text-3xl font-bold">
                By the Numbers
              </h3>

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4 md:gap-x-12 md:gap-y-10">
                {loading ? (
                  <div className="col-span-2 md:col-span-4">
                    <Loading message="Loading statistics" size="md" className="text-white" />
                  </div>
                ) : (
                  statistics.map((stat) => (
                    <div key={stat.id}>
                      <div className="text-4xl md:text-5xl font-bold">{stat.value}</div>
                      <div className="mt-1 text-sm md:text-base font-semibold">
                        {stat.label}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
