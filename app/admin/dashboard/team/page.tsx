'use client';

import { useEffect, useState, useCallback } from 'react';
import { Pencil, Trash2, Plus, Info, ChevronUp, ChevronDown } from 'lucide-react';
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
import { User } from 'lucide-react';

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
      'Are you sure you want to delete this team member? This action cannot be undone.',
      'Delete Team Member'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading team members" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Team members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your team members displayed on the website.
        </p>
      </div>

      {/* Featured (Boss) Member */}
      {!loadingGroups && groupsData && (
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardContent className="p-6">
            <Label htmlFor="featured-select" className="text-sm font-medium text-foreground">
              Featured (Boss) Member
            </Label>
            <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
              Shown larger with a red gradient on the public “Our Team” section.
            </p>
            <Select
              id="featured-select"
              value={groupsData.featuredMemberId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                handleSetFeatured(v === '' ? null : parseInt(v, 10));
              }}
              className="max-w-xs"
            >
              <option value="">— None —</option>
              {allMembersForDropdown.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.isFeatured ? '(featured)' : ''}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Team Layout & Groups */}
      {!loadingGroups && groupsData && (
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Team Layout & Groups</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create groups and assign members. Use “Assign to group” and the arrows to reorder.
              </p>
            </div>
            <Button onClick={handleOpenAddGroup} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Group
            </Button>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4 items-start">
              {/* Ungrouped column */}
              <div className="min-w-[200px] rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Ungrouped</h3>
                <div className="space-y-2">
                  {[...(groupsData.ungrouped ?? [])]
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1 rounded border border-border bg-background p-2 text-sm"
                      >
                        <span className="flex-1 truncate" title={m.name}>{m.name}</span>
                        <Select
                          value={m.groupId ?? ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            handleAssignToGroup(m, v === '' ? null : parseInt(v, 10));
                          }}
                          disabled={assigningMemberId === m.id}
                          className="h-8 w-32 text-xs"
                        >
                          <option value="">— Ungrouped —</option>
                          {(groupsData.groups ?? []).map((gr) => (
                            <option key={gr.id} value={gr.id}>{gr.name}</option>
                          ))}
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleMoveMemberInGroup(null, m, 'up')}
                          disabled={movingMemberId === m.id}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleMoveMemberInGroup(null, m, 'down')}
                          disabled={movingMemberId === m.id}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  {(!groupsData.ungrouped || groupsData.ungrouped.length === 0) && (
                    <p className="text-xs text-muted-foreground">No ungrouped members.</p>
                  )}
                </div>
              </div>
              {/* Group columns */}
              {(groupsData.groups ?? [])
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((g) => (
                  <div key={g.id} className="min-w-[220px] rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-1 mb-3 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground truncate flex-1">{g.name}</h3>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenRenameGroup(g)} title="Rename">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={() => handleDeleteGroup(g)} title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMoveGroup(g, 'up')} title="Move up">
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleMoveGroup(g, 'down')} title="Move down">
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {[...(g.members ?? [])]
                        .sort((a, b) => (a.groupOrder ?? 0) - (b.groupOrder ?? 0))
                        .map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1 rounded border border-border bg-background p-2 text-sm"
                          >
                            <span className="flex-1 truncate" title={m.name}>{m.name}</span>
                            <Select
                              value={m.groupId ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                handleAssignToGroup(m, v === '' ? null : parseInt(v, 10));
                              }}
                              disabled={assigningMemberId === m.id}
                              className="h-8 w-28 text-xs"
                            >
                              <option value="">Ungrouped</option>
                              {(groupsData.groups ?? []).map((gr) => (
                                <option key={gr.id} value={gr.id}>{gr.name}</option>
                              ))}
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleMoveMemberInGroup(g.id, m, 'up')}
                              disabled={movingMemberId === m.id}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleMoveMemberInGroup(g.id, m, 'down')}
                              disabled={movingMemberId === m.id}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      {(!g.members || g.members.length === 0) && (
                        <p className="text-xs text-muted-foreground">Empty.</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Team Members Section */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Team Members</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit, or remove team members from your team
            </p>
          </div>
          <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Team Member
          </Button>
        </div>
        <div className="p-6 pb-8">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No team members yet</h3>
              <p className="text-sm text-muted-foreground">Get started by adding your first team member</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md group">
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200">
                    {member.image ? (
                      <img
                        src={typeof member.image === 'string' && (member.image.startsWith('/api/images/') || member.image.startsWith('http'))
                          ? member.image 
                          : `/api/images/${member.image}`}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-gray-800/60">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div className="w-full space-y-1">
                        <p className="text-white font-semibold text-sm">{member.name}</p>
                        <p className="text-white/90 text-xs">{member.position}</p>
                        <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border/50">
                          Order: {member.displayOrder}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(member)} className="flex-1">
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(member.id)} className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600" type="button">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
      >
        <div className="space-y-4 mb-6">
          {/* Compact HTML Tips */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong className="font-medium">Tip:</strong> You can use HTML tags for formatting:{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;strong&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;em&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;br&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;p&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;ul&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;ol&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;li&gt;</code>,{' '}
              <code className="px-1 py-0.5 bg-background rounded text-xs">&lt;a&gt;</code>, and more.
            </div>
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
            />
          </div>

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
              Used: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableOrder()}
            </p>
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : editingMember ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Add/Rename Group Dialog */}
      <Dialog
        open={isGroupDialogOpen}
        onOpenChange={handleGroupDialogOpenChange}
        title={editingGroupId ? 'Rename Group' : 'Add Group'}
      >
        <div className="space-y-4 mb-6">
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
        <DialogFooter className="justify-end">
          <Button variant="outline" onClick={handleCloseGroupDialog} disabled={savingGroup}>
            Cancel
          </Button>
          <Button onClick={handleSaveGroup} disabled={savingGroup}>
            {savingGroup ? 'Saving...' : editingGroupId ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

