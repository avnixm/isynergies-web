'use client';

import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';

type TeamPageHeaderProps = {
  onAddMember: () => void;
  onAddGroup: () => void;
  onFixDatabase?: () => void;
  fixingDatabase?: boolean;
};

export function TeamPageHeader({ onAddMember, onAddGroup, onFixDatabase, fixingDatabase }: TeamPageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 -mx-4 -mt-2 flex flex-col gap-4 border-b border-border bg-background px-4 pb-4 pt-2 sm:flex-row sm:items-end sm:justify-between md:-mx-8 md:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Team</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage profiles and how they appear in the public Our Team section.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {onFixDatabase && (
          <Button
            variant="outline"
            size="default"
            onClick={onFixDatabase}
            disabled={fixingDatabase}
            className="flex items-center gap-2"
          >
            {fixingDatabase ? 'Fixing…' : 'Fix database'}
          </Button>
        )}
        <Button size="default" onClick={onAddMember} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
        <Button variant="outline" size="default" onClick={onAddGroup} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Group
        </Button>
      </div>
    </div>
  );
}
