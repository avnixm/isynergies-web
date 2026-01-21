'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Plus, Trash2, X, Pencil } from 'lucide-react';
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
import Image from 'next/image';

type ShopContent = {
  id?: number;
  title: string;
  description: string;
  salesIcon: string;
  authorizedDealerImage: string;
};

type ShopCategory = {
  id: number;
  name: string;
  text: string;
  image: string;
  displayOrder: number;
};

type AuthorizedDealer = {
  id: number;
  name: string;
  image: string;
  displayOrder: number;
};

export default function ShopPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [content, setContent] = useState<ShopContent>({
    title: 'Shop',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    salesIcon: '',
    authorizedDealerImage: '',
  });
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [authorizedDealers, setAuthorizedDealers] = useState<AuthorizedDealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ShopCategory | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState<Omit<ShopCategory, 'id'>>({
    name: '',
    text: '',
    image: '',
    displayOrder: 0,
  });
  const [isDealerDialogOpen, setIsDealerDialogOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<AuthorizedDealer | null>(null);
  const [savingDealer, setSavingDealer] = useState(false);
  const [dealerFormData, setDealerFormData] = useState<Omit<AuthorizedDealer, 'id'>>({
    name: '',
    image: '',
    displayOrder: 0,
  });

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const [shopResponse, dealersResponse] = await Promise.all([
        fetch('/api/admin/shop'),
        fetch('/api/admin/authorized-dealers'),
      ]);
      
      if (shopResponse.ok) {
        const data = await shopResponse.json();
        if (data.content) {
          setContent(data.content);
        }
        if (data.categories) {
          setCategories(data.categories);
        }
      }
      
      if (dealersResponse.ok) {
        const dealers = await dealersResponse.json();
        setAuthorizedDealers(dealers);
      }
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch('/api/admin/shop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content, categories }),
      });

      if (response.ok) {
        toast.success('Shop content updated successfully!');
      } else {
        toast.error('Failed to update shop content');
      }
    } catch (error) {
      console.error('Error saving shop:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddCategoryDialog = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      text: '',
      image: '',
      displayOrder: categories.length,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditCategoryDialog = (category: ShopCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      text: category.text,
      image: category.image,
      displayOrder: category.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      text: '',
      image: '',
      displayOrder: 0,
    });
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }
    if (!categoryFormData.text.trim()) {
      toast.error('Please enter display text');
      return;
    }

    setSavingCategory(true);
    const token = localStorage.getItem('admin_token');
    
    try {
      const url = editingCategory
        ? `/api/admin/shop/categories/${editingCategory.id}`
        : '/api/admin/shop/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        toast.success(editingCategory ? 'Category updated successfully!' : 'Category added successfully!');
        handleCloseCategoryDialog();
        await fetchShopData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save category' }));
        toast.error(errorData.error || 'Failed to save category');
        console.error('Failed to save category:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('An error occurred while saving category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this category? This action cannot be undone.',
      'Delete Category'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/shop/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Category deleted successfully!');
        fetchShopData();
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const handleOpenAddDealerDialog = () => {
    setEditingDealer(null);
    setDealerFormData({
      name: '',
      image: '',
      displayOrder: authorizedDealers.length,
    });
    setIsDealerDialogOpen(true);
  };

  const handleOpenEditDealerDialog = (dealer: AuthorizedDealer) => {
    setEditingDealer(dealer);
    setDealerFormData({
      name: dealer.name,
      image: dealer.image,
      displayOrder: dealer.displayOrder,
    });
    setIsDealerDialogOpen(true);
  };

  const handleCloseDealerDialog = () => {
    setIsDealerDialogOpen(false);
    setEditingDealer(null);
    setDealerFormData({
      name: '',
      image: '',
      displayOrder: 0,
    });
  };

  const handleSaveDealer = async () => {
    if (!dealerFormData.name.trim()) {
      toast.error('Please enter a brand name');
      return;
    }
    if (!dealerFormData.image.trim()) {
      toast.error('Please upload a logo');
      return;
    }

    setSavingDealer(true);
    const token = localStorage.getItem('admin_token');
    
    try {
      const url = editingDealer
        ? `/api/admin/authorized-dealers/${editingDealer.id}`
        : '/api/admin/authorized-dealers';
      const method = editingDealer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dealerFormData),
      });

      if (response.ok) {
        toast.success(editingDealer ? 'Dealer updated successfully!' : 'Dealer added successfully!');
        handleCloseDealerDialog();
        await fetchShopData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save dealer' }));
        toast.error(errorData.error || 'Failed to save dealer');
      }
    } catch (error) {
      console.error('Error saving dealer:', error);
      toast.error('An error occurred while saving dealer');
    } finally {
      setSavingDealer(false);
    }
  };

  const handleDeleteDealer = async (dealerId: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this authorized dealer? This action cannot be undone.',
      'Delete Authorized Dealer'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/authorized-dealers/${dealerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Dealer deleted successfully!');
        fetchShopData();
      } else {
        toast.error('Failed to delete dealer');
      }
    } catch (error) {
      console.error('Error deleting dealer:', error);
      toast.error('An error occurred while deleting');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading shop content" size="lg" />
      </div>
    );
  }

  const getImageUrl = (imageId: string) => {
    if (!imageId) return null;
    if (imageId.startsWith('/api/images/') || imageId.startsWith('http') || imageId.startsWith('/')) {
      return imageId;
    }
    return `/api/images/${imageId}`;
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the shop section content and categories
        </p>
      </div>

      <form id="shop-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Content */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Shop Content</CardTitle>
            <CardDescription>Main shop section text and images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <HtmlTips />
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={content.title}
                  onChange={(e) => setContent({ ...content, title: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={content.description}
                onChange={(e) => setContent({ ...content, description: e.target.value })}
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sales Icon (Hexagon)</Label>
                <ImageUpload
                  value={content.salesIcon}
                  onChange={(url) => setContent({ ...content, salesIcon: url })}
                />
                {content.salesIcon && (
                  <div className="relative h-40 w-40 mx-auto rounded-md overflow-hidden border border-gray-200 bg-gradient-to-b from-blue-900 to-blue-950">
                    <Image
                      src={typeof content.salesIcon === 'string' && (content.salesIcon.startsWith('/api/images/') || content.salesIcon.startsWith('http') || content.salesIcon.startsWith('/'))
                        ? content.salesIcon 
                        : `/api/images/${content.salesIcon}`}
                      alt="Sales Icon"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-800">
                  Recommended size: 256×256 PNG with transparent background.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Authorized Dealer Image</Label>
                <ImageUpload
                  value={content.authorizedDealerImage}
                  onChange={(url) => setContent({ ...content, authorizedDealerImage: url })}
                />
                {content.authorizedDealerImage && (
                  <div className="relative h-32 w-full rounded-md overflow-hidden border border-gray-200 bg-gradient-to-b from-blue-900 to-blue-950">
                    <Image
                      src={typeof content.authorizedDealerImage === 'string' && (content.authorizedDealerImage.startsWith('/api/images/') || content.authorizedDealerImage.startsWith('http') || content.authorizedDealerImage.startsWith('/'))
                        ? content.authorizedDealerImage 
                        : `/api/images/${content.authorizedDealerImage}`}
                      alt="Authorized Dealer"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-800">
                  Recommended aspect ratio: 16:9, SVG or PNG format.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shop Categories */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Shop Categories</CardTitle>
                <CardDescription>Manage product category panels</CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleOpenAddCategoryDialog}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No categories yet. Click "Add Category" to create one.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => {
                  const imageUrl = getImageUrl(category.image);
                  return (
                    <Card key={category.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md group">
                      <div className="relative aspect-video w-full bg-muted/30 rounded-t-xl overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 z-10">
                          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                            Order: {category.displayOrder}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="mb-2">
                          <h4 className="font-semibold text-sm text-foreground">{category.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{category.text}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditCategoryDialog(category)}
                            className="flex-1"
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${category.name}`}
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

        {/* Authorized Dealers */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Authorized Dealers</CardTitle>
                <CardDescription>Manage brand logos displayed in the authorized dealer section</CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleOpenAddDealerDialog}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Dealer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {authorizedDealers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No authorized dealers yet. Click "Add Dealer" to create one.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                {authorizedDealers.map((dealer) => {
                  const imageUrl = getImageUrl(dealer.image);
                  return (
                    <Card key={dealer.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md group">
                      <div
                        className="relative aspect-square w-full rounded-t-xl overflow-hidden flex items-center justify-center p-4"
                        style={{
                          background:
                            'linear-gradient(270deg, rgba(65, 65, 65, 0) 0%, #7A0000 33.17%, #930000 55.29%, #7A0000 75%, rgba(65, 65, 65, 0) 100%)',
                        }}
                      >
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={dealer.name}
                            fill
                            className="object-contain p-4"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-xs text-muted-foreground">No logo</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 z-10">
                          <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground border border-border/50">
                            Order: {dealer.displayOrder}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="mb-2">
                          <h4 className="font-semibold text-sm text-foreground">{dealer.name}</h4>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDealerDialog(dealer)}
                            className="flex-1"
                            aria-label={`Edit ${dealer.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteDealer(dealer.id)}
                            className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                            aria-label={`Delete ${dealer.name}`}
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
      </form>

      <div className="flex justify-end">
        <Button
          type="submit"
          form="shop-form"
          onClick={(e) => {
            e.preventDefault();
            const form = document.getElementById('shop-form') as HTMLFormElement | null;
            form?.requestSubmit();
          }}
          disabled={saving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      {/* Add/Edit Dealer Dialog */}
      <Dialog
        open={isDealerDialogOpen}
        onOpenChange={setIsDealerDialogOpen}
        title={editingDealer ? 'Edit Authorized Dealer' : 'Add Authorized Dealer'}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="dialog-dealer-name">Brand Name</Label>
            <Input
              id="dialog-dealer-name"
              value={dealerFormData.name}
              onChange={(e) => setDealerFormData({ ...dealerFormData, name: e.target.value })}
              placeholder="e.g., EPSON, ASUS, Samsung"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-dealer-image">Logo Image</Label>
            <ImageUpload
              value={dealerFormData.image}
              onChange={(url) => setDealerFormData({ ...dealerFormData, image: url })}
            />
            {dealerFormData.image && (
              <div className="relative h-32 w-full rounded-md overflow-hidden border border-gray-200 bg-white flex items-center justify-center p-4">
                <Image
                  src={getImageUrl(dealerFormData.image) || ''}
                  alt="Preview"
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Upload a logo image (PNG, SVG, or JPG recommended)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-dealer-order">Display Order</Label>
            <Input
              id="dialog-dealer-order"
              type="number"
              value={dealerFormData.displayOrder}
              onChange={(e) => setDealerFormData({ ...dealerFormData, displayOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseDealerDialog}
            disabled={savingDealer}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveDealer}
            disabled={savingDealer}
          >
            {savingDealer ? 'Saving...' : editingDealer ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <div className="space-y-4 mb-6">
          <HtmlTips />
          <div className="space-y-2">
            <Label htmlFor="dialog-category-name">Category Name (Internal)</Label>
            <Input
              id="dialog-category-name"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              placeholder="e.g., Laptops"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-category-text">Display Text (Shown on Strip)</Label>
            <Input
              id="dialog-category-text"
              value={categoryFormData.text}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, text: e.target.value.toUpperCase() })}
              placeholder="e.g., LAPTOPS"
              required
            />
            <p className="text-xs text-muted-foreground">Text will be displayed in uppercase</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-category-image">Background Image</Label>
            <ImageUpload
              value={categoryFormData.image}
              onChange={(url) => setCategoryFormData({ ...categoryFormData, image: url })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-category-order">Display Order</Label>
            <Input
              id="dialog-category-order"
              type="number"
              value={categoryFormData.displayOrder}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, displayOrder: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseCategoryDialog}
            disabled={savingCategory}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCategory}
            disabled={savingCategory}
          >
            {savingCategory ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

