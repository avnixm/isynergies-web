'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Select } from '@/app/components/ui/select';
import { User } from 'lucide-react';

export type BossCardMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  isFeatured?: boolean;
};

type FeaturedBossCardProps = {
  featuredMemberId: number | null;
  onFeaturedChange: (memberId: number | null) => void;
  members: BossCardMember[];
};

function resolveImageSrc(image: string | null): string {
  if (!image) return '';
  if (typeof image === 'string' && (image.startsWith('/api/images/') || image.startsWith('http'))) {
    return image;
  }
  return `/api/images/${image}`;
}

export function FeaturedBossCard({
  featuredMemberId,
  onFeaturedChange,
  members,
}: FeaturedBossCardProps) {
  const featured = featuredMemberId != null ? members.find((m) => m.id === featuredMemberId) : null;

  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-medium text-foreground">Featured (Boss) Member</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Shown larger with a red gradient in the public Our Team section.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex-1 min-w-0">
            <Label htmlFor="featured-select" className="sr-only">
              Featured member
            </Label>
            <Select
              id="featured-select"
              value={featuredMemberId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                onFeaturedChange(v === '' ? null : parseInt(v, 10));
              }}
              className="w-full max-w-xs"
            >
              <option value="">— None —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isFeatured ? '(featured)' : ''}
                </option>
              ))}
            </Select>
          </div>
          {featured && (
            <div className="flex shrink-0 items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                {resolveImageSrc(featured.image) ? (
                  <img
                    src={resolveImageSrc(featured.image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{featured.name}</p>
                <p className="truncate text-xs text-muted-foreground">{featured.position}</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          This does not remove the member from their group.
        </p>
      </CardContent>
    </Card>
  );
}
