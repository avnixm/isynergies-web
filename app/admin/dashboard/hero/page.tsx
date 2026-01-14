'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Input } from '@/app/components/ui/input';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';

type HeroSection = {
  id: number;
  weMakeItLogo: string | null;
  isLogo: string | null;
  fullLogo: string | null;
  backgroundImage: string | null;
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
  });
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroSection();
    fetchHeroImages();
  }, []);

  const fetchHeroSection = async () => {
    try {
      const response = await fetch('/api/admin/hero-section');
      if (response.ok) {
        const data = await response.json();
        setHeroSection(data);
      }
    } catch (error) {
      console.error('Error fetching hero section:', error);
    }
  };

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/admin/hero-images');
      if (response.ok) {
        const data = await response.json();
        setHeroImages(data);
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeroSection = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/hero-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(heroSection),
      });

      if (response.ok) {
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

  const handleAddFilmImage = async () => {
    const newOrder = heroImages.length > 0 
      ? Math.max(...heroImages.map(img => img.displayOrder)) + 1 
      : 0;

    try {
      const response = await fetch('/api/admin/hero-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: '',
          alt: `Film strip image ${newOrder + 1}`,
          displayOrder: newOrder,
        }),
      });

      if (response.ok) {
        toast.success('Film strip image added successfully!');
        fetchHeroImages();
      } else {
        toast.error('Failed to add image');
      }
    } catch (error) {
      console.error('Error adding film image:', error);
      toast.error('An error occurred while adding');
    }
  };

  const handleUpdateFilmImage = async (id: number, image: string, alt: string, displayOrder: number) => {
    try {
      const response = await fetch(`/api/admin/hero-images/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, alt, displayOrder }),
      });

      if (response.ok) {
        toast.success('Film strip image updated successfully!');
        fetchHeroImages();
      } else {
        toast.error('Failed to update image');
      }
    } catch (error) {
      console.error('Error updating film image:', error);
      toast.error('An error occurred while updating');
    }
  };

  const handleDeleteFilmImage = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this image? This action cannot be undone.',
      'Delete Image'
    );
    
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/hero-images/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Image deleted successfully!');
        fetchHeroImages();
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting film image:', error);
      toast.error('An error occurred while deleting');
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
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Hero section management</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage the hero section logos and film strip images.
        </p>
      </div>

      {/* Hero Section Logos */}
      <Card className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-medium text-gray-800">Hero section logos</h2>
        
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

          <div className="space-y-2">
            <Label htmlFor="backgroundImage">Background Image</Label>
            <ImageUpload
              value={heroSection.backgroundImage || ''}
              onChange={(imageId) =>
                setHeroSection({ ...heroSection, backgroundImage: imageId })
              }
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveHeroSection} disabled={saving}>
            {saving ? 'Saving...' : 'Save Hero Section'}
          </Button>
        </div>
      </Card>

      {/* Film Strip Images */}
      <Card className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-800">Film strip images</h2>
        <Button onClick={handleAddFilmImage}>Add Image</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {heroImages.map((heroImage) => (
            <Card key={heroImage.id} className="relative rounded-xl border border-border bg-white p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <Label>Image</Label>
                  <ImageUpload
                    value={heroImage.image}
                    onChange={(imageId) =>
                      handleUpdateFilmImage(
                        heroImage.id,
                        imageId,
                        heroImage.alt,
                        heroImage.displayOrder
                      )
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`alt-${heroImage.id}`}>Alt Text</Label>
                  <Input
                    id={`alt-${heroImage.id}`}
                    type="text"
                    value={heroImage.alt}
                    onChange={(e) => {
                      const updated = heroImages.map((img) =>
                        img.id === heroImage.id ? { ...img, alt: e.target.value } : img
                      );
                      setHeroImages(updated);
                    }}
                    onBlur={() =>
                      handleUpdateFilmImage(
                        heroImage.id,
                        heroImage.image,
                        heroImage.alt,
                        heroImage.displayOrder
                      )
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`order-${heroImage.id}`}>Display Order</Label>
                  <Input
                    id={`order-${heroImage.id}`}
                    type="number"
                    value={heroImage.displayOrder}
                    onChange={(e) => {
                      const updated = heroImages.map((img) =>
                        img.id === heroImage.id
                          ? { ...img, displayOrder: parseInt(e.target.value) }
                          : img
                      );
                      setHeroImages(updated);
                    }}
                    onBlur={() =>
                      handleUpdateFilmImage(
                        heroImage.id,
                        heroImage.image,
                        heroImage.alt,
                        heroImage.displayOrder
                      )
                    }
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={() => handleDeleteFilmImage(heroImage.id)}
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute right-3 top-3"
                  aria-label="Delete film strip image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {heroImages.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-800">
            No film strip images yet. Click &quot;Add Image&quot; to get started.
          </p>
        )}
      </Card>
    </div>
  );
}

