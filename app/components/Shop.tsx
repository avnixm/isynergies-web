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
  shopUrl?: string;
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
        aria-label="Shop"
        className="relative text-white overflow-hidden min-h-[50vh] sm:min-h-[600px] md:min-h-[700px] flex items-center justify-center"
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
      aria-label="Shop"
      className={`relative text-white overflow-hidden ${
        isVisible ? 'animate-fadeIn-slow' : 'opacity-0'
      }`}
      style={{
        background: 'linear-gradient(180deg, #071B6E 0%, #004AB9 100%)'
      }}
    >
      {}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] z-0">
        <div className="absolute right-[-80px] top-[-60px] h-[320px] w-[320px] text-[260px] font-black leading-none text-white/15 select-none sm:right-[-120px] sm:top-[-90px] sm:h-[480px] sm:w-[480px] sm:text-[400px] md:right-[-160px] md:top-[-120px] md:h-[620px] md:w-[620px] md:text-[520px]">
          iS
        </div>
      </div>

      {}
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-8 2xl:max-w-7xl">
        {}
        <div 
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] 2xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-stretch gap-6 sm:gap-8 lg:gap-16 xl:gap-20 2xl:gap-24 relative z-10 min-h-0 lg:min-h-[700px] py-6 sm:py-8 md:py-10 lg:py-0 lg:h-[700px]"
        >
          {}
          <div className="relative flex flex-col min-h-0 lg:h-full pl-2 sm:pl-4 md:pl-0 lg:-ml-4 xl:-ml-16">
            <div className="flex flex-col flex-1 min-h-0 py-0 lg:py-10 lg:justify-between lg:h-full">
            {}
            <div className="flex flex-col relative">
              {}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-3 sm:mb-4">
                <h2 className={`font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white slide-right-content ${
                  isVisible ? 'animate' : 'opacity-0'
                }`} style={{ fontWeight: 600 }}>
                  {content.title}
                </h2>

                <a
                  href={content.shopUrl || '#'}
                  target={content.shopUrl?.startsWith('http') ? '_blank' : undefined}
                  rel={content.shopUrl?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#7A0D1A] px-4 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:bg-[#8A0E1F] transition-colors w-fit sm:w-auto touch-manipulation"
                  aria-label="Visit Shop"
                >
                  Visit Shop
                  <span aria-hidden className="text-base leading-none">🛒</span>
                </a>
              </div>

              {}
              <p className={`max-w-xl text-xs md:text-sm leading-relaxed text-white/85 font-sans slide-right-content relative z-10 mb-6 sm:mb-8 md:mb-12 ${
                isVisible ? 'animate' : 'opacity-0'
              }`}
              style={{
                animationDelay: isVisible ? '0.2s' : '0s',
              }}>
                {content.description}
              </p>
              {}
              <img
                src="/logos/iSgray.png"
                alt=""
                aria-hidden
                className="absolute top-20 right-0 opacity-[0.15] pointer-events-none z-0 hidden md:block w-[180px] h-[180px] lg:w-[250px] lg:h-[250px]"
                style={{
                  filter: 'brightness(2) contrast(1.2) invert(0.1)',
                }}
              />
            </div>

            {/* Middle Section: Sales hexagon */}
            <div className="flex items-center justify-center flex-1 relative my-4 sm:my-6 lg:-mt-16 lg:my-0">
              <div className="relative h-[140px] w-[140px] sm:h-[180px] sm:w-[180px] lg:h-[220px] lg:w-[220px] shrink-0">
                {content.salesIcon ? (
                  <Image
                    src={typeof content.salesIcon === 'string' && (content.salesIcon.startsWith('/api/images/') || content.salesIcon.startsWith('http') || content.salesIcon.startsWith('/'))
                      ? content.salesIcon 
                      : `/api/images/${content.salesIcon}`}
                    alt="Sales"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 220px, (min-width: 640px) 180px, 140px"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-[70%] h-[70%] bg-gray-300 rounded-full opacity-30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                  </div>
                )}
              </div>
              {}
              <img
                src="/logos/iSgray.png"
                alt=""
                aria-hidden
                className="absolute pointer-events-none hidden xl:block w-[400px] h-[400px] 2xl:w-[500px] 2xl:h-[500px]"
                style={{
                  filter: 'brightness(2) contrast(1.2) invert(0.1)',
                  bottom: '10px',
                  left: '460px',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>

            {/* Bottom Section: Authorized Dealer strip - all dealers shown */}
            <div className="w-full pt-2 pb-0 sm:pt-4 lg:pt-0 lg:pb-4 lg:-mt-4">
              <div className="relative w-full">
                {authorizedDealers.length > 0 ? (
                  <div 
                    className="overflow-hidden rounded-lg flex flex-col justify-between py-2 px-4 sm:py-2.5 sm:px-8 md:px-[54px] md:py-[6px] h-[120px] sm:h-[140px] md:h-[165px]"
                    style={{
                      background: 'linear-gradient(270deg, rgba(65, 65, 65, 0) 0%, #7A0000 33.17%, #930000 55.29%, #7A0000 75%, rgba(65, 65, 65, 0) 100%)',
                    }}
                  >
                    {}
                    <div className="grid grid-cols-4 items-center justify-items-center gap-1 sm:gap-[4px] flex-1 min-h-0 overflow-hidden">
                      {authorizedDealers.map((dealer) => {
                        const imageUrl = dealer.image.startsWith('/api/images/') || dealer.image.startsWith('http') || dealer.image.startsWith('/')
                          ? dealer.image
                          : `/api/images/${dealer.image}`;
                        const isHuawei = dealer.name.toLowerCase().includes('huawei');
                        const objectFitClass = isHuawei ? 'object-contain' : 'object-cover';
                        return (
                          <div
                            key={dealer.id}
                            className="relative flex items-center justify-center w-full h-full max-h-[72px] sm:max-h-[90px] md:max-h-[120px] overflow-hidden"
                          >
                            <Image
                              src={imageUrl}
                              alt={dealer.name}
                              fill
                              className={`${objectFitClass} filter brightness-0 invert`}
                              sizes="(max-width: 640px) 22vw, (max-width: 768px) 24vw, 20vw"
                              unoptimized
                            />
                          </div>
                        );
                      })}
                    </div>

                    {}
                    <div className="text-center flex-shrink-0 mt-1 sm:mt-2 md:mt-3 mb-0.5 sm:mb-1">
                      <p 
                        className="text-white uppercase font-semibold text-[9px] sm:text-[10px] leading-none py-0.5 sm:py-1"
                        style={{
                          fontFamily: 'Encode Sans Expanded, sans-serif',
                          letterSpacing: '0%',
                        }}
                      >
                        AUTHORIZED DEALER
                      </p>
                    </div>
                  </div>
                ) : content.authorizedDealerImage ? (
              <div className="relative h-[100px] sm:h-[120px] md:h-[140px] w-full">
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
                  <div className="w-full h-[100px] sm:h-[120px] md:h-[140px] flex items-center justify-center bg-gray-300/20 rounded-lg">
                    <span className="text-white/40 text-xs sm:text-sm font-semibold">Authorized Dealer Logos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>

          {}
          <div className="relative flex flex-col min-h-[280px] sm:min-h-[320px] lg:min-h-0 lg:h-full">
            <div className="w-full h-full grid grid-cols-2 lg:flex gap-2 sm:gap-3 md:gap-4 lg:gap-5 2xl:gap-6 lg:flex-1 min-h-[280px] sm:min-h-[320px] lg:min-h-0">
            {categories.length > 0 ? (
              categories.map((c, index) => {
                const animationClass = index % 2 === 0 ? 'slide-down-slow' : 'slide-up-slow';
                return (
                  <div
                    key={c.id}
                    className={`min-h-[130px] sm:min-h-[150px] lg:min-h-0 lg:flex-1 ${animationClass} ${
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
              <div className="col-span-2 w-full h-full flex items-center justify-center text-white/50">
                <p className="text-sm sm:text-base">No categories available</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
