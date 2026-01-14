'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import Image from 'next/image';

type BoardMember = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  image: string;
  displayOrder: number;
};

export default function BoardMembersPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    position: '',
    image: '',
    displayOrder: 0,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

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
        fetchMembers();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving board member:', error);
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
    if (!confirm('Are you sure you want to delete this board member?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      await fetch(`/api/admin/board-members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchMembers();
    } catch (error) {
      console.error('Error deleting board member:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      firstName: '',
      lastName: '',
      position: '',
      image: '',
      displayOrder: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Board of Directors</h1>
        <p className="text-gray-500 mt-2">Manage your board members and their information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
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
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    placeholder="0"
                  />
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
            <Card className="p-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <Plus className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No board members yet</h3>
                <p className="text-sm text-gray-500">Get started by adding your first board member</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map((member) => (
                <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-64 w-full bg-gradient-to-br from-blue-50 to-indigo-50">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={`${member.firstName} ${member.lastName}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-6xl text-gray-300">👤</div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{member.position}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
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
