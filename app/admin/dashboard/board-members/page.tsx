'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import { StickyFooter } from '../_components/sticky-footer';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
import { User } from 'lucide-react';
import { useDraftPersistence } from '@/app/lib/use-draft-persistence';
import { DraftRestorePrompt } from '@/app/components/ui/draft-restore-prompt';
import { getCached, setCached } from '../_lib/cache';

type BoardMember = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  displayOrder: number;
};

type BoardMemberFormData = {
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  displayOrder: number;
};

export default function BoardMembersPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const pathname = usePathname();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [footerText, setFooterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [savingFooter, setSavingFooter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BoardMemberFormData>({
    firstName: '',
    lastName: '',
    position: '',
    image: '',
    displayOrder: 0,
  });

  const draftEntityId = editingMember?.id ?? 'new';
  const { showRestorePrompt, draftMeta, saveDraft, clearDraft, restoreDraft, dismissDraft } = useDraftPersistence<BoardMemberFormData>({
    entity: 'board-member',
    id: draftEntityId,
    route: pathname,
    debounceMs: 500,
  });

  const handleFormChange = useCallback((updates: Partial<BoardMemberFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      if (isDialogOpen && (newData.firstName.trim() || newData.lastName.trim() || newData.position.trim())) {
        saveDraft(newData);
      }
      return newData;
    });
  }, [isDialogOpen, saveDraft]);

  const handleRestoreDraft = useCallback(() => {
    const restored = restoreDraft();
    if (restored) {
      setFormData(restored);
      setEditingMember(null);
      if (!isDialogOpen) setIsDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [restoreDraft, toast, isDialogOpen]);

  const handleDismissDraft = useCallback(() => dismissDraft(), [dismissDraft]);

  const usedOrders = members.filter(m => m.id !== editingMember?.id).map(m => m.displayOrder);
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) { order++; }
    return order;
  };

  useEffect(() => {
    const membersCache = getCached<BoardMember[]>('admin-board-members-list');
    const settingsCache = getCached<{ footerText: string }>('admin-board-settings');
    if (membersCache != null && settingsCache != null) {
      setMembers(membersCache);
      setFooterText(settingsCache.footerText ?? '');
      setLoading(false);
      return;
    }
    fetchMembers();
    fetchBoardSettings();
  }, []);

  const fetchBoardSettings = async () => {
    try {
      const response = await fetch('/api/admin/board-settings');
      if (response.ok) {
        const data = await response.json();
        setFooterText(data.footerText);
        setCached('admin-board-settings', { footerText: data.footerText ?? '' });
      }
    } catch (error) {
      console.error('Error fetching board settings:', error);
    }
  };

  const handleSaveFooterText = async () => {
    setSavingFooter(true);
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/board-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ footerText }),
      });

      if (response.ok) {
        toast.success('Footer text updated successfully!');
      } else {
        toast.error('Failed to save footer text');
      }
    } catch (error) {
      console.error('Error saving footer text:', error);
      toast.error('Failed to save footer text');
    } finally {
      setSavingFooter(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/admin/board-members');
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setMembers(list);
      setCached('admin-board-members-list', list);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching board members:', error);
      setLoading(false);
    }
  };

  const handleOpenAddDialog = () => {
    setEditingMember(null);
    setFormData({
      firstName: '',
      lastName: '',
      position: '',
      image: '',
      displayOrder: getNextAvailableOrder(),
    });
    setOrderError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (member: BoardMember) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      position: member.position,
      image: member.image,
      displayOrder: member.displayOrder,
    });
    setOrderError('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setFormData({
      firstName: '',
      lastName: '',
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

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.position.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('admin_token');

    try {
      const url = editingMember
        ? `/api/admin/board-members/${editingMember.id}`
        : '/api/admin/board-members';
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
        clearDraft();
        toast.success(editingMember ? 'Board member updated successfully!' : 'Board member added successfully!');
        handleCloseDialog();
        fetchMembers();
      } else {
        toast.error('Failed to save board member');
      }
    } catch (error) {
      console.error('Error saving board member:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this board member? This action cannot be undone.',
      'Delete Board Member'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/board-members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Board member deleted successfully!');
        fetchMembers();
      } else {
        toast.error('Failed to delete board member');
      }
    } catch (error) {
      console.error('Error deleting board member:', error);
      toast.error('An error occurred while deleting');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading board members" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Board of Directors</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your board members and their information.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          <a href="#footer-text" className="text-accent hover:underline">Footer Text</a>
          <a href="#board-members" className="text-accent hover:underline">Board Members</a>
        </div>
      </div>

      <form id="board-members-form" onSubmit={(e) => { e.preventDefault(); handleSaveFooterText(); }} className="space-y-8">
        {}
        <Card id="footer-text" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Section Footer Text</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Customize the text displayed at the bottom of the Board of Directors section
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="max-w-4xl space-y-6">
              {}
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
                <Label htmlFor="footerText">Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="iSynergies Inc.'s elected Board of Directors for the year 2025 - 2026"
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {}
      <Card id="board-members" className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Board Members</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage board members and their information
            </p>
          </div>
          <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Board Member
          </Button>
        </div>
        <div className="p-6">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No board members yet</h3>
              <p className="text-sm text-muted-foreground">Get started by adding your first board member</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {members.map((member) => {
                const imageUrl = typeof member.image === 'string' && (member.image.startsWith('/api/images/') || member.image.startsWith('http'))
                  ? member.image 
                  : `/api/images/${member.image}`;
                return (
                  <Card key={member.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md group">
                    <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200">
                      {member.image ? (
                        <img
                          src={imageUrl}
                          alt={`${member.firstName} ${member.lastName}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-gray-800/60">
                          <User className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <div className="w-full space-y-1">
                          <p className="text-white font-semibold text-sm">{member.firstName} {member.lastName}</p>
                          <p className="text-white/90 text-xs">{member.position}</p>
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                          Order: {member.displayOrder}
                        </span>
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
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {}
      <StickyFooter formId="board-members-form" saving={savingFooter} />

      {!isDialogOpen && showRestorePrompt && draftMeta && (
        <DraftRestorePrompt savedAt={draftMeta.savedAt} onRestore={handleRestoreDraft} onDismiss={handleDismissDraft} />
      )}

      {}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => { if (!open) handleCloseDialog(); else setIsDialogOpen(true); }}
        title={editingMember ? 'Edit Board Member' : 'Add Board Member'}
      >
        <div className="space-y-4 mb-6">
          {showRestorePrompt && draftMeta && (
            <DraftRestorePrompt savedAt={draftMeta.savedAt} onRestore={handleRestoreDraft} onDismiss={handleDismissDraft} />
          )}

          <div className="space-y-2">
            <Label htmlFor="dialog-image">Photo</Label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => handleFormChange({ image: url })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-firstName">First Name</Label>
            <Input
              id="dialog-firstName"
              value={formData.firstName}
              onChange={(e) => handleFormChange({ firstName: e.target.value })}
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-lastName">Last Name</Label>
            <Input
              id="dialog-lastName"
              value={formData.lastName}
              onChange={(e) => handleFormChange({ lastName: e.target.value })}
              placeholder="Enter last name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-position">Position</Label>
            <Input
              id="dialog-position"
              value={formData.position}
              onChange={(e) => handleFormChange({ position: e.target.value })}
              placeholder="e.g., President"
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
                handleFormChange({ displayOrder: parseInt(e.target.value) || 0 });
                setOrderError('');
              }}
              placeholder="0"
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
    </div>
  );
}
