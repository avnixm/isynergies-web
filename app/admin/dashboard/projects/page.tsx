'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select } from '@/app/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';

type Project = {
  id: number;
  title: string;
  year: string;
  subtitle: string;
  description: string;
  category: string;
  thumbnail: string | null;
  screenshot1: string | null;
  screenshot2: string | null;
  screenshot3: string | null;
  screenshot4: string | null;
  displayOrder: number;
};

export default function ProjectsPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear().toString(),
    subtitle: '',
    description: '',
    category: 'desktop',
    thumbnail: '',
    screenshot1: '',
    screenshot2: '',
    screenshot3: '',
    screenshot4: '',
    displayOrder: 0,
  });

  // Get all used order numbers (excluding the one being edited)
  const usedOrders = projects
    .filter(p => p.id !== editingId)
    .map(p => p.displayOrder);

  // Get next available order
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) {
      order++;
    }
    return order;
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/admin/projects');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    // Validate order number
    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const url = editingId ? `/api/admin/projects/${editingId}` : '/api/admin/projects';
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
        toast.success(editingId ? 'Project updated successfully!' : 'Project added successfully!');
        fetchProjects();
        resetForm();
      } else {
        toast.error('Failed to save project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setFormData({
      title: project.title,
      year: project.year,
      subtitle: project.subtitle,
      description: project.description,
      category: project.category,
      thumbnail: project.thumbnail || '',
      screenshot1: project.screenshot1 || '',
      screenshot2: project.screenshot2 || '',
      screenshot3: project.screenshot3 || '',
      screenshot4: project.screenshot4 || '',
      displayOrder: project.displayOrder,
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this project? This action cannot be undone.',
      'Delete Project'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Project deleted successfully!');
        fetchProjects();
      } else {
        toast.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setOrderError('');
    setFormData({
      title: '',
      year: new Date().getFullYear().toString(),
      subtitle: '',
      description: '',
      category: 'desktop',
      thumbnail: '',
      screenshot1: '',
      screenshot2: '',
      screenshot3: '',
      screenshot4: '',
      displayOrder: getNextAvailableOrder(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading projects" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage your portfolio and project showcase.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto rounded-xl border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {editingId ? 'Edit Project' : 'Add New Project'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="eCompacct"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="2026"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="tools">Tools</option>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Lorem ipsum dolor sit amet"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px]"
                    placeholder="Project description..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail</Label>
                  <ImageUpload
                    value={formData.thumbnail}
                    onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Screenshots</Label>
                  <div className="space-y-3">
                    <ImageUpload
                      value={formData.screenshot1}
                      onChange={(url) => setFormData({ ...formData, screenshot1: url })}
                    />
                    <ImageUpload
                      value={formData.screenshot2}
                      onChange={(url) => setFormData({ ...formData, screenshot2: url })}
                    />
                    <ImageUpload
                      value={formData.screenshot3}
                      onChange={(url) => setFormData({ ...formData, screenshot3: url })}
                    />
                    <ImageUpload
                      value={formData.screenshot4}
                      onChange={(url) => setFormData({ ...formData, screenshot4: url })}
                    />
                  </div>
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
                  {orderError && (
                    <p className="text-xs text-red-600">{orderError}</p>
                  )}
                  <p className="text-xs text-gray-800">
                    Used orders: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'}
                    <br />
                    Next available: {getNextAvailableOrder()}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Update' : 'Add'}
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

        {/* List */}
        <div className="lg:col-span-2">
          {projects.length === 0 ? (
            <Card className="rounded-xl border border-border bg-white p-12 shadow-sm">
              <div className="text-center">
                <Plus className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                <h3 className="mb-1 text-lg font-medium text-gray-800">No projects yet</h3>
                <p className="text-sm text-gray-800">Get started by adding your first project</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800">{project.title}</h3>
                            <p className="text-sm text-gray-800">{project.subtitle}</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{project.category}</span>
                        </div>
                        <p className="mb-2 text-sm text-gray-800">{project.year}</p>
                        <p className="mb-3 line-clamp-2 text-sm text-gray-800">{project.description}</p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(project.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
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

