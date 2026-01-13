'use client';

type RowSpec = {
  count: number;
};

type TeamMember = {
  name: string;
  position: string;
};

function EmployeeCard({ index, member }: { index: number; member: TeamMember }) {
  return (
    <div className="group relative h-[200px] w-[165px] overflow-hidden rounded-[26px] bg-gradient-to-b from-[#F1F1F1] to-[#D9D9D9]">
      {/* gray portrait placeholder only (no blue frame) */}
      <div className="absolute inset-0 rounded-[26px] bg-gradient-to-b from-[#F1F1F1] to-[#D9D9D9]" />

      {/* hover overlay (like Board members) */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {/* only cover the bottom portion (not full card) */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#0D1E66] via-[#0D1E66]/75 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="text-white text-lg font-bold leading-tight">
            {member.name}
          </div>
          <div className="text-white/90 text-xs font-normal uppercase tracking-wide">
            {member.position}
          </div>
        </div>
      </div>

      {/* accessibility label */}
      <span className="sr-only">Employee placeholder {index + 1}</span>
    </div>
  );
}

export default function Team() {
  const rows: RowSpec[] = [{ count: 5 }, { count: 6 }, { count: 5 }];
  const members: TeamMember[] = Array.from({ length: 16 }).map((_, i) => ({
    name: `Employee ${i + 1}`,
    position: 'Team Member',
  }));

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
            const items = Array.from({ length: row.count }).map((_, i) => (
              <EmployeeCard
                key={`${rowIdx}-${i}`}
                index={start + i}
                member={members[start + i]}
              />
            ));

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


