'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { Info } from 'lucide-react';

type Statistic = {
  id: number;
  label: string;
  value: string;
  displayOrder: number;
};

type TickerItem = {
  id: number;
  text: string;
  displayOrder: number;
};

export default function ServicesPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [tickerEditingId, setTickerEditingId] = useState<number | null>(null);
  const [tickerOrderError, setTickerOrderError] = useState<string>('');
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    displayOrder: 0,
  });
  const [tickerFormData, setTickerFormData] = useState({
    text: '',
    displayOrder: 0,
  });

  const usedOrders = statistics.filter(s => s.id !== editingId).map(s => s.displayOrder);
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) { order++; }
    return order;
  };

  const tickerUsedOrders = tickerItems.filter(t => t.id !== tickerEditingId).map(t => t.displayOrder);
  const getNextAvailableTickerOrder = () => {
    let order = 0;
    while (tickerUsedOrders.includes(order)) { order++; }
    return order;
  };

  useEffect(() => {
    fetchStatistics();
    fetchTickerItems();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickerItems = async () => {
    try {
      const response = await fetch('/api/admin/ticker');
      const data = await response.json();
      setTickerItems(data);
    } catch (error) {
      console.error('Error fetching ticker items:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const url = editingId ? `/api/admin/statistics/${editingId}` : '/api/admin/statistics';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'Statistic updated successfully!' : 'Statistic added successfully!');
        fetchStatistics();
        resetForm();
      } else {
        toast.error('Failed to save statistic');
      }
    } catch (error) {
      console.error('Error saving statistic:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleEdit = (stat: Statistic) => {
    setEditingId(stat.id);
    setFormData({
      label: stat.label,
      value: stat.value,
      displayOrder: stat.displayOrder,
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this statistic? This action cannot be undone.',
      'Delete Statistic'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/statistics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Statistic deleted successfully!');
        fetchStatistics();
      } else {
        toast.error('Failed to delete statistic');
      }
    } catch (error) {
      console.error('Error deleting statistic:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setOrderError('');
    setFormData({
      label: '',
      value: '',
      displayOrder: getNextAvailableOrder(),
    });
  };

  const handleTickerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTickerOrderError('');

    if (tickerUsedOrders.includes(tickerFormData.displayOrder)) {
      setTickerOrderError(`Order ${tickerFormData.displayOrder} is already taken. Next available: ${getNextAvailableTickerOrder()}`);
      return;
    }

    const token = localStorage.getItem('admin_token');

    try {
      const url = tickerEditingId ? `/api/admin/ticker/${tickerEditingId}` : '/api/admin/ticker';
      const method = tickerEditingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tickerFormData),
      });

      if (response.ok) {
        toast.success(tickerEditingId ? 'Ticker item updated successfully!' : 'Ticker item added successfully!');
        fetchTickerItems();
        resetTickerForm();
      } else {
        toast.error('Failed to save ticker item');
      }
    } catch (error) {
      console.error('Error saving ticker item:', error);
      toast.error('An error occurred while saving');
    }
  };

  const handleTickerEdit = (item: TickerItem) => {
    setTickerEditingId(item.id);
    setTickerFormData({
      text: item.text,
      displayOrder: item.displayOrder,
    });
  };

  const handleTickerDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this ticker item? This action cannot be undone.',
      'Delete Ticker Item'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/ticker/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Ticker item deleted successfully!');
        fetchTickerItems();
      } else {
        toast.error('Failed to delete ticker item');
      }
    } catch (error) {
      console.error('Error deleting ticker item:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const resetTickerForm = () => {
    setTickerEditingId(null);
    setTickerOrderError('');
    setTickerFormData({
      text: '',
      displayOrder: getNextAvailableTickerOrder(),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading services" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Services management</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage the statistics and ticker items in the Services section.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 rounded-xl border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">
                {editingId ? 'Edit Statistic' : 'Add New Statistic'}
              </CardTitle>
              <CardDescription>
                {editingId ? 'Update statistic information' : 'Add a new number to display'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g., Clients, Projects, Customers"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="e.g., 30+, 5000+, 100+"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => {
                      setFormData({ ...formData, displayOrder: parseInt(e.target.value) });
                      setOrderError('');
                    }}
                    placeholder="0"
                    className={orderError ? 'border-red-500' : ''}
                  />
                  {orderError && <p className="text-xs text-red-600">{orderError}</p>}
                  <p className="text-xs text-gray-800">
                    Used: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableOrder()}
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Update Statistic' : 'Add Statistic'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Grid */}
        <div className="lg:col-span-2">
          {statistics.length === 0 ? (
            <Card className="rounded-xl border border-border bg-white p-12 shadow-sm">
              <div className="text-center">
                <Plus className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                <h3 className="mb-1 text-lg font-medium text-gray-800">No statistics yet</h3>
                <p className="text-sm text-gray-800">Get started by adding your first statistic</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statistics.map((stat) => (
                <Card key={stat.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="mb-2 text-5xl font-bold text-primary">{stat.value}</div>
                      <div className="text-lg font-semibold text-gray-800">{stat.label}</div>
                    </div>
                    <div className="mb-4 flex items-center justify-between text-xs text-gray-800">
                      <span>Order: {stat.displayOrder}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(stat)} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(stat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Information Card */}
      <Card className="rounded-xl border border-blue-200 bg-blue-50/90 shadow-sm">
        <CardContent className="flex items-start gap-3 p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
            <Info className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-semibold text-blue-900">Note</h3>
            <p className="text-sm text-blue-800">
              These statistics are displayed in the &quot;By the Numbers&quot; section on your Services page.
              The hexagonal service icons and description text are managed separately through the website&apos;s design system.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ticker Items Section */}
      <div className="border-t pt-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight">Ticker bar items</h2>
          <p className="mt-1 text-sm text-gray-800">
            Manage the scrolling text items in the ticker bar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticker Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 rounded-xl border border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">
                  {tickerEditingId ? 'Edit Ticker Item' : 'Add Ticker Item'}
                </CardTitle>
                <CardDescription>
                  {tickerEditingId ? 'Update ticker text' : 'Add a new item to the scrolling ticker'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTickerSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tickerText">Text</Label>
                    <Input
                      id="tickerText"
                      value={tickerFormData.text}
                      onChange={(e) => setTickerFormData({ ...tickerFormData, text: e.target.value.toUpperCase() })}
                      placeholder="e.g., SOFTWARE DEVELOPMENT"
                      required
                    />
                    <p className="text-xs text-gray-800">Text will be displayed in uppercase</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tickerDisplayOrder">Display Order</Label>
                    <Input
                      id="tickerDisplayOrder"
                      type="number"
                      value={tickerFormData.displayOrder}
                      onChange={(e) => {
                        setTickerFormData({ ...tickerFormData, displayOrder: parseInt(e.target.value) });
                        setTickerOrderError('');
                      }}
                      placeholder="0"
                      className={tickerOrderError ? 'border-red-500' : ''}
                    />
                    {tickerOrderError && <p className="text-xs text-red-600">{tickerOrderError}</p>}
                    <p className="text-xs text-gray-800">
                      Used: {tickerUsedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableTickerOrder()}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {tickerEditingId ? 'Update Item' : 'Add Item'}
                    </Button>
                    {tickerEditingId && (
                      <Button type="button" variant="outline" onClick={resetTickerForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Ticker Grid */}
          <div className="lg:col-span-2">
            {tickerItems.length === 0 ? (
                <Card className="rounded-xl border border-border bg-white p-12 shadow-sm">
                <div className="text-center">
                  <Plus className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                  <h3 className="mb-1 text-lg font-medium text-gray-800">No ticker items yet</h3>
                  <p className="text-sm text-gray-800">Add items to display in the scrolling ticker bar</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickerItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-800">{item.text}</div>
                          <div className="mt-1 text-xs text-gray-800">Order: {item.displayOrder}</div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button variant="outline" size="sm" onClick={() => handleTickerEdit(item)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleTickerDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
