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
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { StickyFooter } from '../_components/sticky-footer';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">What We Do Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the What We Do section images and content
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          <a href="#text-content" className="text-accent hover:underline">Text Content</a>
          <a href="#images" className="text-accent hover:underline">Images</a>
        </div>
      </div>

      <form id="what-we-do-form" onSubmit={(e) => { e.preventDefault(); handleSaveContent(); }} className="space-y-8">
        {/* Main Content */}
        <Card id="text-content" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Text Content</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Edit the text content displayed below the images in the What We Do section
              </p>
            </div>
          </div>
        <div className="p-6">
          <div className="max-w-4xl space-y-6">
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
              <Label htmlFor="mainText" className="text-sm font-medium">
                Main Description Text
              </Label>
              <Textarea
                id="mainText"
                value={content.mainText}
                onChange={(e) => setContent({ ...content, mainText: e.target.value })}
                placeholder="Main Text Here"
                className="min-h-[150px] resize-none font-mono text-sm"
              />
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
          </div>
        </div>
      </Card>
      </form>

      {/* Images */}
      <Card id="images" className="rounded-xl border border-border bg-white shadow-sm">
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
            <div className="space-y-2">
              {images.map((img) => {
                const imageUrl = getImageUrl(img.image);
                return (
                  <div
                    key={img.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
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

                    {/* Alt Text and Order */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1">
                        {img.alt}
                      </p>
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Order: {img.displayOrder}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditImageDialog(img)}
                        className="h-9"
                        aria-label={`Edit ${img.alt}`}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteImage(img.id)}
                        className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${img.alt}`}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Sticky Footer Save Button */}
      <StickyFooter formId="what-we-do-form" saving={saving} />

      {/* Image Dialog */}
      <Dialog
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
        title={editingImage ? 'Edit Image' : 'Add Image'}
      >
        <div className="space-y-4 mb-6">
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

        <DialogFooter className="justify-end">
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
