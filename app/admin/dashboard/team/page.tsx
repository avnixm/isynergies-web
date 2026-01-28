'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Info } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { Select } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { TeamPageHeader } from './_components/TeamPageHeader';
import { MembersTab, type SortOption, type MembersFilter } from './_components/MembersTab';
import { GroupsTab } from './_components/GroupsTab';
import { FeaturedTabPanel } from './_components/FeaturedTabPanel';
import { LayoutPreviewTab } from './_components/LayoutPreviewTab';

type TeamMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder: number;
  groupId?: number | null;
  groupOrder?: number | null;
  isFeatured?: boolean;
};

type GroupWithMembers = {
  id: number;
  name: string;
  displayOrder: number;
  members: TeamMember[];
};

type TeamGroupsData = {
  featuredMemberId: number | null;
  groups: GroupWithMembers[];
  ungrouped: TeamMember[];
};

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('admin_token') ?? '';
}

export default function TeamPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsData, setGroupsData] = useState<TeamGroupsData | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    image: '',
    displayOrder: 0,
  });
  // Group builder state
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', displayOrder: 0 });
  const [savingGroup, setSavingGroup] = useState(false);
  const [assigningMemberId, setAssigningMemberId] = useState<number | null>(null);
  const [movingMemberId, setMovingMemberId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('displayOrder');
  const [membersFilter, setMembersFilter] = useState<MembersFilter>('all');

  const filteredAndSortedMembers = useMemo(() => {
    let list = members;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.position.toLowerCase().includes(q)
      );
    }
    if (membersFilter === 'hasImage') {
      list = list.filter((m) => m.image != null && String(m.image).trim() !== '');
    } else if (membersFilter === 'missingOrder') {
      const duplicateOrders = new Set<number>();
      const orderCounts = new Map<number, number>();
      members.forEach((m) => orderCounts.set(m.displayOrder, (orderCounts.get(m.displayOrder) ?? 0) + 1));
      orderCounts.forEach((count, order) => { if (count > 1) duplicateOrders.add(order); });
      list = list.filter((m) => duplicateOrders.has(m.displayOrder));
    }
    if (sortBy === 'name') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list = [...list].sort((a, b) => a.displayOrder - b.displayOrder);
    }
    return list;
  }, [members, searchQuery, sortBy, membersFilter]);

  const usedOrders = members.filter(m => m.id !== editingMember?.id).map(m => m.displayOrder);
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) { order++; }
    return order;
  };

  const allMembersForDropdown = groupsData
    ? [...groupsData.ungrouped, ...groupsData.groups.flatMap((g) => g.members)]
    : [];
  const nextGroupDisplayOrder = groupsData
    ? Math.max(-1, ...groupsData.groups.map((g) => g.displayOrder)) + 1
    : 0;

  useEffect(() => {
    fetchMembers();
    fetchTeamGroups();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/team');
      const data = await response.json();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamGroups = async () => {
    try {
      const response = await fetch('/api/admin/team-groups');
      if (response.ok) {
        const data: TeamGroupsData = await response.json();
        setGroupsData(data);
      } else {
        setGroupsData({ featuredMemberId: null, groups: [], ungrouped: [] });
      }
    } catch (error) {
      console.error('Error fetching team groups:', error);
      setGroupsData({ featuredMemberId: null, groups: [], ungrouped: [] });
    } finally {
      setLoadingGroups(false);
    }
  };

  const refetchAll = () => {
    fetchMembers();
    fetchTeamGroups();
  };

  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      position: '',
      image: '',
      displayOrder: getNextAvailableOrder(),
    });
    setOrderError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      position: member.position,
      image: member.image || '',
      displayOrder: member.displayOrder,
    });
    setOrderError('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData({
      name: '',
      position: '',
      image: '',
      displayOrder: getNextAvailableOrder(),
    });
    setOrderError('');
  };

  const handleSave = async () => {
    setOrderError('');

    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    if (!formData.name.trim() || !formData.position.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('admin_token');

    try {
      const url = editingMember ? `/api/admin/team/${editingMember.id}` : '/api/admin/team';
      const method = editingMember ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingMember ? 'Team member updated successfully!' : 'Team member added successfully!');
        handleCloseDialog();
        refetchAll();
      } else {
        toast.error('Failed to save team member');
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      'This will remove the member from the website.',
      'Delete team member?'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Team member deleted successfully!');
        refetchAll();
      } else {
        toast.error('Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('An error occurred while deleting');
    }
  };

  // --- Group builder handlers ---
  const handleSetFeatured = async (memberId: number | null) => {
    const token = getToken();
    try {
      const res = await fetch('/api/admin/team-groups/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ memberId }),
      });
      if (res.ok) {
        toast.success(memberId ? 'Featured member updated' : 'Featured member cleared');
        fetchTeamGroups();
      } else toast.error('Failed to set featured member');
    } catch (e) {
      toast.error('Failed to set featured member');
    }
  };

  const handleOpenAddGroup = () => {
    setEditingGroupId(null);
    setGroupFormData({ name: '', displayOrder: groupsData ? nextGroupDisplayOrder : 0 });
    setIsGroupDialogOpen(true);
  };

  const handleOpenRenameGroup = (g: GroupWithMembers) => {
    setEditingGroupId(g.id);
    setGroupFormData({ name: g.name, displayOrder: g.displayOrder });
    setIsGroupDialogOpen(true);
  };

  const handleCloseGroupDialog = () => {
    setIsGroupDialogOpen(false);
    setEditingGroupId(null);
  };

  const handleGroupDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setIsGroupDialogOpen(false);
      setEditingGroupId(null);
    }
  }, []);

  const handleSaveGroup = async () => {
    if (!groupFormData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setSavingGroup(true);
    const token = getToken();
    try {
      if (editingGroupId !== null) {
        const res = await fetch(`/api/admin/team-groups/${editingGroupId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(groupFormData),
        });
        if (res.ok) {
          toast.success('Group updated');
          handleCloseGroupDialog();
          fetchTeamGroups();
        } else toast.error('Failed to update group');
      } else {
        const res = await fetch('/api/admin/team-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(groupFormData),
        });
        if (res.ok) {
          toast.success('Group created');
          handleCloseGroupDialog();
          fetchTeamGroups();
        } else toast.error('Failed to create group');
      }
    } catch (e) {
      toast.error('Failed to save group');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (g: GroupWithMembers) => {
    const ok = await confirm(
      `Delete group "${g.name}"? Members will become ungrouped.`,
      'Delete Group'
    );
    if (!ok) return;
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/team-groups/${g.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Group deleted');
        fetchTeamGroups();
        fetchMembers();
      } else toast.error('Failed to delete group');
    } catch (e) {
      toast.error('Failed to delete group');
    }
  };

  const handleMoveGroup = async (g: GroupWithMembers, direction: 'up' | 'down') => {
    const list = groupsData?.groups ?? [];
    const idx = list.findIndex((x) => x.id === g.id);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const other = list[swapIdx];
    const token = getToken();
    try {
      await fetch(`/api/admin/team-groups/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayOrder: other.displayOrder }),
      });
      await fetch(`/api/admin/team-groups/${other.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ displayOrder: g.displayOrder }),
      });
      toast.success('Order updated');
      fetchTeamGroups();
    } catch (e) {
      toast.error('Failed to reorder');
    }
  };

  const handleAssignToGroup = async (member: TeamMember, newGroupId: number | null) => {
    setAssigningMemberId(member.id);
    const token = getToken();
    try {
      if (newGroupId === null) {
        const res = await fetch(`/api/admin/team/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ groupId: null, groupOrder: null }),
        });
        if (res.ok) {
          toast.success('Member ungrouped');
          fetchTeamGroups();
          fetchMembers();
        } else toast.error('Failed to update');
        return;
      }
      const targetGroup = groupsData?.groups.find((x) => x.id === newGroupId);
      if (!targetGroup) return;
      const newMembers = [
        ...targetGroup.members.map((m, i) => ({ memberId: m.id, groupOrder: i })),
        { memberId: member.id, groupOrder: targetGroup.members.length },
      ];
      let res = await fetch(`/api/admin/team-groups/${newGroupId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ members: newMembers }),
      });
      if (!res.ok) {
        toast.error('Failed to assign to group');
        return;
      }
      if (member.groupId != null && member.groupId !== newGroupId) {
        const fromGroup = groupsData?.groups.find((x) => x.id === member.groupId);
        if (fromGroup) {
          const without = fromGroup.members
            .filter((m) => m.id !== member.id)
            .map((m, i) => ({ memberId: m.id, groupOrder: i }));
          await fetch(`/api/admin/team-groups/${member.groupId}/members`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ members: without }),
          });
        }
      }
      toast.success('Member assigned');
      fetchTeamGroups();
      fetchMembers();
    } catch (e) {
      toast.error('Failed to assign');
    } finally {
      setAssigningMemberId(null);
    }
  };

  const handleMoveMemberInGroup = async (
    groupId: number | null,
    member: TeamMember,
    direction: 'up' | 'down'
  ) => {
    setMovingMemberId(member.id);
    const token = getToken();
    try {
      if (groupId === null) {
        const list = [...(groupsData?.ungrouped ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
        const idx = list.findIndex((m) => m.id === member.id);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= list.length) return;
        const other = list[swapIdx];
        await fetch(`/api/admin/team/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ displayOrder: other.displayOrder }),
        });
        await fetch(`/api/admin/team/${other.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ displayOrder: member.displayOrder }),
        });
        toast.success('Order updated');
        fetchTeamGroups();
        fetchMembers();
        return;
      }
      const g = groupsData?.groups.find((x) => x.id === groupId);
      if (!g) return;
      const list = [...g.members].sort((a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0));
      const idx = list.findIndex((m) => m.id === member.id);
      if (idx < 0) return;
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= list.length) return;
      const reordered = [...list];
      [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
      const membersPayload = reordered.map((m, i) => ({ memberId: m.id, groupOrder: i }));
      const res = await fetch(`/api/admin/team-groups/${groupId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ members: membersPayload }),
      });
      if (res.ok) {
        toast.success('Order updated');
        fetchTeamGroups();
      } else toast.error('Failed to reorder');
    } catch (e) {
      toast.error('Failed to reorder');
    } finally {
      setMovingMemberId(null);
    }
  };

  const handleReorderInGroup = async (groupId: number, orderedMembers: TeamMember[]) => {
    const token = getToken();
    try {
      const membersPayload = orderedMembers.map((m, i) => ({ memberId: m.id, groupOrder: i }));
      const res = await fetch(`/api/admin/team-groups/${groupId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ members: membersPayload }),
      });
      if (res.ok) {
        toast.success('Order updated');
        fetchTeamGroups();
      } else toast.error('Failed to reorder');
    } catch (e) {
      toast.error('Failed to reorder');
    }
  };

  const handleReorderUngrouped = async (orderedMembers: TeamMember[]) => {
    const token = getToken();
    try {
      await Promise.all(
        orderedMembers.map((m, i) =>
          fetch(`/api/admin/team/${m.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ displayOrder: i }),
          })
        )
      );
      toast.success('Order updated');
      fetchTeamGroups();
      fetchMembers();
    } catch (e) {
      toast.error('Failed to reorder');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loading message="Loading team members…" size="lg" />
      </div>
    );
  }

  const validMembersCount = members.filter((m) => typeof m.name === 'string' && m.name.trim() !== '').length;
  const ungroupedCount = groupsData?.ungrouped?.length ?? 0;

  return (
    <div className="space-y-6 -mt-6 pt-4 md:-mt-8 md:pt-5">
      <TeamPageHeader onAddMember={handleOpenAddDialog} onAddGroup={handleOpenAddGroup} />

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full flex-wrap gap-1 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <MembersTab
            members={members}
            filteredAndSorted={filteredAndSortedMembers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filter={membersFilter}
            onFilterChange={setMembersFilter}
            onAddMember={handleOpenAddDialog}
            onEdit={handleOpenEditDialog}
            onDelete={handleDelete}
            onClearFilters={() => { setSearchQuery(''); setMembersFilter('all'); }}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          {!loadingGroups && groupsData ? (
            <GroupsTab
              ungrouped={groupsData.ungrouped ?? []}
              groups={groupsData.groups ?? []}
              onAssignToGroup={handleAssignToGroup}
              onMoveMemberInGroup={handleMoveMemberInGroup}
              onReorderInGroup={handleReorderInGroup}
              onReorderUngrouped={handleReorderUngrouped}
              onRenameGroup={handleOpenRenameGroup}
              onDeleteGroup={handleDeleteGroup}
              onMoveGroup={handleMoveGroup}
              assigningMemberId={assigningMemberId}
              movingMemberId={movingMemberId}
            />
          ) : (
            <Card className="rounded-xl border border-border bg-white shadow-sm">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Loading groups…
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="featured" className="mt-4">
          {!loadingGroups && groupsData ? (
            <FeaturedTabPanel
              featuredMemberId={groupsData.featuredMemberId}
              onFeaturedChange={handleSetFeatured}
              members={allMembersForDropdown}
            />
          ) : (
            <Card className="rounded-xl border border-border bg-white shadow-sm">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Loading…
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <LayoutPreviewTab
            groups={groupsData?.groups ?? []}
            ungrouped={groupsData?.ungrouped ?? []}
            featuredMemberId={groupsData?.featuredMemberId ?? null}
            ungroupedCount={ungroupedCount}
            validMembersCount={validMembersCount}
          />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
        footer={
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingMember ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-2">
            <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <div className="text-xs leading-relaxed text-muted-foreground">
              <strong className="font-medium">Tip:</strong> You can use HTML tags for formatting:{' '}
              <code className="rounded bg-background px-1 py-0.5 text-xs">&lt;strong&gt;</code>,{' '}
              <code className="rounded bg-background px-1 py-0.5 text-xs">&lt;em&gt;</code>,{' '}
              <code className="rounded bg-background px-1 py-0.5 text-xs">&lt;br&gt;</code>,{' '}
              <code className="rounded bg-background px-1 py-0.5 text-xs">&lt;p&gt;</code>, etc.
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-[1fr,1.5fr]">
            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-name">Full Name</Label>
                <Input
                  id="dialog-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-position">Position</Label>
                <Input
                  id="dialog-position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Software Developer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-displayOrder">Display Order</Label>
                <Input
                  id="dialog-displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => {
                    setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 });
                    setOrderError('');
                  }}
                  className={orderError ? 'border-red-500' : ''}
                />
                {orderError && <p className="text-xs text-red-600">{orderError}</p>}
                <p className="text-xs text-muted-foreground">
                  Used: {[...usedOrders].sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableOrder()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Add/Rename Group Dialog */}
      <Dialog
        open={isGroupDialogOpen}
        onOpenChange={handleGroupDialogOpenChange}
        title={editingGroupId ? 'Rename Group' : 'Add Group'}
        footer={
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={handleCloseGroupDialog} disabled={savingGroup}>
              Cancel
            </Button>
            <Button onClick={handleSaveGroup} disabled={savingGroup}>
              {savingGroup ? 'Saving...' : editingGroupId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={groupFormData.name}
              onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
              placeholder="e.g. Finance, Admin & Accounting"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-displayOrder">Display order</Label>
            <Input
              id="group-displayOrder"
              type="number"
              value={groupFormData.displayOrder}
              onChange={(e) =>
                setGroupFormData({ ...groupFormData, displayOrder: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

