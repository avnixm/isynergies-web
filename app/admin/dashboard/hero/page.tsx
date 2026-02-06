'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { VideoUpload } from '@/app/components/ui/video-upload';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { Plus, Pencil, Trash2, Check, AlertCircle } from 'lucide-react';
import { StickyFooter } from '../_components/sticky-footer';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
import { MediaPreview } from '@/app/components/ui/media-preview';
import { useDraftPersistence } from '@/app/lib/use-draft-persistence';
import { DraftRestorePrompt } from '@/app/components/ui/draft-restore-prompt';
import { getCached, setCached } from '../_lib/cache';

type HeroSection = {
  id: number;
  weMakeItLogo: string | null;
  isLogo: string | null;
  fullLogo: string | null;
  backgroundImage: string | null; 
  backgroundVideo: string | null; 
  heroImagesBackgroundImage: string | null; 
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

type TickerFormData = { text: string; displayOrder: number };
type HeroImageFormData = { image: string; alt: string; displayOrder: number };

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

  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTickerItem, setEditingTickerItem] = useState<HeroTickerItem | null>(null);
  const [tickerFormData, setTickerFormData] = useState<TickerFormData>({ text: '', displayOrder: 0 });
  const [savingTickerItem, setSavingTickerItem] = useState(false);

  // Hero Images dialog state
  const [isHeroImageDialogOpen, setIsHeroImageDialogOpen] = useState(false);
  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null);
  const [heroImageFormData, setHeroImageFormData] = useState<HeroImageFormData>({
    image: '',
    alt: '',
    displayOrder: 0,
  });
  const [savingHeroImage, setSavingHeroImage] = useState(false);

  const pathname = usePathname();
  const tickerDraftId = editingTickerItem?.id ?? 'new';
  const { showRestorePrompt: showTickerRestorePrompt, draftMeta: tickerDraftMeta, saveDraft: saveTickerDraft, clearDraft: clearTickerDraft, restoreDraft: restoreTickerDraft, dismissDraft: dismissTickerDraft } = useDraftPersistence<TickerFormData>({
    entity: 'hero-ticker',
    id: tickerDraftId,
    route: pathname,
    debounceMs: 500,
  });
  const heroImageDraftId = editingHeroImage?.id ?? 'new';
  const { showRestorePrompt: showHeroImageRestorePrompt, draftMeta: heroImageDraftMeta, saveDraft: saveHeroImageDraft, clearDraft: clearHeroImageDraft, restoreDraft: restoreHeroImageDraft, dismissDraft: dismissHeroImageDraft } = useDraftPersistence<HeroImageFormData>({
    entity: 'hero-image',
    id: heroImageDraftId,
    route: pathname,
    debounceMs: 500,
  });

  const handleTickerFormChange = useCallback((updates: Partial<TickerFormData>) => {
    setTickerFormData(prev => {
      const newData = { ...prev, ...updates };
      if (isDialogOpen && newData.text?.trim()) saveTickerDraft(newData);
      return newData;
    });
  }, [isDialogOpen, saveTickerDraft]);
  const handleRestoreTickerDraft = useCallback(() => {
    const restored = restoreTickerDraft();
    if (restored) {
      setTickerFormData(restored);
      if (!isDialogOpen) setIsDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [restoreTickerDraft, toast, isDialogOpen]);
  const handleDismissTickerDraft = useCallback(() => dismissTickerDraft(), [dismissTickerDraft]);

  const handleHeroImageFormChange = useCallback((updates: Partial<HeroImageFormData>) => {
    setHeroImageFormData(prev => {
      const newData = { ...prev, ...updates };
      if (isHeroImageDialogOpen && (newData.image?.trim() || newData.alt?.trim())) saveHeroImageDraft(newData);
      return newData;
    });
  }, [isHeroImageDialogOpen, saveHeroImageDraft]);
  const handleRestoreHeroImageDraft = useCallback(() => {
    const restored = restoreHeroImageDraft();
    if (restored) {
      setHeroImageFormData(restored);
      if (!isHeroImageDialogOpen) setIsHeroImageDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [restoreHeroImageDraft, toast, isHeroImageDialogOpen]);
  const handleDismissHeroImageDraft = useCallback(() => dismissHeroImageDraft(), [dismissHeroImageDraft]);

  // Database video media state (for hero background & related videos)
  const [videoMedia, setVideoMedia] = useState<Array<{
    id: number;
    url: string;
    contentType: string;
    sizeBytes: number;
    createdAt: string;
  }>>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    const sectionCache = getCached<HeroSection>('admin-hero-section');
    const tickerCache = getCached<HeroTickerItem[]>('admin-hero-ticker');
    if (sectionCache != null && tickerCache != null) {
      setHeroSection(sectionCache);
      setInitialHeroSection(sectionCache);
      setHeroTickerItems(tickerCache);
      setLoading(false);
    } else {
      fetchHeroSection();
      fetchHeroTickerItems();
    }
    fetchHeroImages();
    fetchVideos();
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
        setCached('admin-hero-section', heroData);
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
        setCached('admin-hero-ticker', data);
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
        
        
        const token = localStorage.getItem('admin_token');
        const urlMap: Record<number, string> = {};
        
        await Promise.all(
          data.map(async (image: HeroImage) => {
            if (image.image) {
              
              if (image.image.startsWith('http') || image.image.startsWith('/')) {
                urlMap[image.id] = image.image;
              } else if (image.image.match(/^\d+$/)) {
                
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
    setTickerFormData({ text: '', displayOrder: newOrder });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (item: HeroTickerItem) => {
    setEditingTickerItem(item);
    setTickerFormData({ text: item.text, displayOrder: item.displayOrder });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTickerItem(null);
    setTickerFormData({ text: '', displayOrder: 0 });
  };

  const handleSaveTickerItem = async () => {
    // Validation
    if (!tickerFormData.text.trim()) {
      toast.error('Please enter announcement text');
      return;
    }

    setSavingTickerItem(true);
    const token = localStorage.getItem('admin_token');
    try {
      if (editingTickerItem) {
        
        const response = await fetch(`/api/admin/hero-ticker/${editingTickerItem.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: tickerFormData.text,
            displayOrder: tickerFormData.displayOrder,
          }),
        });

        if (response.ok) {
          clearTickerDraft();
          toast.success('Announcement text updated successfully!');
          handleCloseDialog();
          fetchHeroTickerItems();
        } else {
          toast.error('Failed to update announcement text');
        }
      } else {
        
        const response = await fetch('/api/admin/hero-ticker', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: tickerFormData.text,
            displayOrder: tickerFormData.displayOrder,
          }),
        });

        if (response.ok) {
          clearTickerDraft();
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

  
  const handleOpenAddHeroImageDialog = () => {
    const newOrder = heroImages.length > 0 
      ? Math.max(...heroImages.map(img => img.displayOrder)) + 1 
      : 0;
    
    setEditingHeroImage(null);
    setHeroImageFormData({ image: '', alt: '', displayOrder: newOrder });
    setIsHeroImageDialogOpen(true);
  };

  const handleOpenEditHeroImageDialog = (image: HeroImage) => {
    setEditingHeroImage(image);
    setHeroImageFormData({ image: image.image, alt: image.alt, displayOrder: image.displayOrder });
    setIsHeroImageDialogOpen(true);
  };

  const handleCloseHeroImageDialog = () => {
    setIsHeroImageDialogOpen(false);
    setEditingHeroImage(null);
    setHeroImageFormData({ image: '', alt: '', displayOrder: 0 });
  };

  const handleSaveHeroImage = async () => {
    if (!heroImageFormData.image.trim()) {
      toast.error('Please select an image');
      return;
    }

    setSavingHeroImage(true);
    const token = localStorage.getItem('admin_token');
    try {
      if (editingHeroImage) {
        
        const response = await fetch(`/api/admin/hero-images/${editingHeroImage.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: heroImageFormData.image,
            alt: heroImageFormData.alt || 'Hero image',
            displayOrder: heroImageFormData.displayOrder,
          }),
        });

        if (response.ok) {
          clearHeroImageDraft();
          toast.success('Hero image updated successfully!');
          handleCloseHeroImageDialog();
          await fetchHeroImages(); 
        } else {
          toast.error('Failed to update hero image');
        }
      } else {
        
        const response = await fetch('/api/admin/hero-images', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            image: heroImageFormData.image,
            alt: heroImageFormData.alt || 'Hero image',
            displayOrder: heroImageFormData.displayOrder,
          }),
        });

        if (response.ok) {
          clearHeroImageDraft();
          toast.success('Hero image added successfully!');
          handleCloseHeroImageDialog();
          await fetchHeroImages(); 
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
        
        setResolvedImageUrls(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
        await fetchHeroImages(); 
      } else {
        toast.error('Failed to delete hero image');
      }
    } catch (error) {
      console.error('Error deleting hero image:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setVideoMedia([]);
        return;
      }
      const response = await fetch('/api/admin/media', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const records = await response.json();
        const videos = (records || []).filter(
          (m: any) => m?.type === 'video' || m?.contentType?.startsWith('video/')
        );
        setVideoMedia(
          videos.map((m: any) => ({
            id: m.id,
            url: m.url,
            contentType: m.contentType,
            sizeBytes: m.sizeBytes,
            createdAt: m.createdAt,
          }))
        );
      } else {
        setVideoMedia([]);
      }
    } catch (error) {
      console.error('Error fetching video media:', error);
      setVideoMedia([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePromoteVideo = async (mediaId: number) => {
    const updatedSection: HeroSection = {
      ...(heroSection || {
        id: 1,
        weMakeItLogo: null,
        isLogo: null,
        fullLogo: null,
        backgroundImage: null,
        backgroundVideo: null,
        heroImagesBackgroundImage: null,
        useHeroImages: false,
      }),
      backgroundVideo: String(mediaId),
      useHeroImages: false,
    };

    setSaving(true);
    try {
      const response = await fetch('/api/admin/hero-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedSection,
          useHeroImages: updatedSection.useHeroImages ?? false,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        const normalized: HeroSection = {
          id: updated.id || updatedSection.id,
          weMakeItLogo: updated.weMakeItLogo || null,
          isLogo: updated.isLogo || null,
          fullLogo: updated.fullLogo || null,
          backgroundImage: updated.backgroundImage || null,
          backgroundVideo: updated.backgroundVideo || String(mediaId),
          heroImagesBackgroundImage: updated.heroImagesBackgroundImage || null,
          useHeroImages: updated.useHeroImages ?? false,
        };
        setHeroSection(normalized);
        setInitialHeroSection(normalized);
        setLastSaved(new Date());
        toast.success(`Promoted video ID ${mediaId} as hero background.`);
      } else {
        toast.error('Failed to promote video as hero background');
      }
    } catch (error) {
      console.error('Error promoting hero video:', error);
      toast.error('An error occurred while promoting the video');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideoMedia = async (mediaId: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this video? This action cannot be undone.',
      'Delete Video'
    );
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    if (!token) {
      toast.error('No authentication token found. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Video deleted successfully.');
        // Clear hero backgroundVideo if it was pointing at this media ID
        if (heroSection.backgroundVideo === String(mediaId)) {
          const cleared: HeroSection = { ...heroSection, backgroundVideo: null };
          setHeroSection(cleared);
          setInitialHeroSection(cleared);
        }
        await fetchVideos();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || 'Failed to delete video');
      }
    } catch (error) {
      console.error('Error deleting video media:', error);
      toast.error('An error occurred while deleting the video');
    }
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
      {}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        {}
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
          {}
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

          {}
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
                    <VideoUpload
                      value={heroSection.backgroundVideo || ''}
                      onChange={(imageId) =>
                        setHeroSection({ ...heroSection, backgroundVideo: imageId })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode B: Hero Images */}
          {heroSection.useHeroImages && (
            <div className="space-y-8">
              {!isHeroImageDialogOpen && showHeroImageRestorePrompt && heroImageDraftMeta && (
                <DraftRestorePrompt
                  savedAt={heroImageDraftMeta.savedAt}
                  onRestore={handleRestoreHeroImageDraft}
                  onDismiss={handleDismissHeroImageDraft}
                />
              )}
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
          {!isDialogOpen && showTickerRestorePrompt && tickerDraftMeta && (
            <DraftRestorePrompt
              savedAt={tickerDraftMeta.savedAt}
              onRestore={handleRestoreTickerDraft}
              onDismiss={handleDismissTickerDraft}
            />
          )}
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
          {isDialogOpen && showTickerRestorePrompt && tickerDraftMeta && (
            <DraftRestorePrompt
              savedAt={tickerDraftMeta.savedAt}
              onRestore={handleRestoreTickerDraft}
              onDismiss={handleDismissTickerDraft}
            />
          )}
          <HtmlTips />
          <div className="space-y-2">
            <Label htmlFor="dialog-text">Announcement Text</Label>
            <Input
              id="dialog-text"
              type="text"
              value={tickerFormData.text}
              onChange={(e) => handleTickerFormChange({ text: e.target.value })}
              placeholder="e.g., Cash is now available [try now](https://example.com)"
              required
            />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                This text will appear in the hero section announcement bar
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Add links:</strong> Use markdown syntax <code className="px-1 py-0.5 bg-muted rounded text-xs">[link text](https://example.com)</code>
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
              value={tickerFormData.displayOrder}
              onChange={(e) => handleTickerFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
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

      {}
      <Dialog
        open={isHeroImageDialogOpen}
        onOpenChange={setIsHeroImageDialogOpen}
        title={editingHeroImage ? 'Edit Hero Image' : 'Add Hero Image'}
      >
        <div className="space-y-4 mb-6">
          {isHeroImageDialogOpen && showHeroImageRestorePrompt && heroImageDraftMeta && (
            <DraftRestorePrompt
              savedAt={heroImageDraftMeta.savedAt}
              onRestore={handleRestoreHeroImageDraft}
              onDismiss={handleDismissHeroImageDraft}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="hero-image-upload">Image</Label>
            <ImageUpload
              value={heroImageFormData.image}
              onChange={(imageId) => handleHeroImageFormChange({ image: imageId })}
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
              value={heroImageFormData.alt}
              onChange={(e) => handleHeroImageFormChange({ alt: e.target.value })}
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
              value={heroImageFormData.displayOrder}
              onChange={(e) => handleHeroImageFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
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

      {}
      <Card className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Hero videos (database)</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Videos stored in the database that can be used for the hero background or other sections.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVideos}
            disabled={loadingVideos}
          >
            {loadingVideos ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="p-6">
          {loadingVideos ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : videoMedia.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No video media found for this admin user yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-4">
                Total: {videoMedia.length} video(s)
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="divide-y divide-border">
                  {videoMedia.map((m) => {
                    const isPromoted = heroSection.backgroundVideo === String(m.id);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded border border-border bg-muted/20 flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">🎥</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                ID {m.id} — {m.url?.substring(0, 60)}{m.url?.length > 60 ? '…' : ''}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>{formatFileSize(m.sizeBytes)}</span>
                                <span>•</span>
                                <span>{m.contentType}</span>
                                <span>•</span>
                                <span>{new Date(m.createdAt).toLocaleString()}</span>
                                {isPromoted && (
                                  <>
                                    <span>•</span>
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                                      Promoted (current hero video)
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                          <Button
                            variant={isPromoted ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handlePromoteVideo(m.id)}
                            disabled={saving}
                          >
                            {isPromoted ? 'Promoted' : 'Promote'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVideoMedia(m.id)}
                            className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {}
      <StickyFooter formId="hero-form" saving={saving} disabled={!hasUnsavedChanges} />
    </div>
  );
}

