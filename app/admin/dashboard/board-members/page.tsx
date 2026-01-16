'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
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

type BoardMember = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  displayOrder: number;
};

export default function BoardMembersPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [footerText, setFooterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [savingFooter, setSavingFooter] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
    fetchBoardSettings();
  }, []);

  const fetchBoardSettings = async () => {
    try {
      const response = await fetch('/api/admin/board-settings');
      if (response.ok) {
        const data = await response.json();
        setFooterText(data.footerText);
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
      setMembers(data);
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
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Board of Directors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your board members and their information.
          </p>
        </div>
        <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Board Member
        </Button>
      </div>

      {/* Footer Text Setting */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Section Footer Text</CardTitle>
          <CardDescription>
            Customize the text displayed at the bottom of the Board of Directors section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <HtmlTips />
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Textarea
                id="footerText"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="iSynergies Inc.'s elected Board of Directors for the year 2025 - 2026"
                className="min-h-[80px]"
              />
            </div>
            <Button onClick={handleSaveFooterText} disabled={savingFooter}>
              {savingFooter ? 'Saving...' : 'Save Footer Text'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      <div>
          {members.length === 0 ? (
            <Card className="rounded-xl border border-border bg-white p-12 shadow-sm">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 text-gray-800">
                  <Plus className="h-full w-full" />
                </div>
                <h3 className="mb-1 text-lg font-medium text-gray-800">No board members yet</h3>
                <p className="text-sm text-gray-800">Get started by adding your first board member</p>
              </div>
            </Card>
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

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingMember ? 'Edit Board Member' : 'Add Board Member'}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="dialog-image">Photo</Label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData({ ...formData, image: url })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-firstName">First Name</Label>
            <Input
              id="dialog-firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-lastName">Last Name</Label>
            <Input
              id="dialog-lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Enter last name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-position">Position</Label>
            <Input
              id="dialog-position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
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
                setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 });
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
