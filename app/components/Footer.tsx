'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

type SiteSettings = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyFacebook: string;
  companyTwitter: string;
  companyInstagram: string;
  logoImage: string | null;
};

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>({
    companyName: 'iSynergies Inc.',
    companyAddress: '105 Maharlika Highway, Cabanatuan City, 3100, Philippines',
    companyPhone: '(044) 329 2400',
    companyEmail: 'infoho@isynergiesinc.com',
    companyFacebook: 'https://facebook.com/isynergiesinc',
    companyTwitter: '',
    companyInstagram: '',
    logoImage: null,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/site-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <footer className="relative text-white overflow-hidden" aria-label="Site footer" style={{
      background: 'linear-gradient(to bottom right, #0D1E66, #003C9D, #001A4F)'
    }}>
      {/* Hexagonal pattern background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(60deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px),
            repeating-linear-gradient(-60deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)
          `,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 md:px-8 lg:px-10 pt-8 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Brand + contact */}
          <div className="space-y-3 font-sans">
            {/* Logo */}
            <div className="relative h-10 md:h-12 w-48 md:w-56">
              {settings.logoImage ? (
                <Image
                  src={typeof settings.logoImage === 'string' && (settings.logoImage.startsWith('/api/images/') || settings.logoImage.startsWith('http') || settings.logoImage.startsWith('/'))
                    ? settings.logoImage 
                    : `/api/images/${settings.logoImage}`}
                  alt="iSynergies Inc."
                  fill
                  className="object-contain object-left"
                  sizes="224px"
                  priority={false}
                />
              ) : (
                <div className="h-full w-full rounded-lg bg-white/10 border border-white/20" />
              )}
            </div>

            {/* Contact information */}
            <div className="space-y-1.5 text-xs md:text-sm text-white/90 leading-normal">
              <p>{settings.companyAddress}</p>
              <p>{settings.companyPhone}</p>
              <p>{settings.companyEmail}</p>
            </div>

            {/* Social icons - white squares with dark blue symbols */}
            <div className="flex items-center gap-2 pt-2">
              {/* Facebook */}
              {settings.companyFacebook && (
                <a
                  href={settings.companyFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-8 w-8 items-center justify-center bg-white rounded-sm transition-transform hover:scale-110"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0D1E66" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}

              {/* X (Twitter) */}
              {settings.companyTwitter && (
                <a
                  href={settings.companyTwitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="flex h-8 w-8 items-center justify-center bg-white rounded-sm transition-transform hover:scale-110"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0D1E66" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}

              {/* Instagram */}
              {settings.companyInstagram && (
                <a
                  href={settings.companyInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-8 w-8 items-center justify-center bg-white rounded-sm transition-transform hover:scale-110"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#0D1E66" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Right: Site map */}
          <div className="font-sans">
            <h3 className="text-lg md:text-xl font-bold mb-4 text-white">Site Map</h3>

            <div className="grid grid-cols-2 gap-x-6 md:gap-x-8 gap-y-1.5 text-xs md:text-sm">
              <div className="space-y-1.5">
                <a href="#home" className="block text-white/90 hover:text-white transition-colors">
                  Home
                </a>
                <a href="#services" className="block text-white/90 hover:text-white transition-colors">
                  Services
                </a>
                <a href="#shop" className="block text-white/90 hover:text-white transition-colors">
                  Shop
                </a>
                <a href="#about" className="block text-white/90 hover:text-white transition-colors">
                  About Us
                </a>
                <a href="#team" className="block text-white/90 hover:text-white transition-colors">
                  Team
                </a>
                <a href="#contact" className="block text-white/90 hover:text-white transition-colors">
                  Contact Us
                </a>
              </div>

              <div className="space-y-1.5">
                <a href="#help" className="block text-white/90 hover:text-white transition-colors">
                  Help Center
                </a>
                <a href="#terms" className="block text-white/90 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#privacy" className="block text-white/90 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs md:text-sm font-sans text-white/70">
          Copyright {settings.companyName}. All Rights Reserved
        </div>
      </div>
    </footer>
  );
}


