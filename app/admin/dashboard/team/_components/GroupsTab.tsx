'use client';

import { useMemo } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import { useSortable, arrayMove, rectSortingStrategy, SortableContext } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/app/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { GripVertical, MoreHorizontal, Pencil, Trash2, User } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { resolveImageSrc } from '@/app/lib/resolve-image-src';

export type GroupsTabMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder: number;
  groupId?: number | null;
  groupOrder?: number | null;
};

export type GroupsTabGroup = {
  id: number;
  name: string;
  displayOrder: number;
  members: GroupsTabMember[];
};

type GroupsTabProps = {
  ungrouped: GroupsTabMember[];
  groups: GroupsTabGroup[];
  onAssignToGroup: (member: GroupsTabMember, newGroupId: number | null) => void;
  onMoveMemberInGroup: (
    groupId: number | null,
    member: GroupsTabMember,
    direction: 'up' | 'down'
  ) => void;
  onReorderInGroup: (groupId: number, orderedMembers: GroupsTabMember[]) => void;
  onReorderUngrouped: (orderedMembers: GroupsTabMember[]) => void;
  onRenameGroup: (g: GroupsTabGroup) => void;
  onDeleteGroup: (g: GroupsTabGroup) => void;
  onMoveGroup: (g: GroupsTabGroup, direction: 'up' | 'down') => void;
  assigningMemberId: number | null;
  movingMemberId: number | null;
};

const COLUMN_ID_UNGROUPED = 'ungrouped';

function MemberCard({
  member,
  groups,
  sourceColumnId,
  onAssign,
  onMoveUp,
  onMoveDown,
  isAssigning,
  isMoving,
  isDragging,
  setNodeRef,
  setActivatorNodeRef,
  dragListeners,
  dragAttributes,
  style,
}: {
  member: GroupsTabMember;
  groups: GroupsTabGroup[];
  sourceColumnId: string;
  onAssign: (newGroupId: number | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isAssigning: boolean;
  isMoving: boolean;
  isDragging: boolean;
  setNodeRef: (el: HTMLElement | null) => void;
  setActivatorNodeRef: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
  style?: React.CSSProperties;
}) {
  const src = resolveImageSrc(member.image) ?? '';
  const groupId = sourceColumnId === COLUMN_ID_UNGROUPED ? null : parseInt(sourceColumnId.replace('group-', ''), 10);
  const targetGroups = groups;
  const listeners = dragListeners ?? {};
  const attrs = dragAttributes ?? {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 shadow-sm transition-shadow',
        isDragging && 'opacity-60 shadow-md',
        'hover:border-primary/30 hover:shadow'
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to move"
        {...(listeners as React.HTMLAttributes<HTMLButtonElement>)}
        {...(attrs as React.HTMLAttributes<HTMLButtonElement>)}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.position}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
          aria-label="Actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={isAssigning || sourceColumnId === COLUMN_ID_UNGROUPED}
            onClick={() => onAssign(null)}
          >
            Move to Ungrouped
          </DropdownMenuItem>
          {targetGroups.map((g) => (
            <DropdownMenuItem
              key={g.id}
              disabled={isAssigning || member.groupId === g.id}
              onClick={() => onAssign(g.id)}
            >
              Move to {g.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem disabled className="text-muted-foreground">
            — Reorder —
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isMoving} onClick={onMoveUp}>
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isMoving} onClick={onMoveDown}>
            Move down
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}


function SortableMemberCard({
  member,
  groups,
  sourceColumnId,
  onAssign,
  onMoveUp,
  onMoveDown,
  isAssigning,
  isMoving,
}: {
  member: GroupsTabMember;
  groups: GroupsTabGroup[];
  sourceColumnId: string;
  onAssign: (newGroupId: number | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isAssigning: boolean;
  isMoving: boolean;
}) {
  const id = `member-${member.id}`;
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id,
    data: { member, sourceColumnId },
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <MemberCard
      member={member}
      groups={groups}
      sourceColumnId={sourceColumnId}
      onAssign={onAssign}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isAssigning={isAssigning}
      isMoving={isMoving}
      isDragging={isDragging}
      setNodeRef={setNodeRef}
      setActivatorNodeRef={setActivatorNodeRef}
      dragListeners={listeners as unknown as Record<string, unknown>}
      dragAttributes={attributes as unknown as Record<string, unknown>}
      style={style}
    />
  );
}

function GroupColumn({
  columnId,
  title,
  count,
  members,
  sortedGroups,
  onAssignToGroup,
  onMoveMemberInGroup,
  onRenameGroup,
  onDeleteGroup,
  onMoveGroup,
  assigningMemberId,
  movingMemberId,
  isGroup,
  group,
}: {
  columnId: string;
  title: string;
  count: number;
  members: GroupsTabMember[];
  sortedGroups: GroupsTabGroup[];
  onAssignToGroup: (m: GroupsTabMember, gid: number | null) => void;
  onMoveMemberInGroup: (gid: number | null, m: GroupsTabMember, dir: 'up' | 'down') => void;
  onRenameGroup: (g: GroupsTabGroup) => void;
  onDeleteGroup: (g: GroupsTabGroup) => void;
  onMoveGroup: (g: GroupsTabGroup, dir: 'up' | 'down') => void;
  assigningMemberId: number | null;
  movingMemberId: number | null;
  isGroup: boolean;
  group: GroupsTabGroup | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const groupId = columnId === COLUMN_ID_UNGROUPED ? null : parseInt(columnId.replace('group-', ''), 10);
  const sorted = useMemo(() => {
    if (groupId === null) {
      return [...members].sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return [...members].sort((a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0));
  }, [members, groupId]);
  const itemIds = useMemo(() => sorted.map((m) => `member-${m.id}`), [sorted]);

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-xl border-2 transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{count} member{count !== 1 ? 's' : ''}</p>
        </div>
        {isGroup && group && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
              aria-label="Group actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onRenameGroup(group)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteGroup(group)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMoveGroup(group, 'up')}>
                Move group up
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMoveGroup(group, 'down')}>
                Move group down
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="min-h-[120px] p-4">
        {sorted.length === 0 ? (
          <div
            className={cn(
              'flex min-h-[120px] flex-col items-center justify-center rounded-lg border-2 border-dashed py-8 text-center',
              isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/10'
            )}
          >
            <p className="text-sm text-muted-foreground">
              {isOver ? 'Drop here' : 'Drag members here'}
            </p>
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((m) => (
                <SortableMemberCard
                  key={m.id}
                  member={m}
                  groups={sortedGroups}
                  sourceColumnId={columnId}
                  onAssign={(gid) => onAssignToGroup(m, gid)}
                  onMoveUp={() => onMoveMemberInGroup(groupId, m, 'up')}
                  onMoveDown={() => onMoveMemberInGroup(groupId, m, 'down')}
                  isAssigning={assigningMemberId === m.id}
                  isMoving={movingMemberId === m.id}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </Card>
  );
}

function getColumnIdForMember(
  memberId: number,
  ungrouped: GroupsTabMember[],
  groups: GroupsTabGroup[]
): string {
  if (ungrouped.some((m) => m.id === memberId)) return COLUMN_ID_UNGROUPED;
  const g = groups.find((gr) => gr.members.some((m) => m.id === memberId));
  return g ? `group-${g.id}` : COLUMN_ID_UNGROUPED;
}

export function GroupsTab({
  ungrouped,
  groups,
  onAssignToGroup,
  onMoveMemberInGroup,
  onReorderInGroup,
  onReorderUngrouped,
  onRenameGroup,
  onDeleteGroup,
  onMoveGroup,
  assigningMemberId,
  movingMemberId,
}: GroupsTabProps) {
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.displayOrder - b.displayOrder),
    [groups]
  );
  const sortedUngrouped = useMemo(
    () => [...ungrouped].sort((a, b) => a.displayOrder - b.displayOrder),
    [ungrouped]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const data = active.data.current as { member: GroupsTabMember; sourceColumnId: string } | undefined;
    if (!data?.member) return;
    const sourceId = data.sourceColumnId;
    const overId = String(over.id);

    if (overId.startsWith('member-')) {
      const overMemberId = parseInt(overId.replace('member-', ''), 10);
      if (Number.isNaN(overMemberId)) return;
      const targetColumnId = getColumnIdForMember(overMemberId, sortedUngrouped, sortedGroups);
      if (targetColumnId === sourceId) {
        const list = sourceId === COLUMN_ID_UNGROUPED
          ? sortedUngrouped
          : [...(sortedGroups.find((g) => `group-${g.id}` === sourceId)?.members ?? [])].sort(
              (a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0)
            );
        const oldIndex = list.findIndex((m) => m.id === data.member.id);
        const newIndex = list.findIndex((m) => m.id === overMemberId);
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
        const reordered = arrayMove(list, oldIndex, newIndex);
        if (sourceId === COLUMN_ID_UNGROUPED) {
          onReorderUngrouped(reordered);
        } else {
          const gid = parseInt(sourceId.replace('group-', ''), 10);
          if (!Number.isNaN(gid)) onReorderInGroup(gid, reordered);
        }
        return;
      }
      const newGroupId = targetColumnId === COLUMN_ID_UNGROUPED ? null : parseInt(targetColumnId.replace('group-', ''), 10);
      onAssignToGroup(data.member, newGroupId);
      return;
    }

    if (sourceId === overId) return;
    if (overId !== COLUMN_ID_UNGROUPED && !overId.startsWith('group-')) return;
    const newGroupId = overId === COLUMN_ID_UNGROUPED ? null : parseInt(overId.replace('group-', ''), 10);
    if (overId.startsWith('group-') && (newGroupId === null || Number.isNaN(newGroupId))) return;
    onAssignToGroup(data.member, newGroupId);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Drag members between sections to assign. Use the menu on each card to move or reorder. Add groups from the header.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-4">
          <GroupColumn
            columnId={COLUMN_ID_UNGROUPED}
            title="Ungrouped"
            count={sortedUngrouped.length}
            members={sortedUngrouped}
            sortedGroups={sortedGroups}
            onAssignToGroup={onAssignToGroup}
            onMoveMemberInGroup={onMoveMemberInGroup}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
            onMoveGroup={onMoveGroup}
            assigningMemberId={assigningMemberId}
            movingMemberId={movingMemberId}
            isGroup={false}
            group={null}
          />
          {sortedGroups.map((g) => (
            <GroupColumn
              key={g.id}
              columnId={`group-${g.id}`}
              title={g.name}
              count={g.members.length}
              members={g.members}
              sortedGroups={sortedGroups}
              onAssignToGroup={onAssignToGroup}
              onMoveMemberInGroup={onMoveMemberInGroup}
              onRenameGroup={onRenameGroup}
              onDeleteGroup={onDeleteGroup}
              onMoveGroup={onMoveGroup}
              assigningMemberId={assigningMemberId}
              movingMemberId={movingMemberId}
              isGroup
              group={g}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
