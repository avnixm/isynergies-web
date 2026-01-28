'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Select } from '@/app/components/ui/select';
import { Plus } from 'lucide-react';
import { MembersTabCard } from './MembersTabCard';
import { cn } from '@/app/lib/utils';

export type SortOption = 'displayOrder' | 'name';
export type MembersFilter = 'all' | 'hasImage' | 'missingOrder';

export type MembersTabMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder: number;
};

const FILTER_OPTIONS: { value: MembersFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'hasImage', label: 'Has Image' },
  { value: 'missingOrder', label: 'Missing Order' },
];

type MembersTabProps = {
  members: MembersTabMember[];
  filteredAndSorted: MembersTabMember[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  sortBy: SortOption;
  onSortChange: (v: SortOption) => void;
  filter: MembersFilter;
  onFilterChange: (v: MembersFilter) => void;
  onAddMember: () => void;
  onEdit: (m: MembersTabMember) => void;
  onDelete: (id: number) => void;
  onClearFilters: () => void;
};

export function MembersTab({
  members,
  filteredAndSorted,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filter,
  onFilterChange,
  onAddMember,
  onEdit,
  onDelete,
  onClearFilters,
}: MembersTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            placeholder="Search members…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs sm:max-w-sm"
            aria-label="Search team members"
          />
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onFilterChange(opt.value)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  filter === opt.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}
              >
                {opt.label}
              </button>
            ))}
            <div className="flex items-center gap-2">
              <label htmlFor="team-sort" className="shrink-0 text-sm text-muted-foreground">
                Sort
              </label>
              <Select
                id="team-sort"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value as SortOption)}
                className="h-9 w-[160px]"
              >
                <option value="name">Name A–Z</option>
                <option value="displayOrder">Display Order (asc)</option>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {members.length === 0 ? (
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="mb-1 text-lg font-medium text-foreground">No team members yet.</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Get started by adding your first team member.
            </p>
            <Button size="lg" onClick={onAddMember} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      ) : filteredAndSorted.length === 0 ? (
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="mb-1 text-lg font-medium text-foreground">No members match your filters.</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Try a different search, filter, or sort.
            </p>
            <Button variant="outline" onClick={onClearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSorted.map((member) => (
            <MembersTabCard
              key={member.id}
              member={member}
              onEdit={() => onEdit(member)}
              onDelete={() => onDelete(member.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
