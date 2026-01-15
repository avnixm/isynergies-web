'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
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
  const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<Statistic | null>(null);
  const [editingTicker, setEditingTicker] = useState<TickerItem | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [tickerOrderError, setTickerOrderError] = useState<string>('');
  const [savingStat, setSavingStat] = useState(false);
  const [savingTicker, setSavingTicker] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    displayOrder: 0,
  });
  const [tickerFormData, setTickerFormData] = useState({
    text: '',
    displayOrder: 0,
  });

  const usedOrders = statistics.filter(s => s.id !== editingStat?.id).map(s => s.displayOrder);
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) { order++; }
    return order;
  };

  const tickerUsedOrders = tickerItems.filter(t => t.id !== editingTicker?.id).map(t => t.displayOrder);
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

  const handleOpenAddStatDialog = () => {
    setEditingStat(null);
    setFormData({
      label: '',
      value: '',
      displayOrder: getNextAvailableOrder(),
    });
    setOrderError('');
    setIsStatDialogOpen(true);
  };

  const handleOpenEditStatDialog = (stat: Statistic) => {
    setEditingStat(stat);
    setFormData({
      label: stat.label,
      value: stat.value,
      displayOrder: stat.displayOrder,
    });
    setOrderError('');
    setIsStatDialogOpen(true);
  };

  const handleCloseStatDialog = () => {
    setIsStatDialogOpen(false);
    setEditingStat(null);
    setFormData({
      label: '',
      value: '',
      displayOrder: getNextAvailableOrder(),
    });
    setOrderError('');
  };

  const handleSaveStat = async () => {
    setOrderError('');

    if (usedOrders.includes(formData.displayOrder)) {
      setOrderError(`Order ${formData.displayOrder} is already taken. Next available: ${getNextAvailableOrder()}`);
      return;
    }

    if (!formData.label.trim() || !formData.value.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSavingStat(true);
    const token = localStorage.getItem('admin_token');

    try {
      const url = editingStat ? `/api/admin/statistics/${editingStat.id}` : '/api/admin/statistics';
      const method = editingStat ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingStat ? 'Statistic updated successfully!' : 'Statistic added successfully!');
        handleCloseStatDialog();
        fetchStatistics();
      } else {
        toast.error('Failed to save statistic');
      }
    } catch (error) {
      console.error('Error saving statistic:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingStat(false);
    }
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

  const handleOpenAddTickerDialog = () => {
    setEditingTicker(null);
    setTickerFormData({
      text: '',
      displayOrder: getNextAvailableTickerOrder(),
    });
    setTickerOrderError('');
    setIsTickerDialogOpen(true);
  };

  const handleOpenEditTickerDialog = (item: TickerItem) => {
    setEditingTicker(item);
    setTickerFormData({
      text: item.text,
      displayOrder: item.displayOrder,
    });
    setTickerOrderError('');
    setIsTickerDialogOpen(true);
  };

  const handleCloseTickerDialog = () => {
    setIsTickerDialogOpen(false);
    setEditingTicker(null);
    setTickerFormData({
      text: '',
      displayOrder: getNextAvailableTickerOrder(),
    });
    setTickerOrderError('');
  };

  const handleSaveTicker = async () => {
    setTickerOrderError('');

    if (tickerUsedOrders.includes(tickerFormData.displayOrder)) {
      setTickerOrderError(`Order ${tickerFormData.displayOrder} is already taken. Next available: ${getNextAvailableTickerOrder()}`);
      return;
    }

    if (!tickerFormData.text.trim()) {
      toast.error('Please enter ticker text');
      return;
    }

    setSavingTicker(true);
    const token = localStorage.getItem('admin_token');

    try {
      const url = editingTicker ? `/api/admin/ticker/${editingTicker.id}` : '/api/admin/ticker';
      const method = editingTicker ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tickerFormData),
      });

      if (response.ok) {
        toast.success(editingTicker ? 'Ticker item updated successfully!' : 'Ticker item added successfully!');
        handleCloseTickerDialog();
        fetchTickerItems();
      } else {
        toast.error('Failed to save ticker item');
      }
    } catch (error) {
      console.error('Error saving ticker item:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingTicker(false);
    }
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading services" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Services management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the statistics and ticker items in the Services section.
          </p>
        </div>
        <Button onClick={handleOpenAddStatDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Statistic
        </Button>
      </div>

      {/* Statistics Grid */}
      <div>
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
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditStatDialog(stat)} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(stat.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Ticker bar items</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the scrolling text items in the ticker bar.
            </p>
          </div>
          <Button onClick={handleOpenAddTickerDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Ticker Item
          </Button>
        </div>

        {/* Ticker Grid */}
        <div>
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
                          <Button variant="outline" size="sm" onClick={() => handleOpenEditTickerDialog(item)}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleTickerDelete(item.id)} className="text-muted-foreground hover:text-destructive">
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

      {/* Statistics Dialog */}
      <Dialog
        open={isStatDialogOpen}
        onOpenChange={setIsStatDialogOpen}
        title={editingStat ? 'Edit Statistic' : 'Add New Statistic'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-label">Label</Label>
            <Input
              id="dialog-label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="e.g., Clients, Projects, Customers"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-value">Value</Label>
            <Input
              id="dialog-value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="e.g., 30+, 5000+, 100+"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-displayOrder">Display Order</Label>
            <Input
              id="dialog-displayOrder"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => {
                setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 });
                setOrderError('');
              }}
              placeholder="0"
              className={orderError ? 'border-red-500' : ''}
            />
            {orderError && <p className="text-xs text-red-600">{orderError}</p>}
            <p className="text-xs text-muted-foreground">
              Used: {usedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableOrder()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCloseStatDialog}
            disabled={savingStat}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveStat}
            disabled={savingStat}
          >
            {savingStat ? 'Saving...' : editingStat ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Ticker Dialog */}
      <Dialog
        open={isTickerDialogOpen}
        onOpenChange={setIsTickerDialogOpen}
        title={editingTicker ? 'Edit Ticker Item' : 'Add Ticker Item'}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-tickerText">Text</Label>
            <Input
              id="dialog-tickerText"
              value={tickerFormData.text}
              onChange={(e) => setTickerFormData({ ...tickerFormData, text: e.target.value.toUpperCase() })}
              placeholder="e.g., SOFTWARE DEVELOPMENT"
              required
            />
            <p className="text-xs text-muted-foreground">Text will be displayed in uppercase</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-tickerDisplayOrder">Display Order</Label>
            <Input
              id="dialog-tickerDisplayOrder"
              type="number"
              value={tickerFormData.displayOrder}
              onChange={(e) => {
                setTickerFormData({ ...tickerFormData, displayOrder: parseInt(e.target.value) || 0 });
                setTickerOrderError('');
              }}
              placeholder="0"
              className={tickerOrderError ? 'border-red-500' : ''}
            />
            {tickerOrderError && <p className="text-xs text-red-600">{tickerOrderError}</p>}
            <p className="text-xs text-muted-foreground">
              Used: {tickerUsedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableTickerOrder()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCloseTickerDialog}
            disabled={savingTicker}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTicker}
            disabled={savingTicker}
          >
            {savingTicker ? 'Saving...' : editingTicker ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
