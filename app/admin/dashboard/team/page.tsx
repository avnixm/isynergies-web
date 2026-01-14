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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const url = editingId ? `/api/admin/team/${editingId}` : '/api/admin/team';
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
        toast.success(editingId ? 'Team member updated successfully!' : 'Team member added successfully!');
        fetchMembers();
        resetForm();
      } else {
        toast.error('Failed to save team member');
      }
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      position: member.position,
      image: member.image || '',
      displayOrder: member.displayOrder,
    });
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

  const resetForm = () => {
    setEditingId(null);
    setOrderError('');
    setFormData({
      name: '',
      position: '',
      image: '',
      displayOrder: getNextAvailableOrder(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading team members" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Team members</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage your team members displayed on the website.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 rounded-xl border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {editingId ? 'Edit Team Member' : 'Add Team Member'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Photo</Label>
                  <ImageUpload
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Software Developer"
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
                    className={orderError ? 'border-red-500' : ''}
                  />
                  {orderError && <p className="text-xs text-red-600">{orderError}</p>}
                  <p className="text-xs text-gray-800">
                    Used: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableOrder()}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Update' : 'Add Member'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
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
                <Plus className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                <h3 className="mb-1 text-lg font-medium text-gray-800">No team members yet</h3>
                <p className="text-sm text-gray-800">Get started by adding your first team member</p>
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
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(member)} className="flex-1">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-3 w-3" />
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

