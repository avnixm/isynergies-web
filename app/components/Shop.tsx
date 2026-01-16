'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await fetch('/api/admin/shop');
        if (response.ok) {
          const data = await response.json();
          console.log('Shop data fetched:', data);
          if (data.content) {
            setContent(data.content);
          }
          if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
            // Sort by displayOrder (ascending)
            const sortedCategories = data.categories.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
            console.log('Setting categories:', sortedCategories);
            setCategories(sortedCategories);
          } else {
            // Keep default categories if API doesn't return any
            console.log('No categories from API, using defaults');
          }
        } else {
          console.error('Failed to fetch shop data:', response.status);
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
        className="relative bg-gradient-to-b from-[#0A1D5B] via-[#0D1E66] to-[#05113A] text-white overflow-hidden min-h-[700px] flex items-center justify-center"
      >
        <Loading message="Loading shop content..." />
      </section>
    );
  }

  return (
    <section
      id="shop"
      className="relative bg-gradient-to-b from-[#0A1D5B] via-[#0D1E66] to-[#05113A] text-white"
      style={{ overflowX: 'hidden', overflowY: 'visible', minHeight: '700px', width: '100%', maxWidth: '100vw' }}
    >
      {/* subtle watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] z-0">
        <div className="absolute right-[-160px] top-[-120px] h-[620px] w-[620px] text-[520px] font-black leading-none text-white/15 select-none">
          iS
        </div>
      </div>

      {/* Fixed rigid layout: 48% left, 52% right */}
      <div className="relative w-full flex items-stretch z-10 overflow-x-hidden" style={{ minHeight: '700px', height: '700px', maxWidth: '100vw' }}>
        {/* Left Panel (~48%) */}
        <div className="relative w-[48%] bg-gradient-to-b from-[#122C7E] via-[#0D1E66] to-[#081239] flex flex-col" style={{ height: '100%' }}>
          <div className="p-8 md:p-10 flex flex-col h-full justify-between">
            {/* Top Section: Title and Description */}
            <div className="flex flex-col">
              {/* Header with title and button */}
              <div className="flex items-start justify-between gap-6 mb-6">
                <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-white">
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
              <p className="max-w-xl text-xs md:text-sm leading-relaxed text-white/85 font-sans" dangerouslySetInnerHTML={{ __html: content.description }} />
            </div>

            {/* Middle Section: Sales hexagon - centered with even spacing */}
            <div className="flex items-center justify-center flex-1 py-8">
              <div className="relative h-[180px] w-[180px]">
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
                    unoptimized
                    quality={100}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-40 h-40 bg-gray-300 rounded-full opacity-30" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Authorized Dealer strip - with even spacing */}
            <div className="w-full pt-2 pb-4 px-6">
              <div className="relative h-[140px] w-full">
                {content.authorizedDealerImage ? (
                  <Image
                    src={typeof content.authorizedDealerImage === 'string' && (content.authorizedDealerImage.startsWith('/api/images/') || content.authorizedDealerImage.startsWith('http') || content.authorizedDealerImage.startsWith('/'))
                      ? content.authorizedDealerImage 
                      : `/api/images/${content.authorizedDealerImage}`}
                    alt="Authorized dealer logos"
                    fill
                    className="object-contain"
                    sizes="(min-width: 1024px) 520px, 100vw"
                    priority={false}
                    unoptimized
                    quality={100}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300/20 rounded-lg">
                    <span className="text-white/40 text-sm font-semibold">Authorized Dealer Logos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (~52%) - 4 vertical strips with custom images and text - Full height */}
        <div className="relative w-[52%] flex gap-3 overflow-x-hidden" style={{ height: '100%', maxWidth: '100%' }}>
          {categories.length > 0 ? (
            categories.map((c) => (
              <CategoryStrip
                key={c.id}
                name={c.name}
                text={c.text || c.name.toUpperCase()}
                image={c.image || null}
              />
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <p>No categories available</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
