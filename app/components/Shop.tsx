'use client';

import Image from 'next/image';

type ShopCategory = {
  imageSrc: string;
};

export default function Shop() {
  const categories: ShopCategory[] = [
    {
      imageSrc: '/shop/laptops.png',
    },
    {
      imageSrc: '/shop/mobiles.png',
    },
    {
      imageSrc: '/shop/printers.png',
    },
    {
      imageSrc: '/shop/hardware.png',
    },
  ];

  return (
    <section
      id="shop"
      className="relative bg-gradient-to-b from-[#0A1D5B] via-[#0D1E66] to-[#05113A] text-white overflow-hidden"
    >
      {/* subtle watermark */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] z-0">
        <div className="absolute right-[-160px] top-[-120px] h-[620px] w-[620px] text-[520px] font-black leading-none text-white/15 select-none">
          iS
        </div>
      </div>

      {/* Fixed rigid layout: 48% left, 52% right */}
      <div className="relative w-full flex items-stretch h-[700px] z-10">
        {/* Left Panel (~48%) */}
        <div className="relative w-[48%] bg-gradient-to-b from-[#122C7E] via-[#0D1E66] to-[#081239] flex flex-col h-full">
          <div className="p-8 md:p-10 flex flex-col">
            {/* Header with title and button */}
            <div className="flex items-start justify-between gap-6 mb-6">
              <h2 className="font-sans text-4xl md:text-5xl font-bold tracking-tight text-white">
                Shop
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
            <p className="max-w-xl text-xs md:text-sm leading-relaxed text-white/85 font-sans mb-8">
              Our Shop offers a wide range of reliable IT products, including
              laptops, printers, mobile phones, CCTV systems, and other
              computer hardware and peripherals to support both personal and
              business needs.
            </p>
          </div>

          {/* Central Sales hexagon (ONE image asset) - positioned absolutely */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '330px' }}>
            <div className="relative h-[180px] w-[180px]">
              <Image
                src="/services/SALES.png"
                alt="Sales"
                fill
                className="object-contain"
                sizes="180px"
                priority={false}
              />
            </div>
          </div>

          {/* Authorized Dealer strip (ONE image asset) - positioned absolutely */}
          <div className="absolute left-0 w-full pt-2 pb-4 px-6" style={{ bottom: '150px' }}>
            <div className="relative h-[140px] w-full">
              <Image
                src="/authorizeddealer.png"
                alt="Authorized dealer logos"
                fill
                className="object-contain"
                sizes="(min-width: 1024px) 520px, 100vw"
                priority={false}
              />
            </div>
          </div>
        </div>

        {/* Right Panel (~52%) - 4 vertical image strips with gaps between */}
        <div className="relative w-[52%] h-full flex gap-3 -mt-18">
          {categories.map((c, index) => (
            <div
              key={index}
              className="relative h-full flex-1 overflow-hidden group cursor-pointer"
              style={{
                clipPath: 'inset(10% 0 0 0)',
                WebkitClipPath: 'inset(10% 0 0 0)',
              }}
            >
              <Image
                src={c.imageSrc}
                alt=""
                fill
                className="object-cover object-right-top transition-all duration-300 group-hover:brightness-110 group-hover:scale-[1.02]"
                sizes="(min-width: 1024px) 25vw, 25vw"
                priority={false}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
