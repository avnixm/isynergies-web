'use client';

import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, User } from 'lucide-react';
import { resolveImageSrc } from '@/app/lib/resolve-image-src';

export type MembersTabCardMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder: number;
};

type MembersTabCardProps = {
  member: MembersTabCardMember;
  onEdit: () => void;
  onDelete: () => void;
};

export function MembersTabCard({ member, onEdit, onDelete }: MembersTabCardProps) {
  const src = resolveImageSrc(member.image) ?? '';

  return (
    <Card className="group flex rounded-xl border border-border bg-white shadow-sm transition-shadow hover:border-primary/20 hover:shadow-md">
      <div
        className="relative h-20 w-[100px] shrink-0 overflow-hidden rounded-l-xl"
        style={{
          minWidth: 100,
          minHeight: 80,
          background: 'linear-gradient(202.54deg, #FFFFFF 6.1%, #A9C9E0 28.37%, #5393C1 50.65%, #062092 95.19%)',
        }}
      >
        {src ? (
          <img
            src={src}
            alt={member.name}
            className="relative z-[1] h-full w-full object-contain object-center transition-transform duration-200 group-hover:scale-110"
          />
        ) : (
          <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <User className="h-6 w-6" aria-hidden />
            <span className="text-[10px] font-medium">No photo</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col border-l border-border">
        <div className="px-3 py-2">
          <p className="line-clamp-1 text-sm font-semibold leading-tight text-foreground" title={member.name}>
            {member.name}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground" title={member.position}>
            {member.position}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-3 py-1.5">
          <Badge variant="secondary" className="text-[10px]">
            Order {member.displayOrder}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-muted">
              <MoreVertical className="h-4 w-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
