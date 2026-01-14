'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import Image from 'next/image';
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [savingFooter, setSavingFooter] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    image: '',
    displayOrder: 0,
  });

  const usedOrders = members.filter(m => m.id !== editingId).map(m => m.displayOrder);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const url = editingId
        ? `/api/admin/board-members/${editingId}`
        : '/api/admin/board-members';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'Board member updated successfully!' : 'Board member added successfully!');
        fetchMembers();
        resetForm();
      } else {
        toast.error('Failed to save board member');
      }
    } catch (error) {
      console.error('Error saving board member:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleEdit = (member: BoardMember) => {
    setEditingId(member.id);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      position: member.position,
      image: member.image,
      displayOrder: member.displayOrder,
    });
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

  const resetForm = () => {
    setEditingId(null);
    setOrderError('');
    setFormData({
      firstName: '',
      lastName: '',
      position: '',
      image: '',
      displayOrder: getNextAvailableOrder(),
    });
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Board of Directors</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage your board members and their information.
        </p>
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
            <div className="space-y-2">
              <Label htmlFor="footerText">Footer Text</Label>
              <Input
                id="footerText"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="iSynergies Inc.'s elected Board of Directors for the year 2025 - 2026"
              />
            </div>
            <Button onClick={handleSaveFooterText} disabled={savingFooter}>
              {savingFooter ? 'Saving...' : 'Save Footer Text'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 rounded-xl border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {editingId ? 'Edit Member' : 'Add New Member'}
              </CardTitle>
              <CardDescription>
                {editingId ? 'Update board member information' : 'Add a new board member to your team'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Photo</Label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="e.g., President"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => {
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) });
                      setOrderError('');
                    }}
                    placeholder="0"
                    className={orderError ? 'border-red-500' : ''}
                  />
                  {orderError && <p className="text-xs text-red-600">{orderError}</p>}
                  <p className="text-xs text-gray-800">
                    Used: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableOrder()}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Update Member' : 'Add Member'}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        <div className="lg:col-span-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                  <div className="relative h-64 w-full bg-gradient-to-br from-blue-50 to-indigo-50">
                    {member.image ? (
                      <Image
                        src={typeof member.image === 'string' && (member.image.startsWith('/api/images/') || member.image.startsWith('http'))
                          ? member.image 
                          : `/api/images/${member.image}`}
                        alt={`${member.firstName} ${member.lastName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <User className="h-12 w-12 text-gray-800/40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="mb-3 text-sm text-gray-800">{member.position}</p>
                    <div className="mb-4 flex items-center justify-between text-xs text-gray-800">
                      <span>Order: {member.displayOrder}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="flex-1"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
