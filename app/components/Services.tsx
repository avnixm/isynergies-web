'use client';

import Image from 'next/image';

type HexImageProps = {
  src: string;
  alt: string;
  className?: string;
  emphasized?: boolean;
};

function HexImage({ src, alt, className, emphasized }: HexImageProps) {
  return (
    <div className={['group relative', className ?? ''].join(' ')}>
      <div
        className={[
          'relative',
          // sized down to match AboutUs scale
          'w-[140px] h-[140px]',
          'md:w-[170px] md:h-[170px]',
          'transition-transform duration-300 ease-in-out',
          'group-hover:scale-[1.03]',
          emphasized ? '' : '',
        ].join(' ')}
      >
        {/* PNGs are already hexagonal, so render them directly (no extra shape/frame). */}
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)] transition-[filter] duration-300 ease-in-out group-hover:drop-shadow-[0_14px_24px_rgba(0,0,0,0.22)]"
          sizes="(min-width: 768px) 170px, 140px"
          priority={false}
        />
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section id="services" className="relative bg-[#0D1E66] text-white">
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
            <div className="space-y-2 pr-4 md:pr-8 font-sans -mt-[50px]">
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
                  <HexImage
                    src="/services/SALES.png"
                    alt="Sales"
                    className="col-start-2 row-start-1"
                    emphasized
                  />
                  <HexImage
                    src="/services/ANALYSIS.png"
                    alt="Analysis Design"
                    className="col-start-3 row-start-1"
                  />

                  {/* bottom row (offset upward for honeycomb) */}
                  <HexImage
                    src="/services/DEVELOPEMENT.png"
                    alt="Development"
                    className="col-start-1 row-start-2 -mt-6 md:-mt-[170px] translate-x-[82px] md:translate-x-[100px]"
                  />
                  <HexImage
                    src="/services/SUPPORT.png"
                    alt="Support"
                    className="col-start-2 row-start-2 -mt-6 md:-mt-[165px] translate-x-[82px] md:translate-x-[100px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Red Scrolling Ticker Bar */}
          <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#5B0A0A] py-2.5 md:py-3">
            <div className="ticker-container ticker-fade">
              <div className="ticker-content">
                {/* One loop */}
                <div className="ticker-row">
                  <span className="ticker-item">SOFTWARE DEVELOPMENT</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">UI/UX DESIGN</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">SOFTWARE INSTALLATION</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">HARDWARE REPAIRS</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">CCTV INSTALLATION</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">GADGETS</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">PRINTERS</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">LAPTOP</span>
                </div>

                {/* Duplicate loop for seamless scroll */}
                <div className="ticker-row" aria-hidden>
                  <span className="ticker-item">SOFTWARE DEVELOPMENT</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">UI/UX DESIGN</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">SOFTWARE INSTALLATION</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">HARDWARE REPAIRS</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">CCTV INSTALLATION</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">GADGETS</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">PRINTERS</span>
                  <span className="ticker-star">*</span>
                  <span className="ticker-item">LAPTOP</span>
                </div>
              </div>
            </div>
          </div>

          {/* By the Numbers (kept compact so it stays visible) */}
          <div className="pt-8 md:pt-8">
            <div className="text-center font-sans">
              <h3 className="text-2xl md:text-3xl font-bold">
                By the Numbers
              </h3>

              <div className="mt-8 grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-y-0">
                <div>
                  <div className="text-4xl md:text-5xl font-bold">30+</div>
                  <div className="mt-1 text-sm md:text-base font-semibold">
                    Clients
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold">5000+</div>
                  <div className="mt-1 text-sm md:text-base font-semibold">
                    Customers
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold">100+</div>
                  <div className="mt-1 text-sm md:text-base font-semibold">
                    Projects
                  </div>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold">16</div>
                  <div className="mt-1 text-sm md:text-base font-semibold">
                    Dedicated Staff
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
