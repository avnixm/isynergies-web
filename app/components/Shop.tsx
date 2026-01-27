'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import Loading from './ui/loading';
import CategoryStrip from './CategoryStrip';

type ShopCategory = {
  id: number;
  name: string;
  text: string;
  image: string;
  displayOrder: number;
};

type ShopContent = {
  id?: number;
  title: string;
  description: string;
  salesIcon: string;
  authorizedDealerImage: string;
};

type AuthorizedDealer = {
  id: number;
  name: string;
  image: string;
  displayOrder: number;
};

export default function Shop() {
  const [content, setContent] = useState<ShopContent>({
    title: 'Shop',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    salesIcon: '',
    authorizedDealerImage: '',
  });
  const [categories, setCategories] = useState<ShopCategory[]>([
    { id: 1, name: 'Laptops', text: 'LAPTOPS', image: '', displayOrder: 0 },
    { id: 2, name: 'Mobiles', text: 'MOBILES', image: '', displayOrder: 1 },
    { id: 3, name: 'Printers', text: 'PRINTERS', image: '', displayOrder: 2 },
    { id: 4, name: 'Hardware', text: 'HARDWARE', image: '', displayOrder: 3 },
  ]);
  const [authorizedDealers, setAuthorizedDealers] = useState<AuthorizedDealer[]>([]);
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
    const fetchShopData = async () => {
      try {
        const [shopResponse, dealersResponse] = await Promise.all([
          fetch('/api/admin/shop'),
          fetch('/api/admin/authorized-dealers'),
        ]);

        if (shopResponse.ok) {
          const data = await shopResponse.json();
          if (data.content) {
            setContent(data.content);
          }
          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            const sortedCategories = data.categories.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
            setCategories(sortedCategories);
          }
        } else {
          console.error('Failed to fetch shop data:', shopResponse.status);
        }

        if (dealersResponse.ok) {
          const dealers = await dealersResponse.json();
          if (Array.isArray(dealers)) {
            setAuthorizedDealers(dealers);
          } else {
            console.error('Invalid dealers response format:', dealers);
          }
        } else {
          const errorData = await dealersResponse.json().catch(() => ({}));
          console.error('Failed to fetch authorized dealers:', dealersResponse.status, errorData);
          // If table doesn't exist, dealers will be empty array, which will show fallback
        }
      } catch (error) {
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, []);

  if (loading) {
    return (
      <section
        id="shop"
        ref={sectionRef}
        className="relative text-white overflow-hidden min-h-[700px] flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #071B6E 0%, #004AB9 100%)'
        }}
      >
        <Loading message="Loading shop content..." />
      </section>
    );
  }

  return (
    <section
      id="shop"
      ref={sectionRef}
      className={`relative text-white overflow-hidden ${
        isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
      }`}
      style={{
        background: 'linear-gradient(180deg, #071B6E 0%, #004AB9 100%)'
      }}
    >
      {/* subtle watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] z-0">
        <div className="absolute right-[-160px] top-[-120px] h-[620px] w-[620px] text-[520px] font-black leading-none text-white/15 select-none">
          iS
        </div>
      </div>

      {/* Responsive container with max-width constraints */}
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 2xl:max-w-7xl">
        {/* Responsive 2-column grid layout */}
        <div 
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-stretch lg:gap-16 xl:gap-20 2xl:gap-24 relative z-10"
          style={{ minHeight: '700px', height: '700px' }}
        >
          {/* Left Panel */}
          <div className="relative flex flex-col -ml-2 md:-ml-2 lg:-ml-4 xl:-ml-16" style={{ height: '100%' }}>
            <div className="py-8 md:py-10 flex flex-col h-full justify-between">
            {/* Top Section: Title and Description */}
            <div className="flex flex-col relative">
              {/* Header with title and button */}
              <div className="flex items-start justify-between gap-6 mb-4">
                <h2 className={`font-sans text-4xl md:text-5xl font-semibold tracking-tight text-white slide-right-content ${
                  isVisible ? 'animate' : 'opacity-0'
                }`}>
                  {content.title}
                </h2>

                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-[#7A0D1A] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:bg-[#8A0E1F] transition-colors"
                  aria-label="Visit Shop"
                >
                  Visit Shop
                  <span aria-hidden className="text-base leading-none">🛒</span>
                </a>
              </div>

              {/* Paragraph description */}
              <p className={`max-w-xl text-xs md:text-sm leading-relaxed text-white/85 font-sans slide-right-content relative z-10 mb-8 md:mb-12 ${
                isVisible ? 'animate' : 'opacity-0'
              }`}
              style={{
                animationDelay: isVisible ? '0.2s' : '0s',
              }}>
                {content.description}
              </p>
              {/* iSgray logo near description */}
              <img
                src="/logos/iSgray.png"
                alt="iSgray"
                className="absolute top-20 right-0 opacity-[0.15] pointer-events-none z-0"
                style={{
                  width: '250px',
                  height: '250px',
                  filter: 'brightness(2) contrast(1.2) invert(0.1)',
                }}
              />
            </div>

            {/* Middle Section: Sales hexagon - centered with even spacing */}
            <div className="flex items-center justify-center flex-1 py-8 relative">
              <div className="relative h-[220px] w-[220px]">
                {content.salesIcon ? (
                  <Image
                    src={typeof content.salesIcon === 'string' && (content.salesIcon.startsWith('/api/images/') || content.salesIcon.startsWith('http') || content.salesIcon.startsWith('/'))
                      ? content.salesIcon 
                      : `/api/images/${content.salesIcon}`}
                    alt="Sales"
                    fill
                    className="object-contain"
                    sizes="180px"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-40 h-40 bg-gray-300 rounded-full opacity-30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                  </div>
                )}
              </div>
              {/* iSgray logo under sales icon */}
              <img
                src="/logos/iSgray.png"
                alt="iSgray"
                className="absolute pointer-events-none"
                style={{
                  width: '500px',
                  height: '500px',
                  filter: 'brightness(2) contrast(1.2) invert(0.1)',
                  bottom: '10px',
                  left: '460px',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>

            {/* Bottom Section: Authorized Dealer strip - matching reference */}
            <div className="w-full pt-0 pb-4 -mt-4">
              <div className="relative w-full">
                {authorizedDealers.length > 0 ? (
                  <div 
                    className="overflow-hidden"
                    style={{
                      background: 'linear-gradient(270deg, rgba(65, 65, 65, 0) 0%, #7A0000 33.17%, #930000 55.29%, #7A0000 75%, rgba(65, 65, 65, 0) 100%)',
                      paddingTop: '6px',
                      paddingRight: '54px',
                      paddingBottom: '6px',
                      paddingLeft: '54px',
                      height: '165px',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box'
                    }}
                  >
                    {/* Logos Grid */}
                    <div className="grid grid-cols-4 items-center justify-items-center" style={{ gap: '4px', flex: '1', overflow: 'hidden' }}>
                      {authorizedDealers.map((dealer) => {
                        const imageUrl = dealer.image.startsWith('/api/images/') || dealer.image.startsWith('http') || dealer.image.startsWith('/')
                          ? dealer.image
                          : `/api/images/${dealer.image}`;
                        // Use object-contain for Huawei logo, object-cover for others
                        const isHuawei = dealer.name.toLowerCase().includes('huawei');
                        const objectFitClass = isHuawei ? 'object-contain' : 'object-cover';
                        return (
                          <div
                            key={dealer.id}
                            className="relative flex items-center justify-center"
                            style={{ 
                              height: '100%', 
                              width: '100%',
                              maxHeight: '120px',
                              overflow: 'hidden'
                            }}
                          >
                            <Image
                              src={imageUrl}
                              alt={dealer.name}
                              fill
                              className={`${objectFitClass} filter brightness-0 invert`}
                              sizes="(max-width: 768px) 25vw, 20vw"
                              unoptimized
                            />
                          </div>
                        );
                      })}
            </div>

                    {/* Label */}
                    <div className="text-center" style={{ marginTop: '12px', marginBottom: '6px', flexShrink: 0 }}>
                      <p 
                        className="text-white uppercase"
                        style={{
                          fontFamily: 'Encode Sans Expanded, sans-serif',
                          fontWeight: 600,
                          fontSize: '10px',
                          lineHeight: '100%',
                          letterSpacing: '0%',
                          paddingTop: '4px',
                          paddingBottom: '4px'
                        }}
                      >
                        AUTHORIZED DEALER
                      </p>
                    </div>
                  </div>
                ) : content.authorizedDealerImage ? (
              <div className="relative h-[140px] w-full">
                  <Image
                    src={typeof content.authorizedDealerImage === 'string' && (content.authorizedDealerImage.startsWith('/api/images/') || content.authorizedDealerImage.startsWith('http') || content.authorizedDealerImage.startsWith('/'))
                      ? content.authorizedDealerImage 
                      : `/api/images/${content.authorizedDealerImage}`}
                    alt="Authorized dealer logos"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 520px, 100vw"
                    priority={false}
                  />
                  </div>
                ) : (
                  <div className="w-full h-[140px] flex items-center justify-center bg-gray-300/20 rounded-lg">
                    <span className="text-white/40 text-sm font-semibold">Authorized Dealer Logos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Right Panel - 4 vertical strips with custom images and text - Full height */}
          <div className="relative flex flex-col" style={{ height: '100%' }}>
            <div className="w-full h-full flex gap-3 md:gap-4 lg:gap-5 2xl:gap-6">
            {categories.length > 0 ? (
              categories.map((c, index) => {
                // 1st and 3rd strips (index 0 and 2) = slide-down, 2nd and 4th (index 1 and 3) = slide-up
                const animationClass = index % 2 === 0 ? 'slide-down-slow' : 'slide-up-slow';
                return (
                  <div
                    key={c.id}
                    className={`${animationClass} ${
                      isVisible ? 'animate' : 'opacity-0'
                    }`}
                    style={{
                      animationDelay: isVisible ? `${0.3 + index * 0.1}s` : '0s',
                    }}
                  >
                <CategoryStrip
                  name={c.name}
                  text={c.text || c.name.toUpperCase()}
                  image={c.image || null}
                />
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50">
                <p>No categories available</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
