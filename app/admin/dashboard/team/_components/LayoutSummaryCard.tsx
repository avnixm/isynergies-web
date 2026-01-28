'use client';

import { Card, CardContent } from '@/app/components/ui/card';

type LayoutSummaryCardProps = {
  validMembersCount: number;
  ungroupedCount: number;
};

export function LayoutSummaryCard({ validMembersCount, ungroupedCount }: LayoutSummaryCardProps) {
  return (
    <Card className="rounded-xl border bg-white shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="text-lg font-medium text-foreground">Public Layout Preview</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Default layout uses 5 / 6 / 5 slots. Only members with name + image appear on the website.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
            Row 1: 5
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
            Row 2: 6
          </span>
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground">
            Row 3: 5
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Ungrouped members won&apos;t appear in group sections.
        </p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Valid members: {validMembersCount}</span>
          <span>Ungrouped: {ungroupedCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
