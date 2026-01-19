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
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Textarea } from '@/app/components/ui/textarea';
import { Info } from 'lucide-react';
import { HtmlTips } from '@/app/components/ui/html-tips';
import Image from 'next/image';

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

type Service = {
  id: number;
  title: string;
  description: string;
  icon: string;
  displayOrder: number;
};

export default function ServicesPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<Statistic | null>(null);
  const [editingTicker, setEditingTicker] = useState<TickerItem | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [tickerOrderError, setTickerOrderError] = useState<string>('');
  const [serviceOrderError, setServiceOrderError] = useState<string>('');
  const [savingStat, setSavingStat] = useState(false);
  const [savingTicker, setSavingTicker] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    displayOrder: 0,
  });
  const [tickerFormData, setTickerFormData] = useState({
    text: '',
    displayOrder: 0,
  });
  const [serviceFormData, setServiceFormData] = useState({
    icon: '',
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

  const serviceUsedOrders = services.filter(s => s.id !== editingService?.id).map(s => s.displayOrder);
  const getNextAvailableServiceOrder = () => {
    let order = 0;
    while (serviceUsedOrders.includes(order)) { order++; }
    return order;
  };

  useEffect(() => {
    fetchStatistics();
    fetchTickerItems();
    fetchServices();
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

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
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

  const handleOpenAddServiceDialog = () => {
    setEditingService(null);
    setServiceFormData({
      icon: '',
      displayOrder: getNextAvailableServiceOrder(),
    });
    setServiceOrderError('');
    setIsServiceDialogOpen(true);
  };

  const handleOpenEditServiceDialog = (service: Service) => {
    setEditingService(service);
    setServiceFormData({
      icon: service.icon,
      displayOrder: service.displayOrder,
    });
    setServiceOrderError('');
    setIsServiceDialogOpen(true);
  };

  const handleCloseServiceDialog = () => {
    setIsServiceDialogOpen(false);
    setEditingService(null);
    setServiceFormData({
      icon: '',
      displayOrder: getNextAvailableServiceOrder(),
    });
    setServiceOrderError('');
  };

  const handleSaveService = async () => {
    setServiceOrderError('');

    if (serviceUsedOrders.includes(serviceFormData.displayOrder)) {
      setServiceOrderError(`Order ${serviceFormData.displayOrder} is already taken. Next available: ${getNextAvailableServiceOrder()}`);
      return;
    }

    // Check if icon is provided and is a valid string
    const iconValue = serviceFormData.icon;
    const hasIcon = iconValue && typeof iconValue === 'string' && iconValue.trim().length > 0;

    if (!hasIcon) {
      toast.error('Please upload an icon image before saving');
      return;
    }

    setSavingService(true);
    const token = localStorage.getItem('admin_token');

    try {
      const url = editingService ? `/api/admin/services/${editingService.id}` : '/api/admin/services';
      const method = editingService ? 'PUT' : 'POST';

      // Backend schema requires title & description; auto-fill them based on display order
      const payload = {
        title: editingService?.title || `Service Icon ${serviceFormData.displayOrder + 1}`,
        description: editingService?.description || '',
        icon: serviceFormData.icon,
        displayOrder: serviceFormData.displayOrder,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingService ? 'Service updated successfully!' : 'Service added successfully!');
        handleCloseServiceDialog();
        fetchServices();
      } else {
        toast.error('Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingService(false);
    }
  };

  const handleServiceDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this service? This action cannot be undone.',
      'Delete Service'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast.success('Service deleted successfully!');
        fetchServices();
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Services management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the service icons, statistics, and ticker items in the Services section.
        </p>
      </div>

      {/* Service Icons Section */}
      <div className="border-b pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Service Icons</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the images displayed in the hexagonal grid on the Services page.
            </p>
          </div>
          <Button onClick={handleOpenAddServiceDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Service Icon
          </Button>
        </div>

        {/* Services Grid */}
        <div>
          {services.length === 0 ? (
            <Card className="rounded-xl border border-border bg-white p-12 shadow-sm">
              <div className="text-center">
                <Plus className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                <h3 className="mb-1 text-lg font-medium text-gray-800">No service icons yet</h3>
                <p className="text-sm text-gray-800">Get started by adding your first service icon</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {service.icon && (
                        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-b from-blue-900 to-blue-950">
                          <Image
                            src={typeof service.icon === 'string' && (service.icon.startsWith('/api/images/') || service.icon.startsWith('http') || service.icon.startsWith('/'))
                              ? service.icon 
                              : `/api/images/${service.icon}`}
                            alt={service.title}
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{service.title}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{service.description}</p>
                        <div className="text-xs text-gray-500">Order: {service.displayOrder}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditServiceDialog(service)} className="flex-1">
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleServiceDelete(service.id)} className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600" type="button">
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

      {/* Statistics Section */}
      <div className="border-b pb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Statistics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the statistics displayed in the &quot;By the Numbers&quot; section.
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
                      <Button variant="outline" size="sm" onClick={() => handleDelete(stat.id)} className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600" type="button">
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
                          <Button variant="outline" size="sm" onClick={() => handleTickerDelete(item.id)} className="border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600" type="button">
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
        <div className="space-y-4 mb-6">
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

        <DialogFooter className="justify-end">
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
        <div className="space-y-4 mb-6">
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

        <DialogFooter className="justify-end">
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

      {/* Service Dialog */}
      <Dialog
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        title={editingService ? 'Edit Service Icon' : 'Add Service Icon'}
      >
        <div className="space-y-4 mb-6">
          <HtmlTips />
          <div className="space-y-2">
            <Label>Icon Image</Label>
            <ImageUpload
              value={serviceFormData.icon || ''}
              onChange={(url: string) => {
                setServiceFormData({ ...serviceFormData, icon: url });
              }}
            />
            {serviceFormData.icon && (
              <div className="relative h-32 w-32 mx-auto rounded-md overflow-hidden border border-gray-200 bg-gradient-to-b from-blue-900 to-blue-950">
                <Image
                  src={typeof serviceFormData.icon === 'string' && (serviceFormData.icon.startsWith('/api/images/') || serviceFormData.icon.startsWith('http') || serviceFormData.icon.startsWith('/'))
                    ? serviceFormData.icon 
                    : `/api/images/${serviceFormData.icon}`}
                  alt="Service Icon"
                  fill
                  className="object-contain p-2"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Icon displayed in the hexagonal grid. Recommended size: 256×256 PNG with transparent background.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-serviceDisplayOrder">Display Order</Label>
            <Input
              id="dialog-serviceDisplayOrder"
              type="number"
              value={serviceFormData.displayOrder}
              onChange={(e) => {
                setServiceFormData({ ...serviceFormData, displayOrder: parseInt(e.target.value) || 0 });
                setServiceOrderError('');
              }}
              placeholder="0"
              className={serviceOrderError ? 'border-red-500' : ''}
            />
            {serviceOrderError && <p className="text-xs text-red-600">{serviceOrderError}</p>}
            <p className="text-xs text-muted-foreground">
              Used: {serviceUsedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableServiceOrder()}
            </p>
          </div>
        </div>

        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseServiceDialog}
            disabled={savingService}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveService}
            disabled={savingService}
          >
            {savingService ? 'Saving...' : editingService ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
