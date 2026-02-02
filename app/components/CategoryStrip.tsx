'use client';

import Image from 'next/image';

type CategoryStripProps = {
  name: string;
  text: string;
  image: string | null;
  className?: string;
};

export default function CategoryStrip({ name, text, image, className = '' }: CategoryStripProps) {
  return (
    <div
      className={`relative overflow-hidden group cursor-pointer bg-gray-300 category-strip-responsive ${className}`}
      style={{
        flex: '1 1 0',
        minWidth: '80px',
        width: '100%',
        height: '100%',
      }}
    >
      {}
      {(() => {
        const imageUrl = image && image.toString().trim() !== ''
          ? (typeof image === 'string' && (image.startsWith('/api/images/') || image.startsWith('http') || image.startsWith('/'))
              ? image 
              : `/api/images/${image}`)
          : null;
        
        return imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover object-center transition-all duration-300 group-hover:brightness-110"
            sizes="(min-width: 1024px) 12vw, 12vw"
            priority={false}
            unoptimized
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-gray-200 to-gray-300" />
        );
      })()}
      
      {}
      <div 
        className="absolute pointer-events-none z-10 right-0.5 bottom-8 sm:bottom-10 md:bottom-12 lg:bottom-14 w-px h-px"
      >
        <div
          className="absolute bottom-0 left-0 whitespace-nowrap origin-bottom-left"
          style={{
            transform: 'rotate(-90deg)',
          }}
        >
          <span
            className={`inline-block text-[1.25rem] sm:text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] xl:text-[3rem] font-semibold uppercase leading-tight tracking-wide ${image ? 'text-white' : 'text-gray-600'}`}
            style={{
              fontFamily: '"Teko", sans-serif',
              fontStretch: 'condensed',
              textShadow: image ? '4px 4px 12px rgba(0,0,0,0.9)' : '1px 1px 3px rgba(0,0,0,0.1)',
            }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        </div>
      </div>
    </div>
  );
}
