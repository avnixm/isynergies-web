'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { Plus, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';
import { StickyFooter } from '../_components/sticky-footer';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
import { MediaPreview } from '@/app/components/ui/media-preview';

type HeroSection = {
  id: number;
  weMakeItLogo: string | null;
  isLogo: string | null;
  fullLogo: string | null;
  backgroundImage: string | null; // For Default Background Media mode
  backgroundVideo: string | null; // For Default Background Media mode
  heroImagesBackgroundImage: string | null; // For Hero Images mode
  useHeroImages?: boolean;
};

type HeroTickerItem = {
  id: number;
  text: string;
  displayOrder: number;
};

type HeroImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

export default function HeroManagementPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [heroSection, setHeroSection] = useState<HeroSection>({
    id: 1,
    weMakeItLogo: null,
    isLogo: null,
    fullLogo: null,
    backgroundImage: null,
    backgroundVideo: null,
    heroImagesBackgroundImage: null,
    useHeroImages: false,
  });
  const [heroTickerItems, setHeroTickerItems] = useState<HeroTickerItem[]>([]);
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialHeroSection, setInitialHeroSection] = useState<HeroSection | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [resolvedImageUrls, setResolvedImageUrls] = useState<Record<number, string>>({});

  // Dialog state management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTickerItem, setEditingTickerItem] = useState<HeroTickerItem | null>(null);
  const [formText, setFormText] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [savingTickerItem, setSavingTickerItem] = useState(false);

  // Hero Images dialog state
  const [isHeroImageDialogOpen, setIsHeroImageDialogOpen] = useState(false);
  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null);
  const [heroImageFormImage, setHeroImageFormImage] = useState('');
  const [heroImageFormAlt, setHeroImageFormAlt] = useState('');
  const [heroImageFormDisplayOrder, setHeroImageFormDisplayOrder] = useState(0);
  const [savingHeroImage, setSavingHeroImage] = useState(false);

  // Blob management state
  const [blobs, setBlobs] = useState<Array<{
    url: string;
    pathname: string;
    uploadedAt: Date;
    size: number;
    contentType: string;
  }>>([]);
  const [loadingBlobs, setLoadingBlobs] = useState(false);
  const [deletingBlobs, setDeletingBlobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHeroSection();
    fetchHeroTickerItems();
    fetchHeroImages();
    fetchBlobs();
  }, []);

  const fetchHeroSection = async () => {
    try {
      const response = await fetch('/api/admin/hero-section');
      if (response.ok) {
        const data = await response.json();
        const heroData = {
          ...data,
          useHeroImages: data.useHeroImages ?? false,
        };
        setHeroSection(heroData);
        setInitialHeroSection(heroData);
      }
    } catch (error) {
      console.error('Error fetching hero section:', error);
    }
  };

  const fetchHeroTickerItems = async () => {
    try {
      const response = await fetch('/api/admin/hero-ticker');
      if (response.ok) {
        const data = await response.json();
        setHeroTickerItems(data);
      }
    } catch (error) {
      console.error('Error fetching hero ticker items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/admin/hero-images');
      if (response.ok) {
        const data = await response.json();
        setHeroImages(data);
        
        // Resolve image URLs for previews
        const token = localStorage.getItem('admin_token');
        const urlMap: Record<number, string> = {};
        
        await Promise.all(
          data.map(async (image: HeroImage) => {
            if (image.image) {
              // If it's already a full URL, use it
              if (image.image.startsWith('http') || image.image.startsWith('/')) {
                urlMap[image.id] = image.image;
              } else if (image.image.match(/^\d+$/)) {
                // It's a numeric ID - try to resolve from media table
                try {
                  if (token) {
                    const mediaResponse = await fetch(`/api/admin/media/${image.image}`, {
                      headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (mediaResponse.ok) {
                      const mediaRecord = await mediaResponse.json();
                      if (mediaRecord?.url) {
                        urlMap[image.id] = mediaRecord.url;
                        return;
                      }
                    }
                  }
                  // Fallback to images API
                  urlMap[image.id] = `/api/images/${image.image}`;
                } catch (e) {
                  urlMap[image.id] = `/api/images/${image.image}`;
                }
              } else {
                urlMap[image.id] = `/api/images/${image.image}`;
              }
            }
          })
        );
        
        setResolvedImageUrls(urlMap);
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  const handleSaveHeroSection = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/hero-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...heroSection,
          useHeroImages: heroSection.useHeroImages ?? false,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        // Normalize the saved data to match our state structure
        const normalized = {
          id: updated.id || heroSection.id,
          weMakeItLogo: updated.weMakeItLogo || null,
          isLogo: updated.isLogo || null,
          fullLogo: updated.fullLogo || null,
          backgroundImage: updated.backgroundImage || null,
          backgroundVideo: updated.backgroundVideo || null,
          heroImagesBackgroundImage: updated.heroImagesBackgroundImage || null,
          useHeroImages: updated.useHeroImages ?? false,
        };
        setInitialHeroSection(normalized);
        // Also update heroSection to ensure they match
        setHeroSection(normalized);
        setLastSaved(new Date());
        toast.success('Hero section updated successfully!');
      } else {
        toast.error('Failed to update hero section');
      }
    } catch (error) {
      console.error('Error saving hero section:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Check if there are unsaved changes - compare only relevant fields
  const hasUnsavedChanges = !initialHeroSection || (() => {
    const current = {
      weMakeItLogo: heroSection.weMakeItLogo || null,
      isLogo: heroSection.isLogo || null,
      fullLogo: heroSection.fullLogo || null,
      backgroundImage: heroSection.backgroundImage || null,
      backgroundVideo: heroSection.backgroundVideo || null,
      heroImagesBackgroundImage: heroSection.heroImagesBackgroundImage || null,
      useHeroImages: heroSection.useHeroImages ?? false,
    };
    const initial = {
      weMakeItLogo: initialHeroSection.weMakeItLogo || null,
      isLogo: initialHeroSection.isLogo || null,
      fullLogo: initialHeroSection.fullLogo || null,
      backgroundImage: initialHeroSection.backgroundImage || null,
      backgroundVideo: initialHeroSection.backgroundVideo || null,
      heroImagesBackgroundImage: initialHeroSection.heroImagesBackgroundImage || null,
      useHeroImages: initialHeroSection.useHeroImages ?? false,
    };
    return JSON.stringify(current) !== JSON.stringify(initial);
  })();

  const handleOpenAddDialog = () => {
    const newOrder = heroTickerItems.length > 0 
      ? Math.max(...heroTickerItems.map(item => item.displayOrder)) + 1 
      : 0;
    
    setEditingTickerItem(null);
    setFormText('');
    setFormDisplayOrder(newOrder);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (item: HeroTickerItem) => {
    setEditingTickerItem(item);
    setFormText(item.text);
    setFormDisplayOrder(item.displayOrder);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTickerItem(null);
    setFormText('');
    setFormDisplayOrder(0);
  };

  const handleSaveTickerItem = async () => {
    // Validation
    if (!formText.trim()) {
      toast.error('Please enter announcement text');
      return;
    }

    setSavingTickerItem(true);
    const token = localStorage.getItem('admin_token');
    try {
      if (editingTickerItem) {
        // Update existing
        const response = await fetch(`/api/admin/hero-ticker/${editingTickerItem.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: formText,
            displayOrder: formDisplayOrder,
          }),
        });

        if (response.ok) {
          toast.success('Announcement text updated successfully!');
          handleCloseDialog();
          fetchHeroTickerItems();
        } else {
          toast.error('Failed to update announcement text');
        }
      } else {
        // Create new
        const response = await fetch('/api/admin/hero-ticker', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: formText,
            displayOrder: formDisplayOrder,
          }),
        });

        if (response.ok) {
          toast.success('Announcement text added successfully!');
          handleCloseDialog();
          fetchHeroTickerItems();
        } else {
          toast.error('Failed to add announcement text');
        }
      }
    } catch (error) {
      console.error('Error saving announcement text:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingTickerItem(false);
    }
  };

  const handleDeleteTickerItem = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this announcement text? This action cannot be undone.',
      'Delete Text'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/hero-ticker/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Announcement text deleted successfully!');
        fetchHeroTickerItems();
      } else {
        toast.error('Failed to delete announcement text');
      }
    } catch (error) {
      console.error('Error deleting announcement text:', error);
      toast.error('An error occurred while deleting');
    }
  };

  // Hero Images handlers
  const handleOpenAddHeroImageDialog = () => {
    const newOrder = heroImages.length > 0 
      ? Math.max(...heroImages.map(img => img.displayOrder)) + 1 
      : 0;
    
    setEditingHeroImage(null);
    setHeroImageFormImage('');
    setHeroImageFormAlt('');
    setHeroImageFormDisplayOrder(newOrder);
    setIsHeroImageDialogOpen(true);
  };

  const handleOpenEditHeroImageDialog = (image: HeroImage) => {
    setEditingHeroImage(image);
    setHeroImageFormImage(image.image);
    setHeroImageFormAlt(image.alt);
    setHeroImageFormDisplayOrder(image.displayOrder);
    setIsHeroImageDialogOpen(true);
  };

  const handleCloseHeroImageDialog = () => {
    setIsHeroImageDialogOpen(false);
    setEditingHeroImage(null);
    setHeroImageFormImage('');
    setHeroImageFormAlt('');
    setHeroImageFormDisplayOrder(0);
  };

  const handleSaveHeroImage = async () => {
    if (!heroImageFormImage.trim()) {
      toast.error('Please select an image');
      return;
    }

    setSavingHeroImage(true);
    const token = localStorage.getItem('admin_token');
    try {
      if (editingHeroImage) {
        // Update existing
        const response = await fetch(`/api/admin/hero-images/${editingHeroImage.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: heroImageFormImage,
            alt: heroImageFormAlt || 'Hero image',
            displayOrder: heroImageFormDisplayOrder,
          }),
        });

        if (response.ok) {
          toast.success('Hero image updated successfully!');
          handleCloseHeroImageDialog();
          await fetchHeroImages(); // Refresh images with resolved URLs
        } else {
          toast.error('Failed to update hero image');
        }
      } else {
        // Create new
        const response = await fetch('/api/admin/hero-images', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: heroImageFormImage,
            alt: heroImageFormAlt || 'Hero image',
            displayOrder: heroImageFormDisplayOrder,
          }),
        });

        if (response.ok) {
          toast.success('Hero image added successfully!');
          handleCloseHeroImageDialog();
          await fetchHeroImages(); // Refresh images with resolved URLs
        } else {
          toast.error('Failed to add hero image');
        }
      }
    } catch (error) {
      console.error('Error saving hero image:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingHeroImage(false);
    }
  };

  const handleDeleteHeroImage = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this hero image? This action cannot be undone.',
      'Delete Image'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/hero-images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Hero image deleted successfully!');
        // Remove from resolved URLs
        setResolvedImageUrls(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        await fetchHeroImages(); // Refresh images
      } else {
        toast.error('Failed to delete hero image');
      }
    } catch (error) {
      console.error('Error deleting hero image:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const fetchBlobs = async () => {
    setLoadingBlobs(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/blobs?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBlobs(data.blobs || []);
      }
    } catch (error) {
      console.error('Error fetching blobs:', error);
    } finally {
      setLoadingBlobs(false);
    }
  };

  const handleDeleteBlob = async (url: string) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this blob? This action cannot be undone.',
      'Delete Blob'
    );

    if (!confirmed) return;

    setDeletingBlobs(prev => new Set(prev).add(url));
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/delete-blob', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        toast.success('Blob deleted successfully!');
        await fetchBlobs(); // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete blob');
      }
    } catch (error) {
      console.error('Error deleting blob:', error);
      toast.error('An error occurred while deleting blob');
    } finally {
      setDeletingBlobs(prev => {
        const updated = new Set(prev);
        updated.delete(url);
        return updated;
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading message="Loading hero section" size="lg" />
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Hero section management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage hero visuals, logos, and announcement text bar.
        </p>
      </div>

      <form id="hero-form" onSubmit={(e) => { e.preventDefault(); handleSaveHeroSection(); }} className="space-y-8">
      {/* Hero Visuals Section */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Hero Visuals</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how the hero area is rendered
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Unsaved changes</span>
              </div>
            )}
            {!hasUnsavedChanges && lastSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Saved {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Mode Selector */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setHeroSection({ ...heroSection, useHeroImages: false })}
              className={`relative rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
                !heroSection.useHeroImages
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                  : 'border-border bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  !heroSection.useHeroImages
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {!heroSection.useHeroImages && (
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">Default Background Media</h3>
                    {!heroSection.useHeroImages && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uses Background Image + Background Video
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHeroSection({ ...heroSection, useHeroImages: true })}
              className={`relative rounded-xl border-2 p-6 text-left transition-all hover:shadow-md ${
                heroSection.useHeroImages
                  ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                  : 'border-border bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  heroSection.useHeroImages
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {heroSection.useHeroImages && (
                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Hero Images</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload a set of hero images (carousel/rotating images)
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Mode A: Default Background Media */}
          {!heroSection.useHeroImages && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Background Media</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload background image and video for the hero section
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="backgroundImage">Background Image</Label>
                    <ImageUpload
                      value={heroSection.backgroundImage || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, backgroundImage: imageId })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundVideo">Background Video</Label>
                    <ImageUpload
                      value={heroSection.backgroundVideo || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, backgroundVideo: imageId })
                      }
                      acceptVideo={true}
                      mediaType="video"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode B: Hero Images */}
          {heroSection.useHeroImages && (
            <div className="space-y-8">
              {/* Background Image for Hero Images mode */}
              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Background Image</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a background image for the hero section
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="heroImagesBackgroundImage">Background Image</Label>
                    <ImageUpload
                      value={heroSection.heroImagesBackgroundImage || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, heroImagesBackgroundImage: imageId })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Hero Section Logos */}
              <div>
                <h3 className="text-base font-medium text-foreground mb-2">Hero Section Logos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload the logos that appear in the hero section
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="weMakeItLogo">We Make IT Possible Logo</Label>
                    <ImageUpload
                      value={heroSection.weMakeItLogo || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, weMakeItLogo: imageId })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isLogo">iS Logo (Large Graphic)</Label>
                    <ImageUpload
                      value={heroSection.isLogo || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, isLogo: imageId })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullLogo">Full iSynergies Logo</Label>
                    <ImageUpload
                      value={heroSection.fullLogo || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, fullLogo: imageId })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
      </form>

      {/* Hero Ticker Items */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Announcement Text Bar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add announcement texts that appear in the hero section
            </p>
          </div>
          <Button onClick={handleOpenAddDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Text
          </Button>
        </div>
        <div className="p-6">
          {heroTickerItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No announcement texts yet. Click "Add Text" to create one.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {heroTickerItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                >
                  {/* Text Preview */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {item.text}
                    </p>
                    {item.text.includes('[') && item.text.includes('](') && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Contains link
                      </p>
                    )}
                  </div>

                  {/* Order Badge */}
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Order: {item.displayOrder}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditDialog(item)}
                      className="h-9"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTickerItem(item.id)}
                      className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                      type="button"
                      aria-label="Delete announcement text"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit Ticker Item Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingTickerItem ? 'Edit Text' : 'Add Text'}
      >
        <div className="space-y-4 mb-6">
          <HtmlTips />
          <div className="space-y-2">
            <Label htmlFor="dialog-text">Announcement Text</Label>
            <Input
              id="dialog-text"
              type="text"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="e.g., Cash is now available [try now](https://example.com)"
              required
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                This text will appear in the hero section announcement bar
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Add links:</strong> Use markdown syntax <code className="px-1 py-0.5 bg-muted rounded text-xs">[link text](https://url.com)</code>
              </p>
              <p className="text-xs text-muted-foreground italic">
                Example: Cash is now available [try now](https://example.com)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-order">Display Order</Label>
            <Input
              id="dialog-order"
              type="number"
              value={formDisplayOrder}
              onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
            disabled={savingTickerItem}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTickerItem}
            disabled={savingTickerItem}
          >
            {savingTickerItem ? 'Saving...' : editingTickerItem ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Add/Edit Hero Image Dialog */}
      <Dialog
        open={isHeroImageDialogOpen}
        onOpenChange={setIsHeroImageDialogOpen}
        title={editingHeroImage ? 'Edit Hero Image' : 'Add Hero Image'}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="hero-image-upload">Image</Label>
            <ImageUpload
              value={heroImageFormImage}
              onChange={(imageId) => setHeroImageFormImage(imageId)}
            />
            <p className="text-xs text-muted-foreground">
              Upload an image that will be displayed in the hero section
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-image-alt">Alt Text</Label>
            <Input
              id="hero-image-alt"
              type="text"
              value={heroImageFormAlt}
              onChange={(e) => setHeroImageFormAlt(e.target.value)}
              placeholder="Hero image description"
            />
            <p className="text-xs text-muted-foreground">
              Descriptive text for accessibility and SEO
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-image-order">Display Order</Label>
            <Input
              id="hero-image-order"
              type="number"
              value={heroImageFormDisplayOrder}
              onChange={(e) => setHeroImageFormDisplayOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first
            </p>
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseHeroImageDialog}
            disabled={savingHeroImage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveHeroImage}
            disabled={savingHeroImage}
          >
            {savingHeroImage ? 'Saving...' : editingHeroImage ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Blob Storage Management Section */}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Blob Storage</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage uploaded files in Vercel Blob storage
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBlobs}
            disabled={loadingBlobs}
          >
            {loadingBlobs ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="p-6">
          {loadingBlobs ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : blobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No blobs found in storage</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-4">
                Total: {blobs.length} blob(s)
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="divide-y divide-border">
                  {blobs.map((blob, index) => (
                    <div
                      key={blob.url}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {blob.contentType.startsWith('image/') ? (
                              <div className="w-12 h-12 rounded border border-border bg-muted/20 flex items-center justify-center overflow-hidden">
                                <img
                                  src={blob.url}
                                  alt={blob.pathname}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : blob.contentType.startsWith('video/') ? (
                              <div className="w-12 h-12 rounded border border-border bg-muted/20 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">🎥</span>
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded border border-border bg-muted/20 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">📄</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {blob.pathname || blob.url.substring(0, 60)}...
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>{formatFileSize(blob.size)}</span>
                              <span>•</span>
                              <span>{blob.contentType}</span>
                              <span>•</span>
                              <span>{formatDate(blob.uploadedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBlob(blob.url)}
                          disabled={deletingBlobs.has(blob.url)}
                          className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          {deletingBlobs.has(blob.url) ? (
                            'Deleting...'
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sticky Footer Save Button - At the bottom of all content */}
      <StickyFooter formId="hero-form" saving={saving} disabled={!hasUnsavedChanges} />
    </div>
  );
}

