'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';

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
  galleryImage: string;
};

type AboutUsGalleryImage = {
  id: number;
  image: string;
  alt: string;
  displayOrder: number;
};

export default function AboutUsPage() {
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
    galleryImage: '',
  });
  const [galleryImages, setGalleryImages] = useState<AboutUsGalleryImage[]>([]);
  const [newGalleryImage, setNewGalleryImage] = useState<{ image: string; alt: string; displayOrder: number }>({
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

  const handleAddGalleryImage = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/about-us/gallery-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newGalleryImage),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Gallery image added.' });
        setNewGalleryImage({ image: '', alt: 'About Us gallery image', displayOrder: 0 });
        await fetchGalleryImages();
      } else {
        setMessage({ type: 'error', text: 'Failed to add gallery image' });
      }
    } catch (error) {
      console.error('Error adding gallery image:', error);
      setMessage({ type: 'error', text: 'An error occurred while adding gallery image' });
    }
  };

  const handleDeleteGalleryImage = async (id: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/about-us/gallery-images/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Gallery image deleted.' });
        await fetchGalleryImages();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete gallery image' });
      }
    } catch (error) {
      console.error('Error deleting gallery image:', error);
      setMessage({ type: 'error', text: 'An error occurred while deleting gallery image' });
    }
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
        <h1 className="text-2xl font-semibold tracking-tight">About Us content</h1>
        <p className="mt-1 text-sm text-gray-800">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gallery Images (multiple) */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Gallery Images (Scrolling)</CardTitle>
            <CardDescription>Add multiple images to scroll infinitely in the About Us section (sorted by displayOrder)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Image</Label>
                <ImageUpload
                  value={newGalleryImage.image}
                  onChange={(v) => setNewGalleryImage((p) => ({ ...p, image: v }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="galleryAlt">Alt</Label>
                <Input
                  id="galleryAlt"
                  value={newGalleryImage.alt}
                  onChange={(e) => setNewGalleryImage((p) => ({ ...p, alt: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="galleryOrder">Display Order</Label>
                <Input
                  id="galleryOrder"
                  type="number"
                  value={newGalleryImage.displayOrder}
                  onChange={(e) => setNewGalleryImage((p) => ({ ...p, displayOrder: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleAddGalleryImage} disabled={!newGalleryImage.image}>
                Add Gallery Image
              </Button>
            </div>

            <div className="space-y-2">
              {galleryImages.length === 0 ? (
                <p className="text-sm text-gray-800">No gallery images yet. Add at least 3 for the best scrolling effect.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {galleryImages.map((gi) => (
                    <div
                      key={gi.id}
                      className="relative flex items-center justify-between rounded-lg border border-border bg-white p-3 shadow-sm"
                    >
                      <div className="min-w-0 pr-8">
                        <div className="truncate text-sm font-medium text-gray-800">
                          #{gi.displayOrder} — {gi.alt}
                        </div>
                        <div className="truncate text-xs text-gray-800">
                          {gi.image}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => handleDeleteGalleryImage(gi.id)}
                        aria-label="Delete gallery image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gallery Image */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Gallery Image</CardTitle>
            <CardDescription>Upload the scrolling carousel image for the About Us section</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.galleryImage}
              onChange={(url) => setFormData({ ...formData, galleryImage: url })}
            />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Main Content</CardTitle>
            <CardDescription>Edit the title and main text paragraphs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph2">Paragraph 2</Label>
              <Textarea
                id="paragraph2"
                value={formData.paragraph2}
                onChange={(e) => setFormData({ ...formData, paragraph2: e.target.value })}
                placeholder="Second paragraph..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph3">Paragraph 3</Label>
              <Textarea
                id="paragraph3"
                value={formData.paragraph3}
                onChange={(e) => setFormData({ ...formData, paragraph3: e.target.value })}
                placeholder="Third paragraph..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph4">Paragraph 4 (can include HTML for bold text)</Label>
              <Textarea
                id="paragraph4"
                value={formData.paragraph4}
                onChange={(e) => setFormData({ ...formData, paragraph4: e.target.value })}
                className="min-h-[100px]"
                placeholder="Fourth paragraph... Use <strong>text</strong> for bold"
                required
              />
              <p className="text-xs text-gray-800">
                Tip: Use &lt;strong&gt;text&lt;/strong&gt; to make text bold
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paragraph5">Paragraph 5</Label>
              <Textarea
                id="paragraph5"
                value={formData.paragraph5}
                onChange={(e) => setFormData({ ...formData, paragraph5: e.target.value })}
                placeholder="Fifth paragraph..."
                required
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
        <div className="flex justify-end">
          <Button type="submit" disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

