'use client';

import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, X } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const response = await fetch('/api/admin/shop');
      const data = await response.json();
      if (data.content) {
        setContent(data.content);
      }
      if (data.categories) {
        setCategories(data.categories);
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

  const handleCategoryChange = (index: number, field: string, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const handleAddCategory = async () => {
    const newCategory: ShopCategory = {
      id: 0, // Temporary ID, will be set by backend
      name: 'New Category',
      text: 'NEW CATEGORY',
      image: '',
      displayOrder: categories.length,
    };

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch('/api/admin/shop/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        toast.success('Category added successfully!');
        fetchShopData();
      } else {
        toast.error('Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('An error occurred while adding category');
    }
  };

  const handleDeleteCategory = async (categoryId: number, index: number) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading shop content" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage the shop section content and categories
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shop Content */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Shop Content</CardTitle>
            <CardDescription>Main shop section text and images</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              <Button type="button" onClick={handleAddCategory} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-800">
                <p className="mb-4">No categories yet. Click "Add Category" to create one.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {categories.map((category, index) => (
                  <div key={category.id} className="relative space-y-3 rounded-lg border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-800">Category {index + 1}</h4>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id, index)}
                        className="h-8 w-8"
                        aria-label="Delete category"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category Name (Internal)</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                        placeholder="e.g., Laptops"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Display Text (Shown on Strip)</Label>
                      <Input
                        value={category.text || category.name.toUpperCase()}
                        onChange={(e) => handleCategoryChange(index, 'text', e.target.value)}
                        placeholder="e.g., LAPTOPS"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Background Image</Label>
                      <ImageUpload
                        value={category.image}
                        onChange={(url) => handleCategoryChange(index, 'image', url)}
                      />
                      {category.image && (
                        <div className="relative h-32 w-full rounded-md overflow-hidden border border-gray-200">
                          <Image
                            src={typeof category.image === 'string' && (category.image.startsWith('/api/images/') || category.image.startsWith('http') || category.image.startsWith('/'))
                              ? category.image 
                              : `/api/images/${category.image}`}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={category.displayOrder}
                        onChange={(e) => handleCategoryChange(index, 'displayOrder', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={saving} className="min-w-[200px]">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

