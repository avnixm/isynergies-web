                                                                                                                                                                                                                                                                                                                                                              'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { StickyFooter } from '../_components/sticky-footer';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
import Image from 'next/image';
import { useDraftPersistence } from '@/app/lib/use-draft-persistence';
import { DraftRestorePrompt } from '@/app/components/ui/draft-restore-prompt';


interface MediaPreviewFrameProps {
  value: string;
  onChange: (value: string) => void;
  getImageUrl: (imageId: string | null) => string;
  size?: 'logo' | 'badge';
  disabled?: boolean;
}

function MediaPreviewFrame({ value, onChange, getImageUrl, size = 'logo', disabled }: MediaPreviewFrameProps) {
  const frameHeight = size === 'badge' ? 'h-40' : 'h-44';
  const imageUrl = value ? getImageUrl(value) : null;

  if (value && imageUrl) {
    return (
      <div className={`relative ${frameHeight} w-full rounded-xl border border-border bg-muted/20 p-3 overflow-hidden`}>
        {}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-1/2 h-1/2 flex items-center justify-center">
            <Image
              src={imageUrl}
              alt="Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
        {}
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-3 right-3 h-11 w-11 rounded-full border border-red-400 bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-20"
          disabled={disabled}
          aria-label="Delete media"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Empty state: show ImageUpload for uploading
  return (
    <ImageUpload
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

type FeaturedAppContent = {
  headerImage: string;
  itemType: 'app' | 'website';
  downloadText: string;
  appStoreImage: string;
  googlePlayImage: string;
  appGalleryImage: string;
  visitText: string;
  websiteUrl: string;
  logoImage: string;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: string;
  appLogo: string;
  poweredByImage: string;
  bannerHeight: string;
};

type FeaturedAppCarouselImage = {
  id: number;
  image: string;
  alt: string;
  mediaType?: string;
  displayOrder: number;
};

type FeaturedAppFeature = {
  id: number;
  iconImage: string;
  label: string;
  displayOrder: number;
};

type CarouselFormData = { image: string; alt: string; mediaType: string; displayOrder: number };
type FeatureFormData = { iconImage: string; label: string; displayOrder: number };

export default function FeaturedAppPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const pathname = usePathname();
  const [content, setContent] = useState<FeaturedAppContent>({
    headerImage: '',
    itemType: 'app',
    downloadText: 'Download now via',
    appStoreImage: '',
    googlePlayImage: '',
    appGalleryImage: '',
    visitText: 'Visit the link to',
    websiteUrl: '',
    logoImage: '',
    gradientFrom: '#2563eb',
    gradientTo: '#1e40af',
    gradientDirection: 'to-r',
    appLogo: '',
    poweredByImage: '',
    bannerHeight: 'h-60',
  });
  const [carouselImages, setCarouselImages] = useState<FeaturedAppCarouselImage[]>([]);
  const [features, setFeatures] = useState<FeaturedAppFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  
  const [isCarouselDialogOpen, setIsCarouselDialogOpen] = useState(false);
  const [editingCarouselImage, setEditingCarouselImage] = useState<FeaturedAppCarouselImage | null>(null);
  const [formCarouselImage, setFormCarouselImage] = useState<CarouselFormData>({
    image: '',
    alt: '',
    mediaType: 'image',
    displayOrder: 0,
  });
  const [savingCarouselImage, setSavingCarouselImage] = useState(false);
  const [carouselOrderError, setCarouselOrderError] = useState<string>('');

  // Feature Dialog states
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeaturedAppFeature | null>(null);
  const [formFeature, setFormFeature] = useState<FeatureFormData>({
    iconImage: '',
    label: '',
    displayOrder: 0,
  });
  const [savingFeature, setSavingFeature] = useState(false);
  const [featureOrderError, setFeatureOrderError] = useState<string>('');

  const carouselDraftId = editingCarouselImage?.id ?? 'new';
  const { showRestorePrompt: showCarouselRestorePrompt, draftMeta: carouselDraftMeta, saveDraft: saveCarouselDraft, clearDraft: clearCarouselDraft, restoreDraft: restoreCarouselDraft, dismissDraft: dismissCarouselDraft } = useDraftPersistence<CarouselFormData>({
    entity: 'featured-app-carousel',
    id: carouselDraftId,
    route: pathname,
    debounceMs: 500,
  });
  const featureDraftId = editingFeature?.id ?? 'new';
  const { showRestorePrompt: showFeatureRestorePrompt, draftMeta: featureDraftMeta, saveDraft: saveFeatureDraft, clearDraft: clearFeatureDraft, restoreDraft: restoreFeatureDraft, dismissDraft: dismissFeatureDraft } = useDraftPersistence<FeatureFormData>({
    entity: 'featured-app-feature',
    id: featureDraftId,
    route: pathname,
    debounceMs: 500,
  });

  const handleCarouselFormChange = useCallback((updates: Partial<CarouselFormData>) => {
    setFormCarouselImage(prev => {
      const newData = { ...prev, ...updates };
      if (isCarouselDialogOpen && (newData.image?.trim() || newData.alt?.trim())) saveCarouselDraft(newData);
      return newData;
    });
  }, [isCarouselDialogOpen, saveCarouselDraft]);
  const handleRestoreCarouselDraft = useCallback(() => {
    const restored = restoreCarouselDraft();
    if (restored) {
      setFormCarouselImage(restored);
      if (!isCarouselDialogOpen) setIsCarouselDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [restoreCarouselDraft, toast, isCarouselDialogOpen]);
  const handleDismissCarouselDraft = useCallback(() => dismissCarouselDraft(), [dismissCarouselDraft]);

  const handleFeatureFormChange = useCallback((updates: Partial<FeatureFormData>) => {
    setFormFeature(prev => {
      const newData = { ...prev, ...updates };
      if (isFeatureDialogOpen && (newData.iconImage?.trim() || newData.label?.trim())) saveFeatureDraft(newData);
      return newData;
    });
  }, [isFeatureDialogOpen, saveFeatureDraft]);
  const handleRestoreFeatureDraft = useCallback(() => {
    const restored = restoreFeatureDraft();
    if (restored) {
      setFormFeature(restored);
      if (!isFeatureDialogOpen) setIsFeatureDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [restoreFeatureDraft, toast, isFeatureDialogOpen]);
  const handleDismissFeatureDraft = useCallback(() => dismissFeatureDraft(), [dismissFeatureDraft]);

  useEffect(() => {
    fetchContent();
    fetchCarouselImages();
    fetchFeatures();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await fetch('/api/admin/featured-app');
      if (response.ok) {
      const data = await response.json();
      setContent({
        headerImage: data.headerImage || data.header_image || '',
        itemType: (data.itemType || data.item_type || 'app') as 'app' | 'website',
        downloadText: data.downloadText || data.download_text || 'Download now via',
        appStoreImage: data.appStoreImage || data.app_store_image || '',
        googlePlayImage: data.googlePlayImage || data.google_play_image || '',
        appGalleryImage: data.appGalleryImage || data.app_gallery_image || '',
        visitText: data.visitText || data.visit_text || 'Visit the link to',
        websiteUrl: data.websiteUrl || data.website_url || '',
        logoImage: data.logoImage || data.logo_image || '',
        gradientFrom: data.gradientFrom || data.gradient_from || '#2563eb',
        gradientTo: data.gradientTo || data.gradient_to || '#1e40af',
        gradientDirection: data.gradientDirection || data.gradient_direction || 'to-r',
        appLogo: data.appLogo || data.app_logo || '',
        poweredByImage: data.poweredByImage || data.powered_by_image || '',
        bannerHeight: data.bannerHeight || data.banner_height || 'h-60',
      });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCarouselImages = async () => {
    try {
      const response = await fetch('/api/admin/featured-app/carousel');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: FeaturedAppCarouselImage, b: FeaturedAppCarouselImage) => a.displayOrder - b.displayOrder);
        setCarouselImages(sortedData);
      }
    } catch (error) {
      console.error('Error fetching carousel images:', error);
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/admin/featured-app/features');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a: FeaturedAppFeature, b: FeaturedAppFeature) => a.displayOrder - b.displayOrder);
        setFeatures(sortedData);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/featured-app', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      });

      if (response.ok) {
        toast.success('Featured App content updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update content' }));
        toast.error(errorData.error || 'Failed to update content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const isNumericId = (value: string | null | undefined) =>
    !!value && /^\d+$/.test(value.trim());

  const getMediaUrl = (value: string | null, kind: 'image' | 'video' = 'image'): string => {
    if (!value) return '';
    if (value.startsWith('/api/images/') || value.startsWith('/api/media/') || value.startsWith('http') || value.startsWith('/')) {
      return value;
    }
    
    if (kind === 'video' && isNumericId(value)) {
      return `/api/media/${value}`;
    }
    return `/api/images/${value}`;
  };

  
  const getImageUrl = (imageId: string | null): string => getMediaUrl(imageId, 'image');

  
  const usedCarouselOrders = carouselImages.filter(img => img.id !== editingCarouselImage?.id).map(img => img.displayOrder);
  const getNextAvailableCarouselOrder = () => {
    let order = 0;
    while (usedCarouselOrders.includes(order)) { order++; }
    return order;
  };

  const handleOpenAddCarouselDialog = () => {
    setEditingCarouselImage(null);
    setFormCarouselImage({
      image: '',
      alt: '',
      mediaType: 'image',
      displayOrder: getNextAvailableCarouselOrder(),
    });
    setCarouselOrderError('');
    setIsCarouselDialogOpen(true);
  };

  const handleOpenEditCarouselDialog = (image: FeaturedAppCarouselImage) => {
    setEditingCarouselImage(image);
    setFormCarouselImage({
      image: image.image,
      alt: image.alt,
      mediaType: image.mediaType || 'image',
      displayOrder: image.displayOrder,
    });
    setCarouselOrderError('');
    setIsCarouselDialogOpen(true);
  };

  const handleCloseCarouselDialog = () => {
    setIsCarouselDialogOpen(false);
    setEditingCarouselImage(null);
    setFormCarouselImage({
      image: '',
      alt: '',
      mediaType: 'image',
      displayOrder: getNextAvailableCarouselOrder(),
    });
    setCarouselOrderError('');
  };

  const handleSaveCarouselImage = async () => {
    setCarouselOrderError('');

    if (!formCarouselImage.image || (typeof formCarouselImage.image === 'string' && formCarouselImage.image.trim() === '')) {
      toast.error(formCarouselImage.mediaType === 'video' ? 'Please upload a video file' : 'Please select an image');
      return;
    }

    if (usedCarouselOrders.includes(formCarouselImage.displayOrder)) {
      setCarouselOrderError(`Order ${formCarouselImage.displayOrder} is already taken. Next available: ${getNextAvailableCarouselOrder()}`);
      return;
    }

    setSavingCarouselImage(true);
    const token = localStorage.getItem('admin_token');
    try {
      const url = editingCarouselImage
        ? `/api/admin/featured-app/carousel/${editingCarouselImage.id}`
        : '/api/admin/featured-app/carousel';
      const method = editingCarouselImage ? 'PUT' : 'POST';

      
      const dataToSend = {
        image: formCarouselImage.image, 
        alt: formCarouselImage.alt,
        mediaType: formCarouselImage.mediaType,
        displayOrder: formCarouselImage.displayOrder,
      };

      console.log('Saving carousel item:', dataToSend);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        clearCarouselDraft();
        const result = await response.json();
        console.log('Save response:', result);
        toast.success(editingCarouselImage ? 'Carousel item updated successfully!' : 'Carousel item added successfully!');
        handleCloseCarouselDialog();
        fetchCarouselImages();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Save failed:', errorData);
        toast.error(errorData.error || 'Failed to save carousel item');
      }
    } catch (error) {
      console.error('Error saving carousel item:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingCarouselImage(false);
    }
  };

  const handleDeleteCarouselImage = async (image: FeaturedAppCarouselImage) => {
    const confirmed = await confirm(
      `Are you sure you want to delete this carousel image?`
    );
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/featured-app/carousel/${image.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Carousel image deleted successfully!');
        fetchCarouselImages();
      } else {
        toast.error('Failed to delete carousel image');
      }
    } catch (error) {
      console.error('Error deleting carousel image:', error);
      toast.error('An error occurred while deleting');
    }
  };

  
  const usedFeatureOrders = features.filter(f => f.id !== editingFeature?.id).map(f => f.displayOrder);
  const getNextAvailableFeatureOrder = () => {
    let order = 0;
    while (usedFeatureOrders.includes(order)) { order++; }
    return order;
  };

  const handleOpenAddFeatureDialog = () => {
    setEditingFeature(null);
    setFormFeature({
      iconImage: '',
      label: '',
      displayOrder: getNextAvailableFeatureOrder(),
    });
    setFeatureOrderError('');
    setIsFeatureDialogOpen(true);
  };

  const handleOpenEditFeatureDialog = (feature: FeaturedAppFeature) => {
    setEditingFeature(feature);
    setFormFeature({
      iconImage: feature.iconImage,
      label: feature.label,
      displayOrder: feature.displayOrder,
    });
    setFeatureOrderError('');
    setIsFeatureDialogOpen(true);
  };

  const handleCloseFeatureDialog = () => {
    setIsFeatureDialogOpen(false);
    setEditingFeature(null);
    setFormFeature({
      iconImage: '',
      label: '',
      displayOrder: getNextAvailableFeatureOrder(),
    });
    setFeatureOrderError('');
  };

  const handleSaveFeature = async () => {
    setFeatureOrderError('');

    if (!formFeature.iconImage) {
      toast.error('Please select an icon image');
      return;
    }

    
    if (typeof formFeature.iconImage === 'string' && formFeature.iconImage.trim() === '') {
      toast.error('Please select an icon image');
      return;
    }

    if (!formFeature.label || formFeature.label.trim() === '') {
      toast.error('Please enter a label');
      return;
    }

    if (usedFeatureOrders.includes(formFeature.displayOrder)) {
      setFeatureOrderError(`Order ${formFeature.displayOrder} is already taken. Next available: ${getNextAvailableFeatureOrder()}`);
      return;
    }

    setSavingFeature(true);
    const token = localStorage.getItem('admin_token');
    try {
      const url = editingFeature
        ? `/api/admin/featured-app/features/${editingFeature.id}`
        : `/api/admin/featured-app/features`;
      const method = editingFeature ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formFeature),
      });

      if (response.ok) {
        clearFeatureDraft();
        toast.success(editingFeature ? 'Feature updated successfully!' : 'Feature added successfully!');
        handleCloseFeatureDialog();
        fetchFeatures();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save feature:', errorData);
        toast.error(errorData.error || 'Failed to save feature');
      }
    } catch (error) {
      console.error('Error saving feature:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingFeature(false);
    }
  };

  const handleDeleteFeature = async (feature: FeaturedAppFeature) => {
    const confirmed = await confirm(
      `Are you sure you want to delete the feature "${feature.label}"?`
    );
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/featured-app/features/${feature.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Feature deleted successfully!');
        fetchFeatures();
      } else {
        toast.error('Failed to delete feature');
      }
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('An error occurred while deleting');
    }
  };

  if (loading) {
    return <Loading message="Loading Featured App content" />;
  }

      return (
        <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Featured App Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the Featured App section images and content
        </p>
        <div className="mt-4 flex gap-2 p-1 bg-muted/50 rounded-lg border border-border w-fit">
          <a href="#main-config" className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-background transition-colors">Main Configuration</a>
          <a href="#carousel-media" className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-background transition-colors">Carousel Media</a>
          <a href="#banner-features" className="px-4 py-1.5 text-sm font-medium rounded-md hover:bg-background transition-colors">Banner Features</a>
        </div>
      </div>

      {}
      <form id="featured-app-form" onSubmit={(e) => { e.preventDefault(); handleSaveContent(); }} className="space-y-8">
      <Card id="main-config" className="rounded-xl border border-border bg-white shadow-sm w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Main Configuration</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload images for the header banner, download badges, and logo
            </p>
          </div>
        </div>
        <div className="p-6">
          <div className="max-w-4xl space-y-8">
          {}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-3">Section Type & Links</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemType" className="text-sm font-medium">
                Section Type
              </Label>
              <select
                id="itemType"
                value={content.itemType}
                onChange={(e) => setContent({ ...content, itemType: e.target.value as 'app' | 'website' })}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="app">App</option>
                <option value="website">Website</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Choose whether this section features an app (with download badges) or a website (with a visit link and logo)
              </p>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-3">Banner Style</h3>
            </div>
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
              <Label className="text-sm font-medium">Banner Gradient Background</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradientFrom" className="text-xs">From Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="gradientFrom"
                    value={content.gradientFrom}
                    onChange={(e) => setContent({ ...content, gradientFrom: e.target.value })}
                    className="h-10 w-16 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={content.gradientFrom}
                    onChange={(e) => setContent({ ...content, gradientFrom: e.target.value })}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradientTo" className="text-xs">To Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="gradientTo"
                    value={content.gradientTo}
                    onChange={(e) => setContent({ ...content, gradientTo: e.target.value })}
                    className="h-10 w-16 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={content.gradientTo}
                    onChange={(e) => setContent({ ...content, gradientTo: e.target.value })}
                    placeholder="#1e40af"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradientDirection" className="text-xs">Direction</Label>
                <select
                  id="gradientDirection"
                  value={content.gradientDirection}
                  onChange={(e) => setContent({ ...content, gradientDirection: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="to-r">To Right</option>
                  <option value="to-l">To Left</option>
                  <option value="to-b">To Bottom</option>
                  <option value="to-t">To Top</option>
                  <option value="to-br">To Bottom Right</option>
                  <option value="to-bl">To Bottom Left</option>
                  <option value="to-tr">To Top Right</option>
                  <option value="to-tl">To Top Left</option>
                </select>
              </div>
            </div>
              {}
              <div className="mt-2">
                <div
                  className="h-24 w-full rounded border border-border"
                  style={{
                    background: `linear-gradient(${content.gradientDirection === 'to-r' ? 'to right' : content.gradientDirection === 'to-l' ? 'to left' : content.gradientDirection === 'to-b' ? 'to bottom' : content.gradientDirection === 'to-t' ? 'to top' : content.gradientDirection === 'to-br' ? 'to bottom right' : content.gradientDirection === 'to-bl' ? 'to bottom left' : content.gradientDirection === 'to-tr' ? 'to top right' : 'to top left'}, ${content.gradientFrom}, ${content.gradientTo})`,
                  }}
                />
              </div>
              {}
              <div className="space-y-2">
                <Label htmlFor="bannerHeight" className="text-xs">Banner Height</Label>
                <select
                  id="bannerHeight"
                  value={content.bannerHeight}
                  onChange={(e) => setContent({ ...content, bannerHeight: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="h-32">Small (h-32)</option>
                  <option value="h-40">Medium (h-40)</option>
                  <option value="h-48">Large (h-48)</option>
                  <option value="h-60">Extra Large (h-60)</option>
                  <option value="h-72">XXL (h-72)</option>
                  <option value="h-80">XXXL (h-80)</option>
                  <option value="h-96">Huge (h-96)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Select the height of the banner (Tailwind CSS height classes)
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground mb-3">Branding Images</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="appLogo" className="text-sm font-medium">
                    App Logo (Left Side)
                  </Label>
                </div>
                <MediaPreviewFrame
                  value={content.appLogo}
                  onChange={(imageId) => setContent({ ...content, appLogo: imageId })}
                  getImageUrl={getImageUrl}
                  size="logo"
                />
                <p className="text-xs text-muted-foreground">
                  Logo displayed on the left side of the banner (vertically centered)
                </p>
              </div>

              {}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="poweredByImage" className="text-sm font-medium">
                    Powered By Image (Next to App Logo)
                  </Label>
                </div>
                <MediaPreviewFrame
                  value={content.poweredByImage}
                  onChange={(imageId) => setContent({ ...content, poweredByImage: imageId })}
                  getImageUrl={getImageUrl}
                  size="logo"
                />
                <p className="text-xs text-muted-foreground">
                  Image displayed next to the app logo (e.g., "Powered by: eCPAY")
                </p>
              </div>
            </div>
          </div>

          {}
          {content.itemType === 'app' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium text-foreground mb-3">Download Area</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="downloadText" className="text-sm font-medium">
                    Download Text
                  </Label>
                  <Input
                    id="downloadText"
                    value={content.downloadText}
                    onChange={(e) => setContent({ ...content, downloadText: e.target.value })}
                    placeholder="Download now via"
                  />
                  <p className="text-xs text-muted-foreground">
                    Text displayed before the download badges (e.g., "Download now via")
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Download Badges</Label>
                    <p className="text-xs text-muted-foreground mt-1">Upload badges for app store links</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appStoreImage" className="text-xs font-medium">App Store Badge</Label>
                      <MediaPreviewFrame
                        value={content.appStoreImage}
                        onChange={(imageId) => setContent({ ...content, appStoreImage: imageId })}
                        getImageUrl={getImageUrl}
                        size="badge"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="googlePlayImage" className="text-xs font-medium">Google Play Badge</Label>
                      <MediaPreviewFrame
                        value={content.googlePlayImage}
                        onChange={(imageId) => setContent({ ...content, googlePlayImage: imageId })}
                        getImageUrl={getImageUrl}
                        size="badge"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appGalleryImage" className="text-xs font-medium">App Gallery Badge</Label>
                      <MediaPreviewFrame
                        value={content.appGalleryImage}
                        onChange={(imageId) => setContent({ ...content, appGalleryImage: imageId })}
                        getImageUrl={getImageUrl}
                        size="badge"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {content.itemType === 'website' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visitText" className="text-sm font-medium">
                  Visit Link Text
                </Label>
                <Input
                  id="visitText"
                  value={content.visitText}
                  onChange={(e) => setContent({ ...content, visitText: e.target.value })}
                  placeholder="Visit the link to"
                />
                <p className="text-xs text-muted-foreground">
                  Text displayed before the hyperlink (e.g., "Visit the link to")
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-sm font-medium">
                  Website URL
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={content.websiteUrl}
                  onChange={(e) => setContent({ ...content, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                />
                <p className="text-xs text-muted-foreground">
                  The URL that will be linked (replaces QR codes for website mode)
                </p>
              </div>
            </div>
          )}

          {}
          <div className="space-y-2">
            <Label htmlFor="logoImage" className="text-sm font-medium">
              Logo Image (Footer)
            </Label>
            <MediaPreviewFrame
              value={content.logoImage}
              onChange={(imageId) => setContent({ ...content, logoImage: imageId })}
              getImageUrl={getImageUrl}
              size="logo"
            />
            <p className="text-xs text-muted-foreground">
              Logo displayed on the right side of the footer section (always visible)
            </p>
          </div>
          </div>
        </div>
      </Card>
      </form>

          {}
          <Card id="carousel-media" className="rounded-xl border border-border bg-white shadow-sm w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Carousel Media</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage images and videos displayed in the horizontal carousel
            </p>
          </div>
          <Button onClick={handleOpenAddCarouselDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Carousel Media
          </Button>
        </div>
        <div className="p-6 pb-8">
          {!isCarouselDialogOpen && showCarouselRestorePrompt && carouselDraftMeta && (
            <DraftRestorePrompt
              savedAt={carouselDraftMeta.savedAt}
              onRestore={handleRestoreCarouselDraft}
              onDismiss={handleDismissCarouselDraft}
            />
          )}
          {carouselImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No carousel media yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add images or videos to the carousel</p>
              <Button onClick={handleOpenAddCarouselDialog} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add First Media
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {carouselImages.map((img) => {
                const isVideo =
                  img.mediaType === 'video' ||
                  (img.image && (img.image.endsWith('.mp4') || img.image.endsWith('.webm') || img.image.endsWith('.mov')));
                const displayUrl = getMediaUrl(img.image, isVideo ? 'video' : 'image');
                return (
                  <div
                    key={img.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                  >
                    {}
                    <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
                      {displayUrl ? (
                        isVideo ? (
                          <video
                            src={displayUrl}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <Image
                            src={displayUrl}
                            alt={img.alt}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <span className="text-2xl">📁</span>
                        </div>
                      )}
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {img.alt || (isVideo ? 'Video' : 'Image')}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {isVideo ? 'Video' : 'Image'}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Order: {img.displayOrder}
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditCarouselDialog(img)}
                        className="h-9"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCarouselImage(img)}
                        className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
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

          {}
          <Card id="banner-features" className="rounded-xl border border-border bg-white shadow-sm w-full min-w-0 max-w-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Banner Features</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage feature icons displayed in the bottom right of the banner
            </p>
          </div>
          <Button onClick={handleOpenAddFeatureDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Feature
          </Button>
        </div>
        <div className="p-6 pb-8">
          {!isFeatureDialogOpen && showFeatureRestorePrompt && featureDraftMeta && (
            <DraftRestorePrompt
              savedAt={featureDraftMeta.savedAt}
              onRestore={handleRestoreFeatureDraft}
              onDismiss={handleDismissFeatureDraft}
            />
          )}
          {features.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No features yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add feature icons to the banner</p>
              <Button onClick={handleOpenAddFeatureDialog} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add First Feature
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {features.map((feature) => {
                const iconUrl = getImageUrl(feature.iconImage);
                return (
                  <div
                    key={feature.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                  >
                    {}
                    <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                      {iconUrl ? (
                        <Image
                          src={iconUrl}
                          alt={feature.label}
                          width={48}
                          height={48}
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No icon</span>
                      )}
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {feature.label}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Order: {feature.displayOrder}
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditFeatureDialog(feature)}
                        className="h-9"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFeature(feature)}
                        className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
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

      {}
      <StickyFooter formId="featured-app-form" saving={saving} />

      {}
      <Dialog
        open={isFeatureDialogOpen}
        onOpenChange={setIsFeatureDialogOpen}
        title={editingFeature ? 'Edit Feature' : 'Add Feature'}
      >
        <div className="space-y-4 mb-6">
          {isFeatureDialogOpen && showFeatureRestorePrompt && featureDraftMeta && (
            <DraftRestorePrompt
              savedAt={featureDraftMeta.savedAt}
              onRestore={handleRestoreFeatureDraft}
              onDismiss={handleDismissFeatureDraft}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="feature-icon-upload">Icon Image</Label>
            <ImageUpload
              value={formFeature.iconImage}
              onChange={(imageId) => handleFeatureFormChange({ iconImage: imageId })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-label">Label</Label>
            <Input
              id="feature-label"
              value={formFeature.label}
              onChange={(e) => handleFeatureFormChange({ label: e.target.value })}
              placeholder="Pay Bills"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-order">Display Order</Label>
            <Input
              id="feature-order"
              type="number"
              value={formFeature.displayOrder}
              onChange={(e) => handleFeatureFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            {featureOrderError && (
              <p className="text-sm text-destructive">{featureOrderError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseFeatureDialog}
            disabled={savingFeature}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveFeature}
            disabled={savingFeature}
          >
            {savingFeature ? 'Saving...' : editingFeature ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {}
      <Dialog
        open={isCarouselDialogOpen}
        onOpenChange={setIsCarouselDialogOpen}
        title={editingCarouselImage ? 'Edit Carousel Media' : 'Add Carousel Media'}
      >
        <div className="space-y-4 mb-6">
          {isCarouselDialogOpen && showCarouselRestorePrompt && carouselDraftMeta && (
            <DraftRestorePrompt
              savedAt={carouselDraftMeta.savedAt}
              onRestore={handleRestoreCarouselDraft}
              onDismiss={handleDismissCarouselDraft}
            />
          )}
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
            <Label htmlFor="carousel-media-type">Media Type</Label>
            <select
              id="carousel-media-type"
              value={formCarouselImage.mediaType}
              onChange={(e) => handleCarouselFormChange({ mediaType: e.target.value })}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="carousel-image-upload">{formCarouselImage.mediaType === 'video' ? 'Video' : 'Image'}</Label>
            <ImageUpload
              value={formCarouselImage.image}
              onChange={(imageId) => handleCarouselFormChange({ image: imageId })}
              acceptVideo={formCarouselImage.mediaType === 'video'}
              mediaType={formCarouselImage.mediaType === 'video' ? 'video' : 'image'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carousel-image-alt">Alt Text</Label>
            <Input
              id="carousel-image-alt"
              type="text"
              value={formCarouselImage.alt}
              onChange={(e) => handleCarouselFormChange({ alt: e.target.value })}
              placeholder={formCarouselImage.mediaType === 'video' ? 'Featured app carousel video' : 'Featured app carousel image'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carousel-image-order">Display Order</Label>
            <Input
              id="carousel-image-order"
              type="number"
              value={formCarouselImage.displayOrder}
              onChange={(e) => handleCarouselFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            {carouselOrderError && (
              <p className="text-sm text-destructive">{carouselOrderError}</p>
            )}
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseCarouselDialog}
            disabled={savingCarouselImage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCarouselImage}
            disabled={savingCarouselImage}
          >
            {savingCarouselImage ? 'Saving...' : editingCarouselImage ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

