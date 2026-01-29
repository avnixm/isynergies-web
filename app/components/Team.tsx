'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Encode_Sans_Expanded } from 'next/font/google';
import Image from 'next/image';
import Loading from './ui/loading';
import { resolveImageSrc } from '@/app/lib/resolve-image-src';

const encodeSansExpanded = Encode_Sans_Expanded({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

type Member = {
  id: number;
  name: string;
  position: string;
  image: string | number | null;
  displayOrder: number;
  
  [key: string]: unknown;
};

type Group = {
  id?: number | string;
  name: string;
  displayOrder?: number;
  members: Member[];
};

type Slot =
  | {
      type: 'member';
      member: Member;
      variant?: 'boss';
    }
  | {
      type: 'empty';
    };

type TeamLayout = {
  row1: Slot[];
  row2: Slot[];
  row3: Slot[];
};

type TeamGroupsApiResponse = {
  groups: {
    id?: number | string;
    name: string;
    displayOrder?: number;
    members: Member[];
  }[];
  ungrouped?: Member[];
  featuredMemberId?: number;
};







const TEAM_CARD_LOGO = {
  scale: 2,
  top: 55,
  left: 50,
  opacity: 0.8,
};

const GROUP_KEYWORD_CONFIG: { name: string; keywords: string[] }[] = [
  {
    name: 'Finance, Admin & Accounting',
    keywords: ['finance', 'admin', 'accounting'],
  },
  {
    name: 'Marketing & Sales',
    keywords: ['marketing', 'sales'],
  },
  {
    name: 'System Support & Infrastructure',
    keywords: ['support', 'infrastructure'],
  },
  {
    name: 'System Analysis & Design, Application Support',
    keywords: ['analysis', 'design', 'application support', 'system analysis'],
  },
  {
    name: 'System Development',
    keywords: ['development', 'developer'],
  },
];

function normalizeGroups(rawGroups: Group[]): Group[] {
  return [...rawGroups].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });
}

function deriveGroupsFromMembers(members: Member[]): Group[] {
  const groupsMap = new Map<string, Group>();

  const lowerIncludes = (source: string | undefined, keyword: string) =>
    !!source && source.toLowerCase().includes(keyword.toLowerCase());

  const othersKey = 'Others';

  for (const member of members) {
    const candidateSource =
      typeof member.position === 'string'
        ? member.position
        : typeof member.name === 'string'
        ? member.name
        : '';

    let matchedGroupName: string | null = null;

    for (const config of GROUP_KEYWORD_CONFIG) {
      if (config.keywords.some((kw) => lowerIncludes(candidateSource, kw))) {
        matchedGroupName = config.name;
        break;
      }
    }

    if (!matchedGroupName) {
      matchedGroupName = othersKey;
    }

    if (!groupsMap.has(matchedGroupName)) {
      groupsMap.set(matchedGroupName, {
        name: matchedGroupName,
        members: [],
      });
    }

    groupsMap.get(matchedGroupName)!.members.push(member);
  }

  // Ensure config order priority, then any remaining groups (like Others)
  const ordered: Group[] = [];

  for (const cfg of GROUP_KEYWORD_CONFIG) {
    const group = groupsMap.get(cfg.name);
    if (group && group.members.length > 0) {
      ordered.push(group);
      groupsMap.delete(cfg.name);
    }
  }

  const remaining = Array.from(groupsMap.values()).filter(
    (g) => g.members.length > 0
  );

  // Put "Others" at the very end if it exists.
  remaining.sort((a, b) => {
    if (a.name === othersKey) return 1;
    if (b.name === othersKey) return -1;
    return a.name.localeCompare(b.name);
  });

  ordered.push(...remaining);

  return ordered;
}

function buildTeamLayout({
  featuredMember,
  groups,
}: {
  featuredMember: Member | null;
  groups: Group[];
}): TeamLayout {
  const normalized = normalizeGroups(groups).slice(0, 5);

  // Remove featured member from any group so they don't duplicate.
  const cleanedGroups: Group[] = normalized.map((group) => ({
    ...group,
    members: featuredMember
      ? group.members.filter((m) => m.id !== featuredMember.id)
      : [...group.members],
  }));

  const takeFromGroup = (groupIndex: number, count: number): Slot[] => {
    const group = cleanedGroups[groupIndex];
    const slots: Slot[] = [];

    for (let i = 0; i < count; i += 1) {
      const member = group?.members[i];
      if (member) {
        slots.push({ type: 'member', member });
      } else {
        slots.push({ type: 'empty' });
      }
    }

    
    if (group) {
      group.members = group.members.slice(count);
    }

    return slots;
  };

  
  const row1: Slot[] = [];
  if (featuredMember) {
    row1.push({ type: 'member', member: featuredMember, variant: 'boss' });
  } else {
    row1.push({ type: 'empty' });
  }
  row1.push(...takeFromGroup(0, 3)); 
  row1.push(...takeFromGroup(1, 1)); 

  
  while (row1.length < 5) {
    row1.push({ type: 'empty' });
  }
  if (row1.length > 5) {
    row1.length = 5;
  }

  
  const row2: Slot[] = [];
  row2.push(...takeFromGroup(2, 2)); 
  row2.push(...takeFromGroup(3, 4)); 

  while (row2.length < 6) {
    row2.push({ type: 'empty' });
  }
  if (row2.length > 6) {
    row2.length = 6;
  }

  
  const row3: Slot[] = [];
  row3.push(...takeFromGroup(4, 5)); 
  while (row3.length < 5) {
    row3.push({ type: 'empty' });
  }
  if (row3.length > 5) {
    row3.length = 5;
  }

  return { row1, row2, row3 };
}

function TeamMemberCard({
  member,
  overlayHidden,
  active,
  onToggleActive,
}: {
  member: Member;
  overlayHidden?: boolean;
  active?: boolean;
  onToggleActive?: () => void;
}) {
  const src = resolveImageSrc(member.image);

  const showOverlay = overlayHidden && (active || false);

  return (
    <div
      className="relative group/card outline-none focus:outline-none focus-visible:outline-none"
      onClick={(e) => {
        e.stopPropagation();
        onToggleActive?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggleActive?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${member.name}, ${member.position}`}
    >
      <div
        className="relative h-[200px] w-[165px] rounded-[24px] overflow-visible shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
        style={{
          background: 'linear-gradient(202.54deg, #FFFFFF 6.1%, #A9C9E0 28.37%, #5393C1 50.65%, #062092 95.19%)',
        }}
      >
        {}
        <div className="absolute inset-0 z-0 rounded-[24px] pointer-events-none overflow-hidden">
          <img
            src="/isgraynew.png"
            alt=""
            aria-hidden
            className="absolute h-full w-full object-contain"
            style={{
              left: `${TEAM_CARD_LOGO.left}%`,
              top: `${TEAM_CARD_LOGO.top}%`,
              transform: `translate(-50%, -50%) scale(${TEAM_CARD_LOGO.scale})`,
              opacity: TEAM_CARD_LOGO.opacity,
            }}
          />
        </div>
        {src ? (
          <div className="absolute inset-0 z-[1] flex items-end justify-center overflow-visible">
            <Image
              src={src}
              alt={member.name}
              width={220}
              height={240}
              className="rounded-[24px] object-contain outline-none"
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
          <div className="absolute inset-0 z-[1] flex h-full items-center justify-center" />
        )}

        {}
        <div
          className={`absolute inset-0 rounded-[24px] bg-gradient-to-b from-transparent via-transparent to-[#0D1E66] flex flex-col justify-end p-3 z-10 transition-opacity duration-300 pointer-events-none ${
            !overlayHidden ? 'opacity-0 pointer-events-none' : showOverlay ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
          }`}
        >
          <div
            className={`${encodeSansExpanded.className} text-white text-[18px] md:text-[20px] font-bold leading-tight mb-0.5`}
          >
            {member.name}
          </div>
          <div className="text-[10px] font-normal uppercase text-white">
            {member.position}
          </div>
        </div>
      </div>
    </div>
  );
}

function BossMemberCard({
  member,
  overlayHidden,
  active,
  onToggleActive,
}: {
  member: Member;
  overlayHidden?: boolean;
  active?: boolean;
  onToggleActive?: () => void;
}) {
  const src = resolveImageSrc(member.image);
  const showOverlay = overlayHidden && (active || false);

  
  const boardCardGradient =
    'linear-gradient(to top right, #920608 0%, #C16553 35%, #E0C5A9 70%, #FFFFFF 100%)';

  return (
    <div
      className="relative group/card outline-none focus:outline-none focus-visible:outline-none"
      onClick={(e) => {
        e.stopPropagation();
        onToggleActive?.();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggleActive?.();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${member.name}, ${member.position}`}
    >
      <div
        className="relative h-[240px] w-[200px] rounded-[24px] overflow-visible shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
        style={{ background: boardCardGradient }}
      >
        {}
        <div className="absolute inset-0 z-0 rounded-[24px] pointer-events-none overflow-hidden">
          <img
            src="/isgraynew.png"
            alt=""
            aria-hidden
            className="absolute h-full w-full object-contain"
            style={{
              left: `${TEAM_CARD_LOGO.left}%`,
              top: `${TEAM_CARD_LOGO.top}%`,
              transform: `translate(-50%, -50%) scale(${TEAM_CARD_LOGO.scale})`,
              opacity: TEAM_CARD_LOGO.opacity,
            }}
          />
        </div>
        {src ? (
          <div className="absolute inset-0 z-[1] flex items-end justify-center overflow-visible">
            <Image
              src={src}
              alt={member.name}
              width={176}
              height={280}
              className="rounded-[24px] object-contain outline-none"
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
          <div className="absolute inset-0 z-[1] flex h-full items-center justify-center" />
        )}

        <div
          className={`absolute inset-0 rounded-[24px] bg-gradient-to-b from-transparent via-transparent to-[#0D1E66] flex flex-col justify-end p-4 z-10 transition-opacity duration-300 pointer-events-none ${
            !overlayHidden ? 'opacity-0 pointer-events-none' : showOverlay ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'
          }`}
        >
          <div
            className={`${encodeSansExpanded.className} text-white text-[20px] md:text-[22px] font-bold leading-tight mb-1`}
          >
            {member.name}
          </div>
          <div className="text-[11px] font-normal uppercase text-white">
            {member.position}
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupTraySegment({
  slots,
  groupName,
}: {
  slots: Slot[];
  groupName?: string;
}) {
  const [coverHidden, setCoverHidden] = useState(false);
  const [trayHovered, setTrayHovered] = useState(false);
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const memberSlots = slots.filter(
    (slot): slot is Extract<typeof slot, { type: 'member' }> => slot.type === 'member'
  );
  if (memberSlots.length === 0) return null;

  const overlayHidden = coverHidden || trayHovered;

  const handleTrayClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-card]')) return;
    setCoverHidden((prev) => !prev);
  }, []);

  const handleCardToggle = useCallback((memberId: number) => {
    setActiveCardId((prev) => (prev === memberId ? null : memberId));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current == null) return;
      const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
      const diff = endX - touchStartX.current;
      const threshold = 40;

      if (Math.abs(diff) > threshold) {
        if (diff < 0 && activeIndex < memberSlots.length - 1) {
          setActiveIndex((prev) => Math.min(prev + 1, memberSlots.length - 1));
        } else if (diff > 0 && activeIndex > 0) {
          setActiveIndex((prev) => Math.max(prev - 1, 0));
        }
      }
      touchStartX.current = null;
    },
    [activeIndex, memberSlots.length]
  );

  return (
    <>
      {}
      <div className="md:hidden">
        <div className="relative w-full space-y-2">
          {}
          <div className="px-6">
            <div
              className="relative mx-auto flex h-[52px] w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#2E5C97] via-[#3B6FAB] to-[#2E5C97] shadow-[0_6px_14px_rgba(0,0,0,0.20)]"
            >
              <span
                className={`${encodeSansExpanded.className} relative z-10 px-4 text-center text-[15px] font-semibold leading-[110%] text-white`}
              >
                {groupName ?? '\u2014'}
              </span>
            </div>
          </div>

          {
}
          <div
            className="relative mt-6 h-[240px] w-full touch-pan-x"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {memberSlots.map((slot, index) => {
              const offset = index - activeIndex; 
              if (Math.abs(offset) > 2) return null; 

              const isActive = offset === 0;
              const baseTranslate = 90; 
              const translateX = offset * baseTranslate;
              const scale = isActive ? 1 : 0.85;
              const opacity = isActive ? 1 : 0.45;
              const zIndexCard = 10 - Math.abs(offset);

              return (
                <div
                  key={slot.member.id}
                  className="absolute left-1/2 top-0"
                  style={{
                    transform: `translateX(calc(-50% + ${translateX}px)) translateY(${
                      isActive ? '0px' : '10px'
                    }) scale(${scale})`,
                    transition:
                      'transform 220ms ease-out, opacity 220ms ease-out, box-shadow 220ms ease-out',
                    opacity,
                    zIndex: zIndexCard,
                  }}
                >
                  <div className="relative mx-auto w-fit overflow-visible">
                    <div data-card className="relative">
                      <TeamMemberCard
                        member={slot.member}
                        overlayHidden
                        active={activeCardId === slot.member.id}
                        onToggleActive={() => handleCardToggle(slot.member.id)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      <div
        className="group/tray relative hidden flex-shrink-0 items-stretch overflow-visible md:flex"
        onClick={handleTrayClick}
        onMouseEnter={() => setTrayHovered(true)}
        onMouseLeave={() => setTrayHovered(false)}
      >
        <div className="relative flex w-fit flex-shrink-0 flex-wrap gap-4 self-start rounded-[32px] bg-[#3B6FAB]/50 px-4 py-5 shadow-[0_12px_30px_rgba(0,0,0,0.15)] backdrop-blur-sm overflow-visible">
          {}
          <div
            className={`absolute inset-0 z-20 rounded-[32px] bg-gradient-to-b from-[#408DE6] to-[#303F58] transition-opacity duration-300 ${
              overlayHidden ? 'opacity-0 pointer-events-none' : 'opacity-[0.35] group-hover/tray:opacity-0 group-hover/tray:pointer-events-none'
            }`}
          />
          {}
          <div
            className={`absolute inset-0 z-30 flex items-center justify-center overflow-hidden rounded-[32px] px-5 py-4 pointer-events-none transition-opacity duration-300 ${
              overlayHidden ? 'opacity-0' : 'opacity-100 group-hover/tray:opacity-0'
            }`}
          >
            <span
              className={`${encodeSansExpanded.className} max-w-full text-center text-[20px] font-semibold leading-[100%] text-white break-words`}
            >
              {groupName ?? '\u2014'}
            </span>
          </div>

          <div className="relative z-10 flex flex-wrap gap-4 overflow-visible">
            {memberSlots.map((slot) => (
              <div key={slot.member.id} data-card className="flex-shrink-0">
                <TeamMemberCard
                  member={slot.member}
                  overlayHidden={overlayHidden}
                  active={activeCardId === slot.member.id}
                  onToggleActive={() => handleCardToggle(slot.member.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TeamRowInner({
  rowIndex,
  slots,
  isVisible,
  groups,
}: {
  rowIndex: number;
  slots: Slot[];
  isVisible: boolean;
  groups: Group[];
}) {
  const [bossActive, setBossActive] = useState(false);
  const animationClass = rowIndex === 1 ? 'slide-right-row' : 'slide-left-row';

  if (rowIndex === 0) {
    const bossSlot = slots[0];
    const groupAName = groups[0]?.name;
    const groupBName = groups[1]?.name;
    const groupASlots = slots.slice(1, 4);
    const groupBSlots = slots.slice(4, 5);

    return (
      <div
        className={`mx-auto flex w-full max-w-6xl justify-center ${animationClass} ${
          isVisible ? 'animate' : 'opacity-0'
        }`}
      >
        <div className="flex flex-wrap items-end justify-center gap-2 md:gap-6">
          {bossSlot?.type === 'member' && bossSlot.variant === 'boss' && (
            <div className="flex-shrink-0">
              <BossMemberCard
                member={bossSlot.member}
                overlayHidden
                active={bossActive}
                onToggleActive={() => setBossActive((prev) => !prev)}
              />
            </div>
          )}
          <GroupTraySegment slots={groupASlots} groupName={groupAName} />
          <GroupTraySegment slots={groupBSlots} groupName={groupBName} />
        </div>
      </div>
    );
  }

  if (rowIndex === 1) {
    const groupCName = groups[2]?.name;
    const groupDName = groups[3]?.name;
    const groupCSlots = slots.slice(0, 2);
    const groupDSlots = slots.slice(2, 6);

    return (
      <div
        className={`mx-auto flex w-full max-w-6xl items-start justify-center gap-2 md:gap-6 ${animationClass} ${
          isVisible ? 'animate' : 'opacity-0'
        }`}
      >
        <GroupTraySegment slots={groupCSlots} groupName={groupCName} />
        <GroupTraySegment slots={groupDSlots} groupName={groupDName} />
      </div>
    );
  }

  const groupEName = groups[4]?.name;
  const groupESlots = slots.slice(0, 5);

  return (
    <div
      className={`mx-auto flex w-full max-w-6xl items-start justify-center gap-6 ${animationClass} ${
        isVisible ? 'animate' : 'opacity-0'
      }`}
    >
      <GroupTraySegment slots={groupESlots} groupName={groupEName} />
    </div>
  );
}

const TeamRow = memo(TeamRowInner);

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [featuredMember, setFeaturedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        
        try {
          const groupsResponse = await fetch('/api/admin/team-groups');
          if (groupsResponse.ok) {
            const data = (await groupsResponse.json()) as TeamGroupsApiResponse;

            const allMembers = [
              ...data.groups.flatMap((g) => g.members ?? []),
              ...(data.ungrouped ?? []),
            ];

            
            const hasValidName = (m: Member) =>
              typeof m.name === 'string' && m.name.trim() !== '';
            const filteredMembers = allMembers
              .filter((m) => hasValidName(m))
              .sort((a, b) => a.displayOrder - b.displayOrder);

            let featured: Member | null = null;
            if (typeof data.featuredMemberId === 'number') {
              const found = filteredMembers.find(
                (m) => m.id === data.featuredMemberId
              );
              if (found) featured = found;
            }

            const hydratedGroups: Group[] = data.groups.map((g) => ({
              id: g.id,
              name: g.name,
              displayOrder: g.displayOrder,
              members: (g.members ?? [])
                .filter((member) =>
                  filteredMembers.some((fm) => fm.id === member.id)
                )
                .sort((a, b) => {
                  const ao = (a as Member).groupOrder ?? a.displayOrder ?? 0;
                  const bo = (b as Member).groupOrder ?? b.displayOrder ?? 0;
                  return typeof ao === 'number' && typeof bo === 'number' ? ao - bo : 0;
                }),
            }));

            setMembers(filteredMembers);
            setGroups(hydratedGroups);
            setFeaturedMember(featured);
            return;
          }
        } catch (error) {
          
          console.warn('Optional /api/admin/team-groups failed, falling back.', error);
        }

        const response = await fetch('/api/admin/team');
        if (!response.ok) {
          throw new Error(`Failed to fetch /api/admin/team: ${response.status}`);
        }

        const data = (await response.json()) as Member[];

        const sortedData = data.sort(
          (a, b) => a.displayOrder - b.displayOrder
        );

        const hasValidNameFallback = (m: Member) =>
          typeof m.name === 'string' && m.name.trim() !== '';
        const filteredData = sortedData.filter((m) => hasValidNameFallback(m));

        const fallbackFeatured = filteredData[0] ?? null;
        const derivedGroups = deriveGroupsFromMembers(filteredData);

        setMembers(filteredData);
        setGroups(derivedGroups);
        setFeaturedMember(fallbackFeatured);
      } catch (error) {
        console.error('Error fetching team members:', error);
        setMembers([]);
        setGroups([]);
        setFeaturedMember(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, []);

  const hasAnyMemberSlot =
    members.length > 0 && groups.some((g) => g.members.length > 0);

  const layout = useMemo(
    () =>
      hasAnyMemberSlot
        ? buildTeamLayout({ featuredMember, groups })
        : { row1: [] as Slot[], row2: [] as Slot[], row3: [] as Slot[] },
    [hasAnyMemberSlot, featuredMember, groups]
  );

  const anySlotHasMember =
    layout.row1.some((s) => s.type === 'member') ||
    layout.row2.some((s) => s.type === 'member') ||
    layout.row3.some((s) => s.type === 'member');

  return (
    <section
      id="team"
      ref={sectionRef}
      aria-label="Our Team"
      className="team-watermark relative min-h-screen bg-[#D7E1E4] py-16"
    >
      {}
      <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
        {}
        <div className="mx-auto mb-10 w-full max-w-5xl overflow-hidden rounded-2xl">
          <div className="flex h-[60px] items-center justify-center bg-gradient-to-r from-transparent via-[#0D1E66] to-transparent">
            <h2 className="text-center font-sans text-4xl font-semibold text-white md:text-5xl">
              Our Team
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loading message="Loading team members" size="lg" />
          </div>
        ) : !anySlotHasMember ? (
          <div className="py-16 text-center">
            <p className="text-lg text-gray-600">No team members to display</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-4" style={{ contain: 'layout' }}>
            <TeamRow rowIndex={0} slots={layout.row1} isVisible={isVisible} groups={groups} />
            <TeamRow rowIndex={1} slots={layout.row2} isVisible={isVisible} groups={groups} />
            <TeamRow rowIndex={2} slots={layout.row3} isVisible={isVisible} groups={groups} />
          </div>
        )}
      </div>
    </section>
  );
}
