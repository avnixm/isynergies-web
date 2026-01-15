'use client';

import { useState, useEffect } from 'react';
import { Encode_Sans_Expanded } from 'next/font/google';
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

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/admin/team');
        if (response.ok) {
          const data = await response.json();
          // Sort by displayOrder (ascending)
          const sortedData = data.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
          setMembers(sortedData);
        }
      } catch (error) {
        console.error('Error fetching team members:', error);
        // Fallback to placeholder data
        setMembers(Array.from({ length: 16 }).map((_, i) => ({
          id: i + 1,
          name: `Employee ${i + 1}`,
          position: 'Team Member',
          image: null,
          displayOrder: i,
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (loading) {
    return (
      <section className="relative bg-[#D7E1E4] py-16 flex justify-center items-center min-h-screen">
        <Loading message="Loading team members" size="lg" />
      </section>
    );
  }

  // Calculate row distribution (5-6-5 pattern) - only after data is loaded
  const rows: RowSpec[] = [{ count: 5 }, { count: 6 }, { count: 5 }];
  let cursor = 0;

  return (
    <section className="relative bg-[#D7E1E4] py-16">
      {/* subtle watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute right-[-120px] top-[-120px] h-[520px] w-[520px] rounded-full bg-black/5" />
        <div className="absolute right-[-60px] top-[-40px] h-[520px] w-[520px] text-[380px] font-black leading-none text-black/5 select-none">
          iS
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

        {/* 5 / 6 / 5 rows (exact, no wrapping on desktop) */}
        <div className="space-y-7">
          {rows.map((row, rowIdx) => {
            const start = cursor;
            cursor += row.count;
            const items = Array.from({ length: row.count }).map((_, i) => {
              const memberIndex = start + i;
              const member = members[memberIndex] || {
                id: memberIndex,
                name: `Employee ${memberIndex + 1}`,
                position: 'Team Member',
                image: null,
                displayOrder: memberIndex,
              };
              return (
                <EmployeeCard
                  key={`${rowIdx}-${i}`}
                  index={memberIndex}
                  member={member}
                />
              );
            });

            return (
              <div
                key={rowIdx}
                className="grid w-fit mx-auto gap-6"
                style={{ gridTemplateColumns: `repeat(${row.count}, minmax(0, 1fr))` }}
              >
                {items}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


