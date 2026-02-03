'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { X, Plus, Pencil, Trash2, Info } from 'lucide-react';
import { StickyFooter } from '../_components/sticky-footer';
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
import { useDraftPersistence } from '@/app/lib/use-draft-persistence';
import { DraftRestorePrompt } from '@/app/components/ui/draft-restore-prompt';

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

type GalleryFormData = {
  image: string;
  alt: string;
  displayOrder: number;
};

export default function AboutUsPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const pathname = usePathname();
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
  const [galleryFormData, setGalleryFormData] = useState<GalleryFormData>({
    image: '',
    alt: 'About Us gallery image',
    displayOrder: 0,
  });

  const draftEntityId = editingGalleryImage?.id ?? 'new';
  const { showRestorePrompt, draftMeta, saveDraft, clearDraft, restoreDraft, dismissDraft } = useDraftPersistence<GalleryFormData>({
    entity: 'about-us-gallery',
    id: draftEntityId,
    route: pathname,
    debounceMs: 500,
  });

  const handleGalleryFormChange = useCallback((updates: Partial<GalleryFormData>) => {
    setGalleryFormData(prev => {
      const newData = { ...prev, ...updates };
      if (isDialogOpen && (newData.image?.trim() || newData.alt?.trim())) {
        saveDraft(newData);
      }
      return newData;
    });
  }, [isDialogOpen, saveDraft]);

  const handleRestoreGalleryDraft = useCallback(() => {
    const restored = restoreDraft();
    if (restored) {
      setGalleryFormData(restored);
      if (!isDialogOpen) setIsDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [restoreDraft, toast, isDialogOpen]);

  const handleDismissGalleryDraft = useCallback(() => dismissDraft(), [dismissDraft]);

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
  // Don't clear draft on close so user can restore later

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
        clearDraft();
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
        toast.success('Content updated successfully! Changes are now live on the website.');
        setMessage({ type: 'success', text: 'Content updated successfully! Changes are now live on the website.' });
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update content' }));
        toast.error(errorData.error || 'Failed to update content');
        setMessage({ type: 'error', text: errorData.error || 'Failed to update content' });
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('An error occurred while saving');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">About Us content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the About Us section content that appears on the website.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          <a href="#main-content" className="text-accent hover:underline">Main Content</a>
          <a href="#mission-vision" className="text-accent hover:underline">Mission & Vision</a>
          <a href="#gallery-images" className="text-accent hover:underline">Gallery Images</a>
        </div>
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

      <form id="about-us-form" onSubmit={handleSubmit} className="space-y-8">
        {}
        <Card id="main-content" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Main Content</h2>
              <p className="mt-1 text-sm text-muted-foreground">Edit the title and main text paragraphs</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="max-w-4xl space-y-6">
              {}
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
                  className="min-h-[100px]"
                  placeholder="First paragraph about the company..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paragraph2">Paragraph 2</Label>
                <Textarea
                  id="paragraph2"
                  value={formData.paragraph2}
                  onChange={(e) => setFormData({ ...formData, paragraph2: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Second paragraph..."
                />
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paragraph3">Paragraph 3</Label>
                <Textarea
                  id="paragraph3"
                  value={formData.paragraph3}
                  onChange={(e) => setFormData({ ...formData, paragraph3: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Third paragraph..."
                />
                <p className="text-xs text-muted-foreground">Optional</p>
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
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paragraph5">Paragraph 5</Label>
                <Textarea
                  id="paragraph5"
                  value={formData.paragraph5}
                  onChange={(e) => setFormData({ ...formData, paragraph5: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Fifth paragraph..."
                />
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {}
        <Card id="mission-vision" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-medium text-foreground">Mission & Vision</h2>
            <p className="mt-1 text-sm text-muted-foreground">Edit the mission and vision statements</p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-foreground mb-1">Mission</h3>
                  <p className="text-xs text-muted-foreground mb-4">Edit the mission statement</p>
                </div>
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
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-medium text-foreground mb-1">Vision</h3>
                  <p className="text-xs text-muted-foreground mb-4">Edit the vision statement</p>
                </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {}
      <Card id="gallery-images" className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Gallery Images (Scrolling)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add multiple images to scroll infinitely in the About Us section (sorted by displayOrder)
            </p>
          </div>
          <Button onClick={handleOpenAddGalleryDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Gallery Image
          </Button>
        </div>
        <CardContent className="p-6">
          {!isDialogOpen && showRestorePrompt && draftMeta && (
            <DraftRestorePrompt
              savedAt={draftMeta.savedAt}
              onRestore={handleRestoreGalleryDraft}
              onDismiss={handleDismissGalleryDraft}
            />
          )}
          {galleryImages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No gallery images yet. Add at least 3 for the best scrolling effect.
            </p>
          ) : (
            <div className="space-y-2">
              {galleryImages.map((gi) => {
                const imageUrl = getImageUrl(gi.image);
                return (
                  <div
                    key={gi.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                  >
                    {}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
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
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1">
                        {gi.alt}
                      </p>
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Order: {gi.displayOrder}
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditGalleryDialog(gi)}
                        className="h-9"
                        aria-label={`Edit ${gi.alt}`}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteGalleryImage(gi.id)}
                        className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${gi.alt}`}
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
        </CardContent>
      </Card>

      {}
      <StickyFooter formId="about-us-form" saving={saving} />

      {}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingGalleryImage ? 'Edit Gallery Image' : 'Add Gallery Image'}
      >
        <div className="space-y-4 mb-6">
          {isDialogOpen && showRestorePrompt && draftMeta && (
            <DraftRestorePrompt
              savedAt={draftMeta.savedAt}
              onRestore={handleRestoreGalleryDraft}
              onDismiss={handleDismissGalleryDraft}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="dialog-gallery-image">Image</Label>
            <ImageUpload
              value={galleryFormData.image}
              onChange={(v) => handleGalleryFormChange({ image: v })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-gallery-alt">Alt Text</Label>
            <Input
              id="dialog-gallery-alt"
              value={galleryFormData.alt}
              onChange={(e) => handleGalleryFormChange({ alt: e.target.value })}
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
              onChange={(e) => handleGalleryFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
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

