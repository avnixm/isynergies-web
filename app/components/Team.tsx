'use client';

import { useState, useEffect, useRef } from 'react';
import { Encode_Sans_Expanded } from 'next/font/google';
import Image from 'next/image';
import Loading from './ui/loading';

const encodeSansExpanded = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

type RowSpec = {
  count: number;
};

type TeamMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder: number;
};

function EmployeeCard({ index, member }: { index: number; member: TeamMember }) {
  return (
    <div className="relative group">
      <div className="relative rounded-[24px] overflow-visible h-[200px] w-[165px]"
        style={{
          background: 'linear-gradient(to top right, #062092 0%, #5393C1 35%, #A9C9E0 70%, #FFFFFF 100%)',
        }}
      >
        {member.image ? (
          <div className="absolute inset-0 flex items-end justify-center overflow-visible">
            <img
              src={typeof member.image === 'string' && (member.image.startsWith('/api/images/') || member.image.startsWith('http'))
                ? member.image 
                : `/api/images/${member.image}`}
              alt={member.name}
              className="object-contain rounded-[24px]"
              style={{
                width: '110%',
                height: '110%',
                transform: 'translateX(-50%)',
                left: '50%',
                bottom: 0,
                position: 'absolute',
                objectPosition: 'bottom center',
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
          </div>
        )}

        {/* hover overlay (like Board members) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0D1E66] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 rounded-[24px] z-10">
          <div className={`${encodeSansExpanded.className} text-white text-[20px] font-bold leading-tight mb-0.5`}>{member.name}</div>
          <div className="text-white text-[10px] font-normal uppercase">{member.position}</div>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.2,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/admin/team');
        if (response.ok) {
          const data = await response.json();
          // Sort by displayOrder (ascending)
          const sortedData = data.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
          // Filter out members without both image and name
          const filteredData = sortedData.filter((member: TeamMember) => 
            member.image && member.name && member.name.trim() !== ''
          );
          setMembers(filteredData);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <section ref={sectionRef} className="relative bg-[#D7E1E4] py-16 flex justify-center items-center min-h-screen">
        <Loading message="Loading team members" size="lg" />
      </section>
    );
  }

  // Filter members to only show those with both image and name
  const validMembers = members.filter(member => 
    member.image && member.name && member.name.trim() !== ''
  );

  // Calculate row distribution (5-6-5 pattern) - only after data is loaded
  const rows: RowSpec[] = [{ count: 5 }, { count: 6 }, { count: 5 }];
  let cursor = 0;

  return (
    <section ref={sectionRef} className="relative bg-[#D7E1E4] py-16">
      {/* subtle watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-60px] top-[-40px] w-[380px] h-[380px] flex items-center justify-center z-0">
          <img
            src="/logos/iSgray.png"
            alt="iS logo"
            className="w-full h-full object-contain"
            style={{ filter: 'brightness(0.3) contrast(1.2)' }}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 md:px-8 lg:px-16 relative z-10">
        {/* header bar */}
        <div className="mx-auto mb-10 w-full max-w-5xl overflow-hidden rounded-2xl">
          <div className="bg-gradient-to-r from-transparent via-[#0D1E66] to-transparent py-4">
            <h2 className="text-center font-sans text-4xl md:text-5xl font-bold text-white">
              Our Team
            </h2>
          </div>
        </div>

        {/* Only show rows if there are valid members */}
        {validMembers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No team members to display</p>
          </div>
        ) : (
          /* 5 / 6 / 5 rows (exact, no wrapping on desktop) */
        <div className="space-y-7">
          {rows.map((row, rowIdx) => {
            const start = cursor;
            cursor += row.count;
              const items = Array.from({ length: row.count })
                .map((_, i) => {
              const memberIndex = start + i;
                  return validMembers[memberIndex];
                })
                .filter(member => member !== undefined) // Remove undefined entries
                .map((member, i) => {
                  const originalIndex = start + i;
              return (
                <EmployeeCard
                      key={`${rowIdx}-${originalIndex}-${member.id}`}
                      index={originalIndex}
                  member={member}
                />
              );
            });

            // Determine animation based on row index: 0 = slide-left, 1 = slide-right, 2 = slide-left
            const animationClass = rowIdx === 1 ? 'slide-right-row' : 'slide-left-row';
              
              // Only render row if it has items
              if (items.length === 0) return null;
            
            return (
              <div
                key={rowIdx}
                className={`grid w-fit mx-auto gap-6 ${animationClass} ${
                  isVisible ? 'animate' : 'opacity-0'
                }`}
                  style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
              >
                {items}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
