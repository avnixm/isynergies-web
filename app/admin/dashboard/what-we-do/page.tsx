'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import Image from 'next/image';

type WhatWeDoContent = {
  mainText: string;
  tagline: string;
};

type WhatWeDoImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

export default function WhatWeDoPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [content, setContent] = useState<WhatWeDoContent>({
    mainText: '',
    tagline: '',
  });
  const [images, setImages] = useState<WhatWeDoImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<WhatWeDoImage | null>(null);
  const [formImage, setFormImage] = useState({
    image: '',
    alt: '',
    displayOrder: 0,
  });
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchImages();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/what-we-do');
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/what-we-do/images');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/what-we-do', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        toast.success('Content updated successfully!');
      } else {
        toast.error('Failed to update content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddImageDialog = () => {
    setEditingImage(null);
    setFormImage({
      image: '',
      alt: '',
      displayOrder: images.length,
    });
    setIsImageDialogOpen(true);
  };

  const handleOpenEditImageDialog = (image: WhatWeDoImage) => {
    setEditingImage(image);
    setFormImage({
      image: image.image,
      alt: image.alt,
      displayOrder: image.displayOrder,
    });
    setIsImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setIsImageDialogOpen(false);
    setEditingImage(null);
    setFormImage({
      image: '',
      alt: '',
      displayOrder: 0,
    });
  };

  const handleSaveImage = async () => {
    if (!formImage.image || (typeof formImage.image === 'string' && !formImage.image.trim())) {
      toast.error('Please select an image');
      return;
    }

    setSavingImage(true);
    const token = localStorage.getItem('admin_token');
    try {
      const url = editingImage
        ? `/api/admin/what-we-do/images/${editingImage.id}`
        : '/api/admin/what-we-do/images';
      const method = editingImage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formImage),
      });

      if (response.ok) {
        toast.success(editingImage ? 'Image updated successfully!' : 'Image added successfully!');
        handleCloseImageDialog();
        fetchImages();
      } else {
        toast.error('Failed to save image');
      }
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingImage(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    const confirmed = await confirm(
      'Delete Image',
      'Are you sure you want to delete this image?'
    );

    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/what-we-do/images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Image deleted successfully!');
        fetchImages();
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const getImageUrl = (imageId: string | null): string => {
    if (!imageId) return '';
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
      return imageId;
    }
    return `/api/images/${imageId}`;
  };

  if (loading) {
    return <Loading message="Loading What We Do content" />;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">What We Do Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the What We Do section images and content
        </p>
      </div>

      {/* Main Content */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Text Content</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit the text content displayed below the images in the What We Do section
            </p>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mainText" className="text-sm font-medium">
              Main Description Text
            </Label>
            <Textarea
              id="mainText"
              value={content.mainText}
              onChange={(e) => setContent({ ...content, mainText: e.target.value })}
              placeholder="Main Text Here"
              rows={6}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              You can use HTML tags like <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;br&gt;</code> for formatting. This is the main block of text displayed below the images.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tagline" className="text-sm font-medium">
              Tagline
            </Label>
            <Input
              id="tagline"
              value={content.tagline}
              onChange={(e) => setContent({ ...content, tagline: e.target.value })}
              placeholder="Our team helps your IT to the next level. We make your IT plans possible."
            />
            <p className="text-xs text-muted-foreground">
              This text will appear as the tagline below the main description
            </p>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSaveContent} disabled={saving}>
              {saving ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Images */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Images</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage images displayed in the What We Do carousel
            </p>
          </div>
          <Button onClick={handleOpenAddImageDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Image
          </Button>
        </div>
        <div className="p-6">
          {images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No images yet. Click "Add Image" to create one.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {images.map((img) => {
                const imageUrl = getImageUrl(img.image);
                return (
                  <Card
                    key={img.id}
                    className="group relative rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                        Order: {img.displayOrder}
                      </span>
                    </div>

                    <div className="relative aspect-video w-full bg-muted/30 rounded-t-xl overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={img.alt}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>

                    <div className="px-4 pt-4 pb-3">
                      <p className="text-sm text-foreground line-clamp-2 pr-12">
                        {img.alt}
                      </p>
                    </div>

                    <div className="mt-3 flex gap-2 px-4 pb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditImageDialog(img)}
                        className="flex-1"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteImage(img.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Image Dialog */}
      <Dialog
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        title={editingImage ? 'Edit Image' : 'Add Image'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-upload">Image</Label>
            <ImageUpload
              value={formImage.image}
              onChange={(imageId) => setFormImage({ ...formImage, image: imageId })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              value={formImage.alt}
              onChange={(e) => setFormImage({ ...formImage, alt: e.target.value })}
              placeholder="What we do image"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-order">Display Order</Label>
            <Input
              id="image-order"
              type="number"
              value={formImage.displayOrder}
              onChange={(e) => setFormImage({ ...formImage, displayOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCloseImageDialog}
            disabled={savingImage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveImage}
            disabled={savingImage}
          >
            {savingImage ? 'Saving...' : editingImage ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
