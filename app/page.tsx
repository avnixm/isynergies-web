import Image from "next/image";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Projects", href: "#projects" },
  { label: "Shop", href: "#shop" },
  { label: "Login", href: "#login" },
];

import AboutUs from './components/AboutUs';
import BoardOfDirectors from './components/BoardOfDirectors';
import Services from './components/Services';

export default function Home() {
  return (
    <div className="relative text-white">
      {/* Landing Section */}
      <div className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/bluebg.png"
          alt="iSynergies background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Invisible anchor for home */}
      <div id="home" className="absolute top-0 h-0 w-0" aria-hidden />

      {/* Glassmorphic floating navbar */}
      <nav className="absolute left-1/2 top-6 z-20 w-[92%] max-w-5xl -translate-x-1/2">
        <div className="flex items-center justify-between rounded-2xl bg-gray-800/90 backdrop-blur-xl px-6 py-4 shadow-2xl shadow-black/25 border border-gray-700/50">
          <div className="flex items-center">
            <Image
              src="/logos/isynergiesinclogo.png"
              alt="iSynergies Inc."
              width={200}
              height={60}
              className="h-auto w-auto max-h-[60px]"
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

      {/* We make IT possible logo - Left side */}
      <div className="absolute left-8 md:left-11 top-[200px] -translate-y-1/2 z-20">
        <Image
          src="/wemakeitpossible.png"
          alt="We make IT possible"
          width={800}
          height={500}
          className="w-[480px] h-[292px] md:w-[580px] md:h-[355px] object-contain"
          priority
        />
      </div>

      {/* iS logo - Right side, large graphic */}
      <div className="absolute right-0 md:right-0 top-[100px] -translate-y-1/4 z-10">
        <Image
          src="/logos/iS.png"
          alt="iSynergies iS logo"
          width={1200} 
          height={1200}
          className="w-[500px] h-[500px] md:w-[750px] md:h-[750px] opacity-90 object-contain"
          priority
        />
      </div>

      {/* Full iSynergies logo - Right side, below iS logo */}
     <div className="absolute right-2 md:right-[-40px] top-[45%] -translate-y-1/3 z-20">
        <Image
          src="/logos/isynergiesfull.png"
          alt="iSynergies Inc. full logo"
          width={750}
          height={375}
          className="w-[600px] h-[300px] md:w-[700px] md:h-[350px] object-contain"
          priority
        />
      </div>

      {/* Film strip with placeholders */}
      <div className="pointer-events-none absolute inset-0">
        <div className="pointer-events-auto absolute bottom-8 left-1/2 z-10 w-full max-w-6xl -translate-x-1/2 px-4">
          <div className="relative">
            {/* Background container with mask - only affects the strip background */}
            <div 
              className="absolute inset-0 rounded-2xl border-r border-t border-b border-white/20 bg-white/10 shadow-2xl shadow-black/30 backdrop-blur-2xl"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.9) 30%, black 40%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.9) 30%, black 40%)',
              }}
            />
            
            {/* Dark blue gradient overlay - fades from right (blue) to left (transparent) */}
            <div 
              className="absolute inset-0 rounded-2xl pointer-events-none z-[5]"
              style={{
                background: 'linear-gradient(to left, rgba(13, 30, 102, 0.95) 0%, rgba(13, 30, 102, 0.8) 10%, rgba(13, 30, 102, 0.6) 20%, rgba(13, 30, 102, 0.4) 30%, rgba(13, 30, 102, 0.2) 40%, transparent 50%)',
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.9) 30%, black 40%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, rgba(0,0,0,0.6) 20%, rgba(0,0,0,0.9) 30%, black 40%)',
              }}
            />
            
            {/* Blurred background layer - film strip effect */}
            <div 
              className="absolute inset-0 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 px-4 py-4"
              style={{
                filter: 'blur(8px)',
                maskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.8) 50%, black 70%)',
                WebkitMaskImage: 'linear-gradient(to left, transparent 0%, rgba(0,0,0,0.2) 15%, rgba(0,0,0,0.5) 30%, rgba(0,0,0,0.8) 50%, black 70%)',
              }}
            >
              {Array.from({ length: 8 }).map((_, index) => {
                const placeholderNumber = index + 1;
                return (
                  <div
                    key={`blur-${placeholderNumber}`}
                    className="overflow-hidden"
                    style={{ borderRadius: '20px' }}
                  >
                    <Image
                      src={`/film-pictures/placeholder${placeholderNumber}.png`}
                      alt=""
                      width={240}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Clear images on top - no blur, fully opaque, NOT masked */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 relative z-10 px-4 py-4">
              {Array.from({ length: 8 }).map((_, index) => {
                const placeholderNumber = index + 1;
                
                return (
                  <div
                    key={placeholderNumber}
                    className="overflow-hidden border border-white/25 bg-white/10 shadow-lg shadow-black/20 relative"
                    style={{ borderRadius: '20px' }}
                  >
                    <Image
                      src={`/film-pictures/placeholder${placeholderNumber}.png`}
                      alt={`Placeholder ${placeholderNumber}`}
                      width={240}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* About Us Section */}
      <AboutUs />
      
      {/* Board of Directors Section */}
      <BoardOfDirectors />
      
      {/* Services Section */}
      <Services />
    </div>
  );
}
