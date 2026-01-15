'use client';

import { useEffect, useState } from 'react';
import { Encode_Sans_Expanded } from 'next/font/google';
import Loading from './ui/loading';

const encodeSansExpanded = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

type BoardMember = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  displayOrder: number;
};

export default function BoardOfDirectors() {
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [footerText, setFooterText] = useState("iSynergies Inc.'s elected Board of Directors for the year 2025 - 2026");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardMembers();
    fetchBoardSettings();
  }, []);

  const fetchBoardMembers = async () => {
    try {
      const response = await fetch('/api/admin/board-members');
      const data = await response.json();
      // Sort by displayOrder (ascending)
      const sortedData = data.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
      setBoardMembers(sortedData);
    } catch (error) {
      console.error('Error fetching board members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardSettings = async () => {
    try {
      const response = await fetch('/api/admin/board-settings');
      if (response.ok) {
        const data = await response.json();
        setFooterText(data.footerText);
      }
    } catch (error) {
      console.error('Error fetching board settings:', error);
    }
  };

  return (
    <section
      id="board-of-directors"
      className="relative bg-[#D7E1E4]"
    >
      {/* Red gradient bar header (moved from About Us so sections never overlap) */}
      <div
        className="w-full h-[60px] z-10 flex items-center justify-center px-4 md:px-8 lg:px-16 mb-10"
        style={{
          background:
            'linear-gradient(to right, #800000 0%, rgba(128, 0, 0, 0.95) 60%, rgba(128, 0, 0, 0.4) 80%, transparent 100%)',
        }}
      >
        <p className="text-2xl md:text-3xl font-bold text-white text-center">Our Board of Directors</p>
      </div>

      {/* Muted background shape instead of hardcoded logo */}
      <div className="absolute right-0 md:right-0 top-20 md:top-32 -translate-y-1/2 z-0 pointer-events-none">
        <div
          className="w-[400px] h-[800px] md:w-[600px] md:h-[1000px] bg-gradient-to-b from-gray-300/30 via-gray-200/20 to-transparent rounded-l-full"
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
          <div className="flex justify-center relative z-10 pt-10">
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700"></div>
              </div>
            ) : boardMembers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg">No board members to display</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-8 w-fit mx-auto">
                {boardMembers.map((member) => (
                  <div key={member.id} className="relative group">
                    <div className="relative rounded-[24px] overflow-visible w-[150px] h-[200px] md:w-[180px] md:h-[240px]"
                      style={{
                        background: 'linear-gradient(to top right, #920608 0%, #C16553 35%, #E0C5A9 70%, #FFFFFF 100%)',
                      }}
                    >
                      {member.image ? (
                        <div className="absolute inset-0 flex items-end justify-center overflow-visible">
                          <img
                            src={typeof member.image === 'string' && (member.image.startsWith('/api/images/') || member.image.startsWith('http'))
                              ? member.image 
                              : `/api/images/${member.image}`}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="object-cover rounded-[24px]"
                            style={{
                              width: '120%',
                              height: '120%',
                              transform: 'translateX(-50%)',
                              left: '50%',
                              bottom: 0,
                              position: 'absolute',
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-6xl text-gray-300">👤</span>
                        </div>
                      )}
                      {/* Hover overlay with dark blue gradient showing name and position */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0D1E66] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 rounded-[24px] z-10">
                        <p className={`${encodeSansExpanded.className} text-white font-bold text-[20px] mb-0.5`}>{member.firstName}</p>
                        <p className={`${encodeSansExpanded.className} text-white font-bold text-[20px] mb-0.5`}>{member.lastName}</p>
                        <p className="text-white text-[10px] font-normal uppercase">{member.position}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Footer text */}
          <p className="text-center text-gray-700 text-sm font-sans pb-5">
            {footerText}
          </p>
        </div>
      </div>
    </section>
  );
}

