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
      {/* Background Image or Placeholder */}
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
      
      {/* Text Overlay - Rotated Vertically, First Letter Alignment */}
      <div 
        className="absolute pointer-events-none z-10"
        style={{
          bottom: 'clamp(20px, 8vh, 55px)',
          right: 'clamp(2px, 1vw, 5px)',
          width: '1px',
          height: '1px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            transform: 'rotate(-90deg)',
            transformOrigin: 'bottom left',
            whiteSpace: 'nowrap',
          }}
        >
          <span
            className={image ? 'text-white' : 'text-gray-600'}
            style={{
              fontSize: 'clamp(1.5rem, 4vw, 5rem)',
              textShadow: image ? '4px 4px 12px rgba(0,0,0,0.9)' : '1px 1px 3px rgba(0,0,0,0.1)',
              fontWeight: 600,
              fontFamily: '"Teko", sans-serif',
              textTransform: 'uppercase',
              letterSpacing: 'clamp(0.05em, 0.2em, 0.2em)',
              lineHeight: '1.2',
              fontStretch: 'condensed',
              display: 'inline-block',
            }}
          >
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}
