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

function resolveImageSrc(image: string | null): string {
  if (!image) return '';
  if (typeof image === 'string' && (image.startsWith('/api/images/') || image.startsWith('http'))) {
    return image;
  }
  return `/api/images/${image}`;
}

export function MembersTabCard({ member, onEdit, onDelete }: MembersTabCardProps) {
  const src = resolveImageSrc(member.image);

  return (
    <Card className="group flex rounded-xl border border-border bg-white shadow-sm transition-shadow hover:border-primary/20 hover:shadow-md">
      {/* 100×80 whole-image preview with hover + iS gray watermark */}
      <div
        className="relative h-20 w-[100px] shrink-0 overflow-hidden rounded-l-xl bg-[length:12px_12px] bg-[linear-gradient(45deg,_#f0f0f0_25%,_transparent_25%,_transparent_75%,_#f0f0f0_75%),_linear-gradient(-45deg,_#f0f0f0_25%,_transparent_25%,_transparent_75%,_#f0f0f0_75%)]"
        style={{ minWidth: 100, minHeight: 80 }}
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img
            src="/logos/iSgray.png"
            alt=""
            aria-hidden
            className="max-h-[55%] max-w-[55%] object-contain opacity-[0.35]"
          />
        </div>
        {src ? (
          <img
            src={src}
            alt={member.name}
            className="relative z-10 h-full w-full object-contain object-center transition-transform duration-200 group-hover:scale-110"
          />
        ) : (
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
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
