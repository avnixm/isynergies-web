'use client';

import { useMemo } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/app/lib/utils';

type PreviewMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder?: number;
  groupOrder?: number | null;
};

type GroupWithMembers = {
  id: number;
  name: string;
  displayOrder: number;
  members: PreviewMember[];
};

type LayoutPreviewTabProps = {
  groups: GroupWithMembers[];
  ungrouped: PreviewMember[];
  featuredMemberId: number | null;
  ungroupedCount: number;
  validMembersCount: number;
};

function resolveImageSrc(image: string | null): string {
  if (!image) return '';
  if (typeof image === 'string' && (image.startsWith('/api/images/') || image.startsWith('http'))) {
    return image;
  }
  return `/api/images/${image}`;
}

type Slot = { type: 'member'; member: PreviewMember; variant?: 'boss' } | { type: 'empty' };

/**
 * Build 5/6/5 layout matching public Team.tsx:
 * Row 1: [1 boss] + [3 Group A] + [1 Group B]
 * Row 2: [2 Group C] + [4 Group D]
 * Row 3: [5 Group E]
 */
function buildLayout(
  groups: GroupWithMembers[],
  featuredMember: PreviewMember | null
): { row1: Slot[]; row2: Slot[]; row3: Slot[] } {
  const normalized = [...groups]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 5)
    .map((g) => ({
      ...g,
      members: featuredMember
        ? g.members.filter((m) => m.id !== featuredMember.id)
        : [...g.members],
    }));

  const sortMembers = (m: PreviewMember[]) =>
    [...m].sort((a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0));

  const g = normalized.map((grp) => ({ ...grp, members: sortMembers(grp.members) }));

  const take = (groupIndex: number, count: number): Slot[] => {
    const list = g[groupIndex]?.members ?? [];
    const out: Slot[] = [];
    for (let i = 0; i < count; i++) {
      const member = list[i];
      out.push(member ? { type: 'member', member } : { type: 'empty' });
    }
    if (g[groupIndex]) g[groupIndex].members = list.slice(count);
    return out;
  };

  const row1: Slot[] = [];
  row1.push(featuredMember ? { type: 'member', member: featuredMember, variant: 'boss' } : { type: 'empty' });
  row1.push(...take(0, 3));
  row1.push(...take(1, 1));
  while (row1.length < 5) row1.push({ type: 'empty' });
  if (row1.length > 5) row1.length = 5;

  const row2: Slot[] = [];
  row2.push(...take(2, 2));
  row2.push(...take(3, 4));
  while (row2.length < 6) row2.push({ type: 'empty' });
  if (row2.length > 6) row2.length = 6;

  const row3: Slot[] = [];
  row3.push(...take(4, 5));
  while (row3.length < 5) row3.push({ type: 'empty' });
  if (row3.length > 5) row3.length = 5;

  return { row1, row2, row3 };
}

export function LayoutPreviewTab({
  groups,
  ungrouped,
  featuredMemberId,
  ungroupedCount,
  validMembersCount,
}: LayoutPreviewTabProps) {
  const featuredMember = useMemo(() => {
    if (featuredMemberId == null) return null;
    for (const m of ungrouped) if (m.id === featuredMemberId) return m;
    for (const g of groups) {
      const found = g.members.find((m) => m.id === featuredMemberId);
      if (found) return found;
    }
    return null;
  }, [featuredMemberId, ungrouped, groups]);

  const { row1, row2, row3 } = useMemo(
    () => buildLayout(groups, featuredMember),
    [groups, featuredMember]
  );

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.displayOrder - b.displayOrder),
    [groups]
  );

  const isGrayWatermark = () => (
    <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
      <img
        src="/logos/iSgray.png"
        alt=""
        aria-hidden
        className="max-h-[65%] max-w-[65%] object-contain opacity-[0.35]"
      />
    </div>
  );

  const SlotView = ({ slot, index }: { slot: Slot; index: number }) => {
    if (slot.type === 'empty') {
      return (
        <div
          className="relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30"
          aria-hidden
        >
          {isGrayWatermark()}
          <span className="relative z-10 text-xs text-muted-foreground">—</span>
        </div>
      );
    }
    const src = resolveImageSrc(slot.member.image);
    const isBoss = slot.variant === 'boss';
    return (
      <div
        className={cn(
          'flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm',
          isBoss ? 'aspect-[4/5] ring-2 ring-primary/50' : 'aspect-square'
        )}
      >
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-t-xl bg-[length:10px_10px] bg-[linear-gradient(45deg,_#f0f0f0_25%,_transparent_25%,_transparent_75%,_#f0f0f0_75%),_linear-gradient(-45deg,_#f0f0f0_25%,_transparent_25%,_transparent_75%,_#f0f0f0_75%)]">
          {isGrayWatermark()}
          {src ? (
            <img src={src} alt="" className="relative z-10 h-full w-full object-contain" />
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-1 text-muted-foreground">
              <User className="h-6 w-6" />
              <span className="text-[10px]">No photo</span>
            </div>
          )}
        </div>
        <div className="truncate border-t border-border bg-muted/30 px-2 py-1 text-center">
          <p className="truncate text-xs font-medium text-foreground" title={slot.member.name}>
            {slot.member.name}
          </p>
          {isBoss && (
            <p className="truncate text-[10px] text-muted-foreground" title={slot.member.position}>
              {slot.member.position}
            </p>
          )}
        </div>
      </div>
    );
  };

  const RowBlock = ({
    title,
    segments,
  }: {
    title: string;
    segments: { label: string; slots: Slot[] }[];
  }) => {
    const total = segments.reduce((s, seg) => s + seg.slots.length, 0);
    return (
      <div className="rounded-xl border-2 border-border bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium text-foreground">{title}</span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {total} slots ({segments.map((s) => s.slots.length).join(' + ')})
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          {segments.map((seg, si) => (
            <div key={si} className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">{seg.label}</span>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${seg.slots.length}, minmax(84px, 1fr))` }}
              >
                {seg.slots.map((slot, i) => (
                  <SlotView key={i} slot={slot} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const g = sortedGroups.slice(0, 5);
  const seg1 = [
    { label: '1 — Featured (Boss)', slots: row1.slice(0, 1) },
    { label: `3 — ${g[0]?.name ?? 'Group A'}`, slots: row1.slice(1, 4) },
    { label: `1 — ${g[1]?.name ?? 'Group B'}`, slots: row1.slice(4, 5) },
  ];
  const seg2 = [
    { label: `2 — ${g[2]?.name ?? 'Group C'}`, slots: row2.slice(0, 2) },
    { label: `4 — ${g[3]?.name ?? 'Group D'}`, slots: row2.slice(2, 6) },
  ];
  const seg3 = [{ label: `5 — ${g[4]?.name ?? 'Group E'}`, slots: row3 }];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-muted-foreground">
          Public layout: Row 1 (1 + 3 + 1) · Row 2 (2 + 4) · Row 3 (5). Valid members: {validMembersCount}. Ungrouped: {ungroupedCount}.
        </p>
      </div>

      <div className="mx-auto max-w-5xl space-y-8">
        <RowBlock title="Row 1" segments={seg1} />
        <RowBlock title="Row 2" segments={seg2} />
        <RowBlock title="Row 3" segments={seg3} />
      </div>

      {sortedGroups.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Groups (semi-transparent overlay on public site)
          </h3>
          <div className="flex flex-wrap gap-2">
            {sortedGroups.map((grp) => (
              <span
                key={grp.id}
                className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {grp.name} · {grp.members.length} members
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
