'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Save, X, Plus, Pencil, Trash2 } from 'lucide-react';
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

type AboutUsContent = {
  title: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  paragraph4: string;
  paragraph5: string;
  missionTitle: string;
  missionText: string;
  visionTitle: string;
  visionText: string;
};

type AboutUsGalleryImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

export default function AboutUsPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState<AboutUsContent>({
    title: '',
    paragraph1: '',
    paragraph2: '',
    paragraph3: '',
    paragraph4: '',
    paragraph5: '',
    missionTitle: '',
    missionText: '',
    visionTitle: '',
    visionText: '',
  });
  const [galleryImages, setGalleryImages] = useState<AboutUsGalleryImage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGalleryImage, setEditingGalleryImage] = useState<AboutUsGalleryImage | null>(null);
  const [savingGallery, setSavingGallery] = useState(false);
  const [galleryFormData, setGalleryFormData] = useState<{ image: string; alt: string; displayOrder: number }>({
    image: '',
    alt: 'About Us gallery image',
    displayOrder: 0,
  });

  useEffect(() => {
    fetchContent();
    fetchGalleryImages();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/about-us');
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error('Error fetching content:', error);
      setMessage({ type: 'error', text: 'Failed to load content' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch('/api/admin/about-us/gallery-images');
      if (!response.ok) return;
      const data = await response.json();
      setGalleryImages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
    }
  };

  const handleOpenAddGalleryDialog = () => {
    setEditingGalleryImage(null);
    const nextOrder = galleryImages.length > 0 
      ? Math.max(...galleryImages.map(img => img.displayOrder)) + 1 
      : 0;
    setGalleryFormData({
      image: '',
      alt: 'About Us gallery image',
      displayOrder: nextOrder,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditGalleryDialog = (image: AboutUsGalleryImage) => {
    setEditingGalleryImage(image);
    setGalleryFormData({
      image: image.image,
      alt: image.alt,
      displayOrder: image.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleCloseGalleryDialog = () => {
    setIsDialogOpen(false);
    setEditingGalleryImage(null);
    setGalleryFormData({
      image: '',
      alt: 'About Us gallery image',
      displayOrder: 0,
    });
  };

  const handleSaveGalleryImage = async () => {
    if (!galleryFormData.image.trim()) {
      toast.error('Please upload an image');
      return;
    }
    if (!galleryFormData.alt.trim()) {
      toast.error('Please enter an alt text');
      return;
    }

    setSavingGallery(true);
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingGalleryImage 
        ? `/api/admin/about-us/gallery-images/${editingGalleryImage.id}`
        : '/api/admin/about-us/gallery-images';
      const method = editingGalleryImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(galleryFormData),
      });

      if (response.ok) {
        toast.success(editingGalleryImage ? 'Gallery image updated successfully!' : 'Gallery image added successfully!');
        handleCloseGalleryDialog();
        await fetchGalleryImages();
      } else {
        toast.error('Failed to save gallery image');
      }
    } catch (error) {
      console.error('Error saving gallery image:', error);
      toast.error('An error occurred while saving gallery image');
    } finally {
      setSavingGallery(false);
    }
  };

  const handleDeleteGalleryImage = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this gallery image? This action cannot be undone.',
      'Delete Gallery Image'
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/about-us/gallery-images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Gallery image deleted successfully!');
        await fetchGalleryImages();
      } else {
        toast.error('Failed to delete gallery image');
      }
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      toast.error('An error occurred while deleting gallery image');
    }
  };

  const getImageUrl = (imageId: string) => {
    if (!imageId) return null;
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http')) {
      return imageId;
    }
    return `/api/images/${imageId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/about-us', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Content updated successfully! Changes are now live on the website.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update content' });
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading About Us content" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">About Us content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the About Us section content that appears on the website.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Gallery Images Section */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <CardTitle>Gallery Images (Scrolling)</CardTitle>
            <CardDescription className="mt-1">
              Add multiple images to scroll infinitely in the About Us section (sorted by displayOrder)
            </CardDescription>
          </div>
          <Button onClick={handleOpenAddGalleryDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Gallery Image
          </Button>
        </div>
        <CardContent className="p-6">
          {galleryImages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No gallery images yet. Add at least 3 for the best scrolling effect.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {galleryImages.map((gi) => {
                const imageUrl = getImageUrl(gi.image);
                return (
                  <Card key={gi.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md group">
                    <div className="relative aspect-video w-full bg-muted/30 rounded-t-xl overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={gi.alt}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                          Order: {gi.displayOrder}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        <span className="font-medium">Alt:</span> {gi.alt}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditGalleryDialog(gi)}
                          className="flex-1"
                          aria-label={`Edit ${gi.alt}`}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGalleryImage(gi.id)}
                          className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${gi.alt}`}
                          type="button"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Main Content</CardTitle>
            <CardDescription>Edit the title and main text paragraphs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <HtmlTips />
            <div className="space-y-2">
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="About Us"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph1">Paragraph 1</Label>
              <Textarea
                id="paragraph1"
                value={formData.paragraph1}
                onChange={(e) => setFormData({ ...formData, paragraph1: e.target.value })}
                placeholder="First paragraph about the company..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph2">Paragraph 2</Label>
              <Textarea
                id="paragraph2"
                value={formData.paragraph2}
                onChange={(e) => setFormData({ ...formData, paragraph2: e.target.value })}
                placeholder="Second paragraph..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph3">Paragraph 3</Label>
              <Textarea
                id="paragraph3"
                value={formData.paragraph3}
                onChange={(e) => setFormData({ ...formData, paragraph3: e.target.value })}
                placeholder="Third paragraph..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph4">Paragraph 4</Label>
              <Textarea
                id="paragraph4"
                value={formData.paragraph4}
                onChange={(e) => setFormData({ ...formData, paragraph4: e.target.value })}
                className="min-h-[100px]"
                placeholder="Fourth paragraph..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph5">Paragraph 5</Label>
              <Textarea
                id="paragraph5"
                value={formData.paragraph5}
                onChange={(e) => setFormData({ ...formData, paragraph5: e.target.value })}
                placeholder="Fifth paragraph..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mission</CardTitle>
              <CardDescription>Edit the mission statement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="missionTitle">Mission Title</Label>
                <Input
                  id="missionTitle"
                  value={formData.missionTitle}
                  onChange={(e) => setFormData({ ...formData, missionTitle: e.target.value })}
                  placeholder="Our Mission"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="missionText">Mission Text</Label>
                <Textarea
                  id="missionText"
                  value={formData.missionText}
                  onChange={(e) => setFormData({ ...formData, missionText: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="To provide..."
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vision</CardTitle>
              <CardDescription>Edit the vision statement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visionTitle">Vision Title</Label>
                <Input
                  id="visionTitle"
                  value={formData.visionTitle}
                  onChange={(e) => setFormData({ ...formData, visionTitle: e.target.value })}
                  placeholder="Our Vision"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visionText">Vision Text</Label>
                <Textarea
                  id="visionText"
                  value={formData.visionText}
                  onChange={(e) => setFormData({ ...formData, visionText: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="A Trusted Partner..."
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Add/Edit Gallery Image Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingGalleryImage ? 'Edit Gallery Image' : 'Add Gallery Image'}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="dialog-gallery-image">Image</Label>
            <ImageUpload
              value={galleryFormData.image}
              onChange={(v) => setGalleryFormData({ ...galleryFormData, image: v })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-gallery-alt">Alt Text</Label>
            <Input
              id="dialog-gallery-alt"
              value={galleryFormData.alt}
              onChange={(e) => setGalleryFormData({ ...galleryFormData, alt: e.target.value })}
              placeholder="About Us gallery image"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-gallery-order">Display Order</Label>
            <Input
              id="dialog-gallery-order"
              type="number"
              value={galleryFormData.displayOrder}
              onChange={(e) => setGalleryFormData({ ...galleryFormData, displayOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseGalleryDialog}
            disabled={savingGallery}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveGalleryImage}
            disabled={savingGallery}
          >
            {savingGallery ? 'Saving...' : editingGalleryImage ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

