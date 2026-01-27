'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
import Image from 'next/image';
import { User } from 'lucide-react';

type TeamMember = {
  id: number;
  name: string;
  position: string;
  image: string | null;
  displayOrder: number;
};

export default function TeamPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
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

  const usedOrders = members.filter(m => m.id !== editingMember?.id).map(m => m.displayOrder);
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) { order++; }
    return order;
  };

  useEffect(() => {
    fetchMembers();
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
        fetchMembers();
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
        fetchMembers();
      } else {
        toast.error('Failed to delete team member');
      }
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('An error occurred while deleting');
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
    </div>
  );
}

