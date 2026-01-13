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
          'w-[190px] h-[190px]',
          'md:w-[220px] md:h-[220px]',
          'transition-transform duration-300 ease-in-out',
          'group-hover:scale-[1.04]',
          emphasized ? 'scale-[1.02]' : '',
        ].join(' ')}
      >
        {/* dark offset shadow hex (like the reference) */}
        <div className="hexagon absolute inset-0 translate-x-3 translate-y-3 bg-[#061645]/70 blur-[0.2px]" />

        {/* main hex */}
        <div className="hexagon relative z-10 h-full w-full overflow-hidden bg-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-shadow duration-300 ease-in-out group-hover:shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain p-4 md:p-5"
            sizes="(min-width: 768px) 220px, 190px"
            priority={false}
          />
        </div>
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
        <div className="container mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-12 md:px-10 md:py-12">
          {/* Top area: left copy + right hex cluster */}
          <div className="grid w-full items-center gap-14 md:grid-cols-2">
            {/* Left copy */}
            <div className="font-sans">
              <h2 className="text-5xl font-semibold leading-[1.02] tracking-tight md:text-6xl">
                Our Services
              </h2>

              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/85 md:text-[16px]">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec sed
                consequat quam. Sed vel lorem finibus enim consectetur eleifend sit
                amet vel neque.
              </p>

              <ul className="mt-6 space-y-3 text-[18px] font-semibold text-white md:text-[20px]">
                {['Development', 'Support', 'Analysis & Design', 'Sales'].map(
                  (t) => (
                    <li key={t} className="flex items-center gap-3">
                      <span className="text-[22px] leading-none text-white/90">
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
                <div className="grid grid-cols-3 grid-rows-2 place-items-center gap-x-6 gap-y-10">
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
                    className="col-start-1 row-start-2 -mt-8 md:-mt-10"
                  />
                  <HexImage
                    src="/services/SUPPORT.png"
                    alt="Support"
                    className="col-start-2 row-start-2 -mt-8 md:-mt-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Red Scrolling Ticker Bar */}
          <div className="bg-[#DC2626] py-3 md:py-3.5">
            <div className="ticker-container">
              <div className="ticker-content">
                <span className="ticker-text">
                  TV INSTALLATION * GADGETS * PRINTERS * LAPTOP * SOFTWARE
                  DEVELOPMENT * UI/UX DESIGN * SOFTWARE INSTALLATION * HARDWARE
                  REPAIRS * CCTV INSTALLATION
                </span>
                <span className="ticker-text">
                  TV INSTALLATION * GADGETS * PRINTERS * LAPTOP * SOFTWARE
                  DEVELOPMENT * UI/UX DESIGN * SOFTWARE INSTALLATION * HARDWARE
                  REPAIRS * CCTV INSTALLATION
                </span>
              </div>
            </div>
          </div>

          {/* By the Numbers (kept compact so it stays visible) */}
          <div className="pt-10 md:pt-10">
            <div className="text-center font-sans">
              <h3 className="text-4xl font-semibold md:text-5xl">
                By the Numbers
              </h3>

              <div className="mt-10 grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-y-0">
                <div>
                  <div className="text-6xl font-semibold md:text-7xl">30+</div>
                  <div className="mt-2 text-xl font-semibold md:text-2xl">
                    Clients
                  </div>
                </div>
                <div>
                  <div className="text-6xl font-semibold md:text-7xl">
                    5000+
                  </div>
                  <div className="mt-2 text-xl font-semibold md:text-2xl">
                    Customers
                  </div>
                </div>
                <div>
                  <div className="text-6xl font-semibold md:text-7xl">100+</div>
                  <div className="mt-2 text-xl font-semibold md:text-2xl">
                    Projects
                  </div>
                </div>
                <div>
                  <div className="text-6xl font-semibold md:text-7xl">16</div>
                  <div className="mt-2 text-xl font-semibold md:text-2xl">
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
