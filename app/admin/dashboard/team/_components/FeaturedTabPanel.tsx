'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Select } from '@/app/components/ui/select';
import { User } from 'lucide-react';
import { resolveImageSrc } from '@/app/lib/resolve-image-src';

export type FeaturedMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
};

type FeaturedTabPanelProps = {
  featuredMemberId: number | null;
  onFeaturedChange: (memberId: number | null) => void;
  members: FeaturedMember[];
};

export function FeaturedTabPanel({
  featuredMemberId,
  onFeaturedChange,
  members,
}: FeaturedTabPanelProps) {
  const featured = featuredMemberId != null ? members.find((m) => m.id === featuredMemberId) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-xl border bg-white shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div>
            <Label htmlFor="featured-select" className="text-base font-medium text-foreground">
              Featured (Boss) Member
            </Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Shown larger with red gradient on the public Our Team section.
            </p>
          </div>
          <Select
            id="featured-select"
            value={featuredMemberId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              onFeaturedChange(v === '' ? null : parseInt(v, 10));
            }}
            className="w-full max-w-sm"
          >
            <option value="">— None —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {featured ? (
            <div className="relative flex aspect-[4/5] max-h-[320px] w-full flex-col overflow-hidden rounded-b-xl bg-gradient-to-br from-red-600 to-red-800">
              <div className="relative flex flex-1 items-center justify-center bg-black/20 overflow-hidden">
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <img
                    src="/isgraynew.png"
                    alt=""
                    aria-hidden
                    className="max-h-[98%] max-w-[98%] object-contain brightness-[0.55] contrast-125"
                  />
                </div>
                {(() => {
                  const src = resolveImageSrc(featured.image);
                  return src ? (
                    <img
                      src={src}
                      alt=""
                      className="relative z-[1] max-h-full max-w-full object-contain object-center"
                    />
                  ) : (
                    <div className="relative z-[1] flex items-center justify-center text-white/80">
                      <User className="h-16 w-16" />
                    </div>
                  );
                })()}
              </div>
              <div className="shrink-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-lg font-semibold text-white truncate">{featured.name}</p>
                <p className="text-sm text-white/90 truncate">{featured.position}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-b-xl border-2 border-dashed border-border bg-muted/30 py-16 text-center">
              <User className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground">No featured member</p>
              <p className="text-xs text-muted-foreground mt-0.5">Select one from the dropdown to preview.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
