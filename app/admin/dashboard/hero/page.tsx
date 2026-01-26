'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Input } from '@/app/components/ui/input';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { HtmlTips } from '@/app/components/ui/html-tips';

type HeroSection = {
  id: number;
  weMakeItLogo: string | null;
  isLogo: string | null;
  fullLogo: string | null;
  backgroundImage: string | null;
  backgroundVideo: string | null;
};

type HeroTickerItem = {
  id: number;
  text: string;
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
  });
  const [heroTickerItems, setHeroTickerItems] = useState<HeroTickerItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dialog state management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTickerItem, setEditingTickerItem] = useState<HeroTickerItem | null>(null);
  const [formText, setFormText] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [savingTickerItem, setSavingTickerItem] = useState(false);

  useEffect(() => {
    fetchHeroSection();
    fetchHeroTickerItems();
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Hero section management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the hero section logos and announcement text bar.
        </p>
      </div>

      {/* Hero Section Logos */}
      <Card className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-medium text-foreground">Hero section logos</h2>
        
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
            <p className="text-xs text-muted-foreground">
              
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveHeroSection} disabled={saving}>
            {saving ? 'Saving...' : 'Save Hero Section'}
          </Button>
        </div>
      </Card>

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {heroTickerItems.map((item) => (
              <Card
                key={item.id}
                className="group relative rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Display Order Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                    Order: {item.displayOrder}
                  </span>
                </div>

                {/* Text Content */}
                <div className="px-4 pt-4 pb-3">
                  <p className="text-sm text-foreground line-clamp-3 pr-12">
                    {item.text}
                  </p>
                  {item.text.includes('[') && item.text.includes('](') && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Contains link
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-3 flex gap-2 px-4 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditDialog(item)}
                    className="flex-1"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTickerItem(item.id)}
                    className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        </div>
      </Card>

      {/* Add/Edit Dialog */}
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
    </div>
  );
}

