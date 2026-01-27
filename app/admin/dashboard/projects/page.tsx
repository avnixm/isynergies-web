'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Select } from '@/app/components/ui/select';
import { Card, CardContent } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'desktop' | 'mobile' | 'tools'>('all');
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
    .filter(p => p.id !== editingProject?.id)
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

  const handleOpenAddDialog = () => {
    setEditingProject(null);
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
    setOrderError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (project: Project) => {
    setEditingProject(project);
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
    setOrderError('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
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
    setOrderError('');
  };

  const handleSave = async () => {
    setOrderError('');

    // Validate order number
    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    if (!formData.title.trim() || !formData.subtitle.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('admin_token');

    try {
      const url = editingProject ? `/api/admin/projects/${editingProject.id}` : '/api/admin/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingProject ? 'Project updated successfully!' : 'Project added successfully!');
        handleCloseDialog();
        fetchProjects();
      } else {
        toast.error('Failed to save project');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading projects" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your portfolio and project showcase.
        </p>
      </div>

      {/* Projects Section */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit, or remove projects from your portfolio
            </p>
          </div>
          <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Project
          </Button>
        </div>
        <div className="p-6">
          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <nav className="flex gap-1" aria-label="Project categories">
              {(['all', 'desktop', 'mobile', 'tools'] as const).map((tab) => {
                const tabLabels: Record<typeof tab, string> = {
                  all: 'All Projects',
                  desktop: 'Desktop/Web',
                  mobile: 'Mobile',
                  tools: 'Tools',
                };
                const count = tab === 'all' 
                  ? projects.length 
                  : projects.filter(p => p.category === tab).length;
                
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      relative px-4 py-2 text-sm font-medium transition-colors
                      border-b-2 -mb-[1px]
                      ${activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                      }
                    `}
                  >
                    {tabLabels[tab]}
                    {count > 0 && (
                      <span className={`
                        ml-2 px-2 py-0.5 text-xs rounded-full
                        ${activeTab === tab
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Filtered Projects List */}
          {(() => {
            const filteredProjects = activeTab === 'all'
              ? projects
              : projects.filter(p => p.category === activeTab);

            if (filteredProjects.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                    <Plus className="h-full w-full" />
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-foreground">
                    {activeTab === 'all' ? 'No projects yet' : `No ${activeTab} projects yet`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'all' 
                      ? 'Get started by adding your first project'
                      : `Get started by adding a ${activeTab} project`
                    }
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const getImageUrl = (imageId: string | null) => {
                    if (!imageId) return null;
                    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
                      return imageId;
                    }
                    return `/api/images/${imageId}`;
                  };

                  const thumbnailUrl = getImageUrl(project.thumbnail);
                  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
                    desktop: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                    mobile: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                    tools: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                  };
                  const categoryColor = categoryColors[project.category] || categoryColors.desktop;

                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
                        {thumbnailUrl ? (
                          <Image
                            src={thumbnailUrl}
                            alt={project.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <span className="text-2xl">📁</span>
                          </div>
                        )}
                      </div>

                      {/* Project Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {project.title}
                          </p>
                          <span className={`
                            inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border
                            ${categoryColor.bg} ${categoryColor.text} ${categoryColor.border}
                          `}>
                            {project.category === 'desktop' ? 'Desktop/Web' : project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.subtitle}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{project.year}</span>
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Order: {project.displayOrder}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(project)}
                          className="h-9"
                          aria-label={`Edit ${project.title}`}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(project.id)}
                          className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${project.title}`}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingProject ? 'Edit Project' : 'Add New Project'}
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 mb-6">
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
            <Label htmlFor="dialog-title">Project Title</Label>
            <Input
              id="dialog-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="eCompacct"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-year">Year</Label>
              <Input
                id="dialog-year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2026"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-category">Category</Label>
              <Select
                id="dialog-category"
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
            <Label htmlFor="dialog-subtitle">Subtitle</Label>
            <Input
              id="dialog-subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Lorem ipsum dolor sit amet"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-description">Description</Label>
            <Textarea
              id="dialog-description"
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
            {orderError && (
              <p className="text-xs text-red-600">{orderError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used orders: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'}
              <br />
              Next available: {getNextAvailableOrder()}
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
            {saving ? 'Saving...' : editingProject ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

