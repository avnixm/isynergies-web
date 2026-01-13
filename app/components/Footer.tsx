'use client';

import Image from 'next/image';

export default function Footer() {
  return (
    <footer
      className="relative bg-gradient-to-b from-[#0D1E66] via-[#003C9D] to-[#001A4F] text-white"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-10 pt-10 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Left: Brand + contact */}
          <div className="space-y-4 font-sans">
            <div className="relative h-14 w-52">
              <Image
                src="/logos/isynergiesinclogo.png"
                alt="iSynergies Inc."
                fill
                className="object-contain"
                sizes="208px"
                priority={false}
              />
            </div>

            <div className="space-y-1 text-sm md:text-base">
              <p>105 Maharlika Highway, Cabanatuan City, 3100, Philippines</p>
              <p>(044) 329 2400</p>
              <p>infoho@isynergiesinc.com</p>
            </div>

            {/* Social icons */}
            <div className="mt-4 flex items-center gap-4">
              {[
                { label: 'Facebook', href: 'https://facebook.com/isynergiesinc' },
                { label: 'X', href: '#' },
                { label: 'Instagram', href: '#' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/5 text-white transition-colors hover:bg-white/15"
                >
                  <span className="text-sm font-semibold">
                    {item.label === 'Facebook'
                      ? 'f'
                      : item.label === 'X'
                      ? 'X'
                      : 'IG'}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Site map */}
          <div className="font-sans md:text-right">
            <h3 className="text-xl md:text-2xl font-bold mb-4">Site Map</h3>

            <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm md:text-base">
              <div className="space-y-1">
                <a href="#home" className="block hover:text-blue-200">
                  Home
                </a>
                <a href="#about" className="block hover:text-blue-200">
                  About Us
                </a>
                <a href="#services" className="block hover:text-blue-200">
                  Services
                </a>
                <a href="#shop" className="block hover:text-blue-200">
                  Shop
                </a>
                <a href="#team" className="block hover:text-blue-200">
                  Team
                </a>
                <a href="#contact" className="block hover:text-blue-200">
                  Contact Us
                </a>
              </div>

              <div className="space-y-1 md:text-left md:pl-6">
                <a href="#help" className="block hover:text-blue-200">
                  Help Center
                </a>
                <a href="#terms" className="block hover:text-blue-200">
                  Terms of Service
                </a>
                <a href="#privacy" className="block hover:text-blue-200">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-8 border-t border-white/20 pt-4 text-center text-xs md:text-sm font-sans text-white/80">
          Copyright iSynergies Inc. All Rights Reserved
        </div>
      </div>
    </footer>
  );
}


