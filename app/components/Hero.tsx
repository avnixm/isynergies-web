'use client';

import { useEffect, useState, ReactNode } from 'react';
import Image from 'next/image';
import Loading from './ui/loading';

type HeroSection = {
  weMakeItLogo: string | null;
  isLogo: string | null;
  fullLogo: string | null;
  backgroundImage: string | null;
};

type HeroTickerItem = {
  id: number;
  text: string;
  displayOrder: number;
};

type NavLink = {
  label: string;
  href: string;
};

type HeroProps = {
  navLinks: NavLink[];
};

export default function Hero({ navLinks }: HeroProps) {
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [heroTickerItems, setHeroTickerItems] = useState<HeroTickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        // Fetch hero section
        const sectionRes = await fetch('/api/admin/hero-section');
        if (sectionRes.ok) {
          const sectionData = await sectionRes.json();
          console.log('Hero section data:', sectionData);
          setHeroSection(sectionData);
        }

        // Fetch hero ticker items
        const tickerRes = await fetch('/api/admin/hero-ticker');
        if (tickerRes.ok) {
          const tickerData = await tickerRes.json();
          console.log('Hero ticker data:', tickerData);
          if (Array.isArray(tickerData) && tickerData.length > 0) {
            setHeroTickerItems(tickerData);
          } else if (Array.isArray(tickerData) && tickerData.length === 0) {
            console.log('No ticker items in database, using fallback');
            // Keep empty array to use fallback
          } else {
            console.warn('Hero ticker data is not an array:', tickerData);
          }
        } else {
          const errorText = await tickerRes.text();
          console.error('Failed to fetch hero ticker items:', tickerRes.status, tickerRes.statusText, errorText);
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, []);

  // Helper function to get image URL from database
  const getImageUrl = (value: string | null, fallback?: string): string | null => {
    if (!value) return fallback || null;
    // If already a full path, use it as is
    if (value.startsWith('/api/images/') || value.startsWith('http')) return value;
    // Otherwise construct the URL
    return `/api/images/${value}`;
  };

  // Background image - keep bluebg.png as fallback (always returns a string)
  const bgImage = getImageUrl(heroSection?.backgroundImage ?? null, '/bluebg.png') || '/bluebg.png';
  // Other images - only from database (no fallbacks)
  const weMakeItImage = getImageUrl(heroSection?.weMakeItLogo ?? null);
  const isLogoImage = getImageUrl(heroSection?.isLogo ?? null);
  const fullLogoImage = getImageUrl(heroSection?.fullLogo ?? null);

  // Use ticker items from database only (no hardcoded fallbacks)
  const tickerItems = heroTickerItems;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image - always show (uses bluebg.png as fallback) */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="iSynergies background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Invisible anchor for home */}
      <div id="home" className="absolute top-0 h-0 w-0" aria-hidden />

      {/* Glassmorphic floating navbar - show and animate only after hero data is loaded */}
      {!loading && (
        <nav className="absolute left-1/2 top-6 z-20 w-[85%] max-w-4xl -translate-x-1/2">
          <div className="navbar-dropdown flex items-center justify-between rounded-2xl bg-gray-800/90 backdrop-blur-xl px-6 py-2 shadow-2xl shadow-black/25 border border-gray-700/50">
            <div className="flex items-center">
              <Image
                src="/logos/isynergiesinclogo.png"
                alt="iSynergies Inc."
                width={250}
                height={34}
                className="h-[34px] w-auto"
                priority
              />
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-white transition-colors hover:text-blue-300 scroll-smooth"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
      )}

      {/* We make IT possible logo - Left side - only show if exists in database */}
      {weMakeItImage && (
        <div className="slide-right absolute left-8 md:left-11 top-[200px] -translate-y-1/2 z-20">
          <Image
            src={weMakeItImage}
            alt="We make IT possible"
            width={800}
            height={500}
            className="w-[480px] h-[292px] md:w-[580px] md:h-[355px] object-contain"
            priority
          />
        </div>
      )}

      {/* iS logo - Right side, large graphic - only show if exists in database */}
      {isLogoImage && (
        <div className="fade-in absolute right-0 md:right-0 top-[100px] -translate-y-1/4 z-10">
          <Image
            src={isLogoImage}
            alt="iSynergies iS logo"
            width={1200}
            height={1200}
            className="w-[500px] h-[500px] md:w-[750px] md:h-[750px] opacity-90 object-contain"
            priority
          />
        </div>
      )}

      {/* Full iSynergies logo - Right side, below iS logo - only show if exists in database */}
      {fullLogoImage && (
        <div className="fade-in absolute right-2 md:right-[-40px] top-[45%] -translate-y-1/3 z-20 w-[600px] h-[300px] md:w-[700px] md:h-[350px]">
          <Image
            src={fullLogoImage}
            alt="iSynergies Inc. full logo"
            width={750}
            height={375}
            className="w-full h-full object-contain"
            priority
            unoptimized
          />
        </div>
      )}

      {/* Floating Text Bar - only show if there are ticker items in database */}
      {tickerItems.length > 0 && (
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute bottom-8 left-1/2 z-10 -translate-x-1/2 px-4">
            <div className="flex items-center justify-center gap-4 rounded-2xl bg-gray-800/90 backdrop-blur-xl px-6 py-4 shadow-2xl shadow-black/25 border border-gray-700/50 w-fit ticker-slow-fade">
              {tickerItems.map((item, index) => {
              // Parse markdown-style links [text](url)
              const parseTextWithLinks = (text: string): ReactNode[] => {
                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                const parts: ReactNode[] = [];
                let lastIndex = 0;
                let match;
                let key = 0;

                while ((match = linkRegex.exec(text)) !== null) {
                  // Add text before the link
                  if (match.index > lastIndex) {
                    parts.push(text.substring(lastIndex, match.index));
                  }
                  // Add the link
                  parts.push(
                    <a
                      key={key++}
                      href={match[2]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-300 transition-colors"
                    >
                      {match[1]}
                    </a>
                  );
                  lastIndex = linkRegex.lastIndex;
                }
                // Add remaining text
                if (lastIndex < text.length) {
                  parts.push(text.substring(lastIndex));
                }
                return parts.length > 0 ? parts : [text];
              };

              return (
                <div key={item.id} className="flex items-center gap-4 text-[12px] font-medium text-white whitespace-nowrap">
                  {index > 0 && <span className="text-white/50 font-bold">-</span>}
                  <span>{parseTextWithLinks(item.text)}</span>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
