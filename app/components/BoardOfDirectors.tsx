'use client';

import Image from 'next/image';

export default function BoardOfDirectors() {
  const boardMembers = [
    { name: 'Divina Gracia', lastName: 'Santos', position: 'President', image: '/board-of-directors/divinagraciasantos.png' },
    { name: 'Rolando', lastName: 'Victoria', position: 'Vice President', image: '/board-of-directors/rolandovictoria.png' },
    { name: 'Irma', lastName: 'Santos', position: 'Secretary', image: '/board-of-directors/irmasantos.png' },
    { name: 'Emeteria', lastName: 'Quijano', position: 'Treasurer', image: '/board-of-directors/emeteriaquijano.png' },
    { name: 'Joel', lastName: 'Respicio', position: 'AUDITOR', image: '/board-of-directors/joelrespicio.png' },
  ];

  return (
    <section
      id="board-of-directors"
      className="relative bg-[#D7E1E4] py-16"
    >
      {/* iS gray logo in background */}
      <div className="absolute right-0 md:right-0 top-20 md:top-32 -translate-y-1/2 z-0 pointer-events-none">
        <Image
          src="/logos/iSgray.png"
          alt="iSynergies iS gray logo"
          width={800}
          height={800}
          className="w-[400px] h-[400px] md:w-[600px] md:h-[600px] object-contain"
          style={{
            filter: 'brightness(0.08) contrast(1.4)',
            WebkitFilter: 'brightness(0.08) contrast(1.4)',
          }}
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-16 relative z-10">
        <div className="w-full relative">

          {/* Red circle gradient between 4th and 5th board member */}
          <div 
            className="absolute top-10 left-[65%] md:left-[73%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] z-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.3) 20%, rgba(220, 38, 38, 0.2) 40%, rgba(220, 38, 38, 0.15) 50%, rgba(220, 38, 38, 0.1) 60%, rgba(220, 38, 38, 0.05) 75%, transparent 100%)',
              filter: 'blur(40px)',
              WebkitFilter: 'blur(40px)',
            }}
          />

          {/* Board Members Grid */}
          <div className="flex justify-center relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8 w-fit mx-auto">
              {boardMembers.map((member, index) => (
                <div key={index} className="relative group">
                  <div className="relative rounded-xl overflow-hidden w-[150px] h-[200px] md:w-[180px] md:h-[240px]"
                    style={{
                      background: 'linear-gradient(to right, rgba(255, 150, 100, 0.9) 0%, rgba(255, 200, 150, 0.8) 50%, rgba(255, 255, 255, 0.9) 100%)',
                    }}
                  >
                    <Image
                      src={member.image}
                      alt={`${member.name} ${member.lastName}`}
                      width={350}
                      height={433}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover overlay with dark blue gradient showing name and position */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0D1E66] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p className="text-white font-bold text-xl md:text-2xl mb-0.5">{member.name}</p>
                      <p className="text-white font-bold text-xl md:text-2xl mb-0.5">{member.lastName}</p>
                      <p className="text-white text-[10px] md:text-xs font-normal uppercase">{member.position}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Footer text */}
          <p className="text-center text-gray-700 text-sm mt-6 font-sans">
            iSynergies Inc.'s elected Board of Directors for the year 2025 - 2026
          </p>
        </div>
      </div>
    </section>
  );
}

