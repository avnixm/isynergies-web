                                                                                                                                                                                                                                                                                                                                                              'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';
import Image from 'next/image';

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
  displayOrder: number;
};

type FeaturedAppFeature = {
  id: number;
  iconImage: string;
  label: string;
  displayOrder: number;
};

export default function FeaturedAppPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
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

  // Dialog states
  const [isCarouselDialogOpen, setIsCarouselDialogOpen] = useState(false);
  const [editingCarouselImage, setEditingCarouselImage] = useState<FeaturedAppCarouselImage | null>(null);
  const [formCarouselImage, setFormCarouselImage] = useState({
    image: '',
    alt: '',
    displayOrder: 0,
  });
  const [savingCarouselImage, setSavingCarouselImage] = useState(false);
  const [carouselOrderError, setCarouselOrderError] = useState<string>('');

  // Feature Dialog states
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeaturedAppFeature | null>(null);
  const [formFeature, setFormFeature] = useState({
    iconImage: '',
    label: '',
    displayOrder: 0,
  });
  const [savingFeature, setSavingFeature] = useState(false);
  const [featureOrderError, setFeatureOrderError] = useState<string>('');

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
        toast.error('Failed to update content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (imageId: string | null): string => {
    if (!imageId) return '/placeholder-image.png';
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
      return imageId;
    }
    return `/api/images/${imageId}`;
  };

  // Carousel Image Dialog Handlers
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
      displayOrder: getNextAvailableCarouselOrder(),
    });
    setCarouselOrderError('');
  };

  const handleSaveCarouselImage = async () => {
    setCarouselOrderError('');

    if (!formCarouselImage.image || (typeof formCarouselImage.image === 'string' && formCarouselImage.image.trim() === '')) {
      toast.error('Please select an image');
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

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formCarouselImage),
      });

      if (response.ok) {
        toast.success(editingCarouselImage ? 'Carousel image updated successfully!' : 'Carousel image added successfully!');
        handleCloseCarouselDialog();
        fetchCarouselImages();
      } else {
        toast.error('Failed to save carousel image');
      }
    } catch (error) {
      console.error('Error saving carousel image:', error);
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

  // Feature Dialog Handlers
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

    // Check if it's a string and empty
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
        <div className="space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Featured App Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the Featured App section images and content
        </p>
      </div>

      {/* Main Content */}
      <Card className="rounded-xl border border-border bg-white shadow-sm w-full min-w-0 max-w-full">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
          <div>
            <CardTitle className="text-lg font-medium text-foreground">Main Configuration</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload images for the header banner, download badges, and logo
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-6">
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

          {/* Gradient Settings */}
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
            {/* Gradient Preview */}
            <div className="mt-2">
              <div
                className="h-16 w-full rounded border border-border"
                style={{
                  background: `linear-gradient(${content.gradientDirection === 'to-r' ? 'to right' : content.gradientDirection === 'to-l' ? 'to left' : content.gradientDirection === 'to-b' ? 'to bottom' : content.gradientDirection === 'to-t' ? 'to top' : content.gradientDirection === 'to-br' ? 'to bottom right' : content.gradientDirection === 'to-bl' ? 'to bottom left' : content.gradientDirection === 'to-tr' ? 'to top right' : 'to top left'}, ${content.gradientFrom}, ${content.gradientTo})`,
                }}
              />
            </div>
            {/* Banner Height */}
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

          {/* App Logo */}
          <div className="space-y-2">
            <Label htmlFor="appLogo" className="text-sm font-medium">
              App Logo (Left Side)
            </Label>
            <ImageUpload
              value={content.appLogo}
              onChange={(imageId) => setContent({ ...content, appLogo: imageId })}
            />
            <p className="text-xs text-muted-foreground">
              Logo displayed on the left side of the banner (vertically centered)
            </p>
          </div>

          {/* Powered By Image */}
          <div className="space-y-2">
            <Label htmlFor="poweredByImage" className="text-sm font-medium">
              Powered By Image (Next to App Logo)
            </Label>
            <ImageUpload
              value={content.poweredByImage}
              onChange={(imageId) => setContent({ ...content, poweredByImage: imageId })}
            />
            <p className="text-xs text-muted-foreground">
              Image displayed next to the app logo (e.g., "Powered by: eCPAY")
            </p>
          </div>

          {content.itemType === 'app' && (
            <>
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

              <div className="space-y-4">
                <Label className="text-sm font-medium">Download Badges</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appStoreImage" className="text-xs">App Store Badge</Label>
                <ImageUpload
                  value={content.appStoreImage}
                  onChange={(imageId) => setContent({ ...content, appStoreImage: imageId })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googlePlayImage" className="text-xs">Google Play Badge</Label>
                <ImageUpload
                  value={content.googlePlayImage}
                  onChange={(imageId) => setContent({ ...content, googlePlayImage: imageId })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appGalleryImage" className="text-xs">App Gallery Badge</Label>
                <ImageUpload
                  value={content.appGalleryImage}
                  onChange={(imageId) => setContent({ ...content, appGalleryImage: imageId })}
                />
              </div>
            </div>
          </div>
            </>
          )}

          {content.itemType === 'website' && (
            <>
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
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="logoImage" className="text-sm font-medium">
              Logo Image
            </Label>
            <ImageUpload
              value={content.logoImage}
              onChange={(imageId) => setContent({ ...content, logoImage: imageId })}
            />
            <p className="text-xs text-muted-foreground">
              Logo displayed on the right side of the footer section (always visible)
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSaveContent} disabled={saving}>
              {saving ? 'Saving...' : 'Save Content'}
            </Button>
          </div>
        </CardContent>
      </Card>

          {/* Carousel Images */}
          <Card className="rounded-xl border border-border bg-white shadow-sm w-full min-w-0 max-w-full">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
          <div>
            <CardTitle className="text-lg font-medium text-foreground">Carousel Images</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage images displayed in the horizontal carousel
            </p>
          </div>
          <Button onClick={handleOpenAddCarouselDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Carousel Image
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {carouselImages.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground mb-4">No carousel images yet. Add images to the carousel.</p>
              <Button onClick={handleOpenAddCarouselDialog} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add First Image
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carouselImages.map((img) => {
                const imageUrl = getImageUrl(img.image);
                return (
                  <Card key={img.id} className="group relative rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]">
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                        Order: {img.displayOrder}
                      </span>
                    </div>

                    <div className="relative aspect-video w-full bg-gradient-to-br from-muted/50 to-muted overflow-hidden rounded-t-xl">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={img.alt}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted/30">
                          <div className="text-center">
                            <div className="mx-auto mb-2 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <span className="text-2xl">📁</span>
                            </div>
                            <p className="text-xs text-muted-foreground">No image</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground line-clamp-2 pr-12">{img.alt}</p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditCarouselDialog(img)}
                          className="flex-1"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCarouselImage(img)}
                          className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
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

          {/* Features Management */}
          <Card className="rounded-xl border border-border bg-white shadow-sm w-full min-w-0 max-w-full">
        <CardHeader className="flex flex-row items-center justify-between px-6 pt-6 pb-4">
          <div>
            <CardTitle className="text-lg font-medium text-foreground">Banner Features</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage feature icons displayed in the bottom right of the banner
            </p>
          </div>
          <Button onClick={handleOpenAddFeatureDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Feature
          </Button>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {features.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-muted/20">
              <p className="text-sm text-muted-foreground mb-4">No features yet. Add feature icons to the banner.</p>
              <Button onClick={handleOpenAddFeatureDialog} variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add First Feature
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const iconUrl = getImageUrl(feature.iconImage);
                return (
                  <Card key={feature.id} className="group relative rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {iconUrl ? (
                          <div className="flex-shrink-0">
                            <Image
                              src={iconUrl}
                              alt={feature.label}
                              width={40}
                              height={40}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">No icon</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{feature.label}</p>
                          <p className="text-xs text-muted-foreground">Order: {feature.displayOrder}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditFeatureDialog(feature)}
                            className="h-7 w-7 p-0"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteFeature(feature)}
                            className="h-7 w-7 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                            type="button"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Dialog */}
      <Dialog
        open={isFeatureDialogOpen}
        onOpenChange={setIsFeatureDialogOpen}
        title={editingFeature ? 'Edit Feature' : 'Add Feature'}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="feature-icon-upload">Icon Image</Label>
            <ImageUpload
              value={formFeature.iconImage}
              onChange={(imageId) => setFormFeature({ ...formFeature, iconImage: imageId })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-label">Label</Label>
            <Input
              id="feature-label"
              value={formFeature.label}
              onChange={(e) => setFormFeature({ ...formFeature, label: e.target.value })}
              placeholder="Pay Bills"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="feature-order">Display Order</Label>
            <Input
              id="feature-order"
              type="number"
              value={formFeature.displayOrder}
              onChange={(e) => setFormFeature({ ...formFeature, displayOrder: parseInt(e.target.value) || 0 })}
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

      {/* Carousel Image Dialog */}
      <Dialog
        open={isCarouselDialogOpen}
        onOpenChange={setIsCarouselDialogOpen}
        title={editingCarouselImage ? 'Edit Carousel Image' : 'Add Carousel Image'}
      >
        <div className="space-y-4 mb-6">
          <HtmlTips />
          <div className="space-y-2">
            <Label htmlFor="carousel-image-upload">Image</Label>
            <ImageUpload
              value={formCarouselImage.image}
              onChange={(imageId) => setFormCarouselImage({ ...formCarouselImage, image: imageId })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carousel-image-alt">Alt Text</Label>
            <Input
              id="carousel-image-alt"
              type="text"
              value={formCarouselImage.alt}
              onChange={(e) => setFormCarouselImage({ ...formCarouselImage, alt: e.target.value })}
              placeholder="Featured app carousel image"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carousel-image-order">Display Order</Label>
            <Input
              id="carousel-image-order"
              type="number"
              value={formCarouselImage.displayOrder}
              onChange={(e) => setFormCarouselImage({ ...formCarouselImage, displayOrder: parseInt(e.target.value) || 0 })}
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

