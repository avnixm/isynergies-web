'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Plus, Trash2, X, Pencil, Info } from 'lucide-react';
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
import Image from 'next/image';
import { useDraftPersistence } from '@/app/lib/use-draft-persistence';
import { DraftRestorePrompt } from '@/app/components/ui/draft-restore-prompt';
import { getCached, setCached } from '../_lib/cache';

type ShopContent = {
  id?: number;
  title: string;
  description: string;
  salesIcon: string;
  authorizedDealerImage: string;
  shopUrl?: string;
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
    description: '',
    salesIcon: '',
    authorizedDealerImage: '',
    shopUrl: '',
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

  const pathname = usePathname();
  const categoryDraftId = editingCategory?.id ?? 'new';
  const dealerDraftId = editingDealer?.id ?? 'new';
  const categoryDraft = useDraftPersistence<Omit<ShopCategory, 'id'>>({
    entity: 'shop-category',
    id: categoryDraftId,
    route: pathname,
    debounceMs: 500,
  });
  const dealerDraft = useDraftPersistence<Omit<AuthorizedDealer, 'id'>>({
    entity: 'shop-dealer',
    id: dealerDraftId,
    route: pathname,
    debounceMs: 500,
  });

  const handleCategoryFormChange = useCallback((updates: Partial<Omit<ShopCategory, 'id'>>) => {
    setCategoryFormData(prev => {
      const newData = { ...prev, ...updates };
      if (isDialogOpen && (newData.name?.trim() || newData.text?.trim())) categoryDraft.saveDraft(newData);
      return newData;
    });
  }, [isDialogOpen, categoryDraft]);
  const handleDealerFormChange = useCallback((updates: Partial<Omit<AuthorizedDealer, 'id'>>) => {
    setDealerFormData(prev => {
      const newData = { ...prev, ...updates };
      if (isDealerDialogOpen && newData.name?.trim()) dealerDraft.saveDraft(newData);
      return newData;
    });
  }, [isDealerDialogOpen, dealerDraft]);

  const handleRestoreCategoryDraft = useCallback(() => {
    const restored = categoryDraft.restoreDraft();
    if (restored) {
      setCategoryFormData(restored);
      if (!isDialogOpen) setIsDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [categoryDraft, toast, isDialogOpen]);
  const handleRestoreDealerDraft = useCallback(() => {
    const restored = dealerDraft.restoreDraft();
    if (restored) {
      setDealerFormData(restored);
      if (!isDealerDialogOpen) setIsDealerDialogOpen(true);
      toast.success('Draft restored');
    }
  }, [dealerDraft, toast, isDealerDialogOpen]);

  useEffect(() => {
    const cached = getCached<{ content: ShopContent; categories: ShopCategory[]; authorizedDealers: AuthorizedDealer[] }>('admin-shop');
    if (cached != null) {
      setContent(cached.content);
      setCategories(cached.categories ?? []);
      setAuthorizedDealers(cached.authorizedDealers ?? []);
      setLoading(false);
      return;
    }
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const [shopResponse, dealersResponse] = await Promise.all([
        fetch('/api/admin/shop'),
        fetch('/api/admin/authorized-dealers'),
      ]);
      let nextContent: ShopContent = content;
      let nextCategories: ShopCategory[] = [];
      let nextDealers: AuthorizedDealer[] = [];
      if (shopResponse.ok) {
        const data = await shopResponse.json();
        if (data.content) {
          nextContent = data.content;
          setContent(data.content);
        }
        if (data.categories) {
          nextCategories = data.categories;
          setCategories(data.categories);
        }
      }
      if (dealersResponse.ok) {
        nextDealers = await dealersResponse.json();
        setAuthorizedDealers(nextDealers);
      }
      setCached('admin-shop', { content: nextContent, categories: nextCategories, authorizedDealers: nextDealers });
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/shop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content, categories }),
      });

      if (response.ok) {
        toast.success('Shop content updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update shop content' }));
        toast.error(errorData.error || 'Failed to update shop content');
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
    
    try {
      const url = editingCategory
        ? `/api/admin/shop/categories/${editingCategory.id}`
        : '/api/admin/shop/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        categoryDraft.clearDraft();
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

    try {
      const response = await fetch(`/api/admin/shop/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Category deleted successfully!');
        fetchShopData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete category' }));
        toast.error(errorData.error || 'Failed to delete category');
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
    
    try {
      const url = editingDealer
        ? `/api/admin/authorized-dealers/${editingDealer.id}`
        : '/api/admin/authorized-dealers';
      const method = editingDealer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dealerFormData),
      });

      if (response.ok) {
        dealerDraft.clearDraft();
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

    try {
      const response = await fetch(`/api/admin/authorized-dealers/${dealerId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Dealer deleted successfully!');
        fetchShopData();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete dealer' }));
        toast.error(errorData.error || 'Failed to delete dealer');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the shop section content and categories
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          <a href="#shop-content" className="text-accent hover:underline">Shop Content</a>
          <a href="#shop-categories" className="text-accent hover:underline">Shop Categories</a>
          <a href="#authorized-dealers" className="text-accent hover:underline">Authorized Dealers</a>
        </div>
      </div>

      <form id="shop-form" onSubmit={handleSubmit} className="space-y-8">
        {}
        <Card id="shop-content" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Shop Content</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Main shop section text and images
              </p>
            </div>
          </div>
          <div className="p-6">
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

              <div className="space-y-2">
                <Label htmlFor="shopUrl">Shop URL</Label>
                <Input
                  id="shopUrl"
                  type="url"
                  value={content.shopUrl || ''}
                  onChange={(e) => setContent({ ...content, shopUrl: e.target.value })}
                  placeholder="https://example.com/shop"
                  className="max-w-2xl"
                />
                <p className="text-xs text-muted-foreground">
                  The URL for the "Visit Shop" button. Leave empty to disable the link.
                </p>
              </div>

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
            </div>
          </div>
        </Card>

        {}
        <Card id="shop-categories" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Shop Categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage product category panels
              </p>
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
          <div className="p-6 pb-8">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                  <Plus className="h-full w-full" />
                </div>
                <h3 className="mb-1 text-lg font-medium text-foreground">No categories yet</h3>
                <p className="text-sm text-muted-foreground">Click "Add Category" to create one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => {
                  const imageUrl = getImageUrl(category.image);
                  return (
                    <div
                      key={category.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                    >
                      {}
                      <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted/30">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={category.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-muted">
                            <span className="text-xs text-muted-foreground">No image</span>
                          </div>
                        )}
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {category.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {category.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Order: {category.displayOrder}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditCategoryDialog(category)}
                          className="h-9"
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
                          className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${category.name}`}
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
        <Card id="authorized-dealers" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Authorized Dealers</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage brand logos displayed in the authorized dealer section
              </p>
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
          <div className="p-6 pb-8">
            {authorizedDealers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                  <Plus className="h-full w-full" />
                </div>
                <h3 className="mb-1 text-lg font-medium text-foreground">No authorized dealers yet</h3>
                <p className="text-sm text-muted-foreground">Click "Add Dealer" to create one</p>
              </div>
            ) : (
              <div className="space-y-2">
                {authorizedDealers.map((dealer) => {
                  const imageUrl = getImageUrl(dealer.image);
                  return (
                    <div
                      key={dealer.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                    >
                      {}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center p-2"
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
                            className="object-contain p-2"
                            unoptimized
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">No logo</span>
                        )}
                      </div>

                      {}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {dealer.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Order: {dealer.displayOrder}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDealerDialog(dealer)}
                          className="h-9"
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
                          className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${dealer.name}`}
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
      </form>

      {}
      <StickyFooter formId="shop-form" saving={saving} />

      {!isDealerDialogOpen && dealerDraft.showRestorePrompt && dealerDraft.draftMeta && (
        <DraftRestorePrompt savedAt={dealerDraft.draftMeta.savedAt} onRestore={handleRestoreDealerDraft} onDismiss={() => dealerDraft.dismissDraft()} />
      )}
      {!isDialogOpen && categoryDraft.showRestorePrompt && categoryDraft.draftMeta && (
        <DraftRestorePrompt savedAt={categoryDraft.draftMeta.savedAt} onRestore={handleRestoreCategoryDraft} onDismiss={() => categoryDraft.dismissDraft()} />
      )}

      {}
      <Dialog
        open={isDealerDialogOpen}
        onOpenChange={(open) => { if (!open) handleCloseDealerDialog(); else setIsDealerDialogOpen(true); }}
        title={editingDealer ? 'Edit Authorized Dealer' : 'Add Authorized Dealer'}
      >
        <div className="space-y-4 mb-6">
          {dealerDraft.showRestorePrompt && dealerDraft.draftMeta && (
            <DraftRestorePrompt savedAt={dealerDraft.draftMeta.savedAt} onRestore={handleRestoreDealerDraft} onDismiss={() => dealerDraft.dismissDraft()} />
          )}
          <div className="space-y-2">
            <Label htmlFor="dialog-dealer-name">Brand Name</Label>
            <Input
              id="dialog-dealer-name"
              value={dealerFormData.name}
              onChange={(e) => handleDealerFormChange({ name: e.target.value })}
              placeholder="e.g., EPSON, ASUS, Samsung"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-dealer-image">Logo Image</Label>
            <ImageUpload
              value={dealerFormData.image}
              onChange={(url) => handleDealerFormChange({ image: url })}
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
              onChange={(e) => handleDealerFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
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

      {}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => { if (!open) handleCloseCategoryDialog(); else setIsDialogOpen(true); }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <div className="space-y-4 mb-6">
          {categoryDraft.showRestorePrompt && categoryDraft.draftMeta && (
            <DraftRestorePrompt savedAt={categoryDraft.draftMeta.savedAt} onRestore={handleRestoreCategoryDraft} onDismiss={() => categoryDraft.dismissDraft()} />
          )}
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
            <Label htmlFor="dialog-category-name">Category Name (Internal)</Label>
            <Input
              id="dialog-category-name"
              value={categoryFormData.name}
              onChange={(e) => handleCategoryFormChange({ name: e.target.value })}
              placeholder="e.g., Laptops"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-category-text">Display Text (Shown on Strip)</Label>
            <Input
              id="dialog-category-text"
              value={categoryFormData.text}
              onChange={(e) => handleCategoryFormChange({ text: e.target.value.toUpperCase() })}
              placeholder="e.g., LAPTOPS"
              required
            />
            <p className="text-xs text-muted-foreground">Text will be displayed in uppercase</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-category-image">Background Image</Label>
            <ImageUpload
              value={categoryFormData.image}
              onChange={(url) => handleCategoryFormChange({ image: url })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-category-order">Display Order</Label>
            <Input
              id="dialog-category-order"
              type="number"
              value={categoryFormData.displayOrder}
              onChange={(e) => handleCategoryFormChange({ displayOrder: parseInt(e.target.value) || 0 })}
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

