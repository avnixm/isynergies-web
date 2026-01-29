'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, Plus, Info } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';
import { StickyFooter } from '../_components/sticky-footer';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { Textarea } from '@/app/components/ui/textarea';
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

type ServicesListItem = {
  id: number;
  label: string;
  displayOrder: number;
};

export default function ServicesPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesListItems, setServicesListItems] = useState<ServicesListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatDialogOpen, setIsStatDialogOpen] = useState(false);
  const [isTickerDialogOpen, setIsTickerDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [editingStat, setEditingStat] = useState<Statistic | null>(null);
  const [editingTicker, setEditingTicker] = useState<TickerItem | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingListItem, setEditingListItem] = useState<ServicesListItem | null>(null);
  const [orderError, setOrderError] = useState<string>('');
  const [tickerOrderError, setTickerOrderError] = useState<string>('');
  const [serviceOrderError, setServiceOrderError] = useState<string>('');
  const [listOrderError, setListOrderError] = useState<string>('');
  const [savingStat, setSavingStat] = useState(false);
  const [savingTicker, setSavingTicker] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [savingList, setSavingList] = useState(false);
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
  const [listFormData, setListFormData] = useState({
    label: '',
    displayOrder: 0,
  });
  const [servicesSection, setServicesSection] = useState<{ title: string; description: string }>({
    title: 'Our Services',
    description: '',
  });
  const [savingSection, setSavingSection] = useState(false);

  const usedOrders = (Array.isArray(statistics) ? statistics : []).filter(s => s.id !== editingStat?.id).map(s => s.displayOrder);
  const getNextAvailableOrder = () => {
    let order = 0;
    while (usedOrders.includes(order)) { order++; }
    return order;
  };

  const tickerUsedOrders = (Array.isArray(tickerItems) ? tickerItems : []).filter(t => t.id !== editingTicker?.id).map(t => t.displayOrder);
  const getNextAvailableTickerOrder = () => {
    let order = 0;
    while (tickerUsedOrders.includes(order)) { order++; }
    return order;
  };

  const serviceUsedOrders = (Array.isArray(services) ? services : []).filter(s => s.id !== editingService?.id).map(s => s.displayOrder);
  const getNextAvailableServiceOrder = () => {
    let order = 0;
    while (serviceUsedOrders.includes(order)) { order++; }
    return order;
  };

  const listUsedOrders = (Array.isArray(servicesListItems) ? servicesListItems : []).filter(s => s.id !== editingListItem?.id).map(s => s.displayOrder);
  const getNextAvailableListOrder = () => {
    let order = 0;
    while (listUsedOrders.includes(order)) { order++; }
    return order;
  };

  useEffect(() => {
    fetchStatistics();
    fetchTickerItems();
    fetchServices();
    fetchServicesList();
    fetchServicesSection();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/statistics');
      if (response.ok) {
        const data = await response.json();
        
        setStatistics(Array.isArray(data) ? data : []);
      } else {
        console.error('Error fetching statistics:', response.status, response.statusText);
        setStatistics([]);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickerItems = async () => {
    try {
      const response = await fetch('/api/admin/ticker');
      if (response.ok) {
        const data = await response.json();
        
        setTickerItems(Array.isArray(data) ? data : []);
      } else {
        console.error('Error fetching ticker items:', response.status, response.statusText);
        setTickerItems([]);
      }
    } catch (error) {
      console.error('Error fetching ticker items:', error);
      setTickerItems([]);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/admin/services');
      if (response.ok) {
        const data = await response.json();
        
        setServices(Array.isArray(data) ? data : []);
      } else {
        console.error('Error fetching services:', response.status, response.statusText);
        setServices([]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const fetchServicesList = async () => {
    try {
      const response = await fetch('/api/admin/services-list');
      if (response.ok) {
        const data = await response.json();
        setServicesListItems(Array.isArray(data) ? data : []);
      } else {
        console.error('Error fetching services list:', response.status, response.statusText);
        setServicesListItems([]);
      }
    } catch (error) {
      console.error('Error fetching services list:', error);
      setServicesListItems([]);
    }
  };

  const fetchServicesSection = async () => {
    try {
      const response = await fetch('/api/admin/services-section');
      if (response.ok) {
        const data = await response.json();
        setServicesSection({
          title: data.title ?? 'Our Services',
          description: data.description ?? '',
        });
      }
    } catch (error) {
      console.error('Error fetching services section:', error);
    }
  };

  const handleSaveSection = async () => {
    setSavingSection(true);
    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/services-section', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: servicesSection.title,
          description: servicesSection.description,
        }),
      });
      if (res.ok) {
        toast.success('Our Services section saved');
      } else {
        toast.error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving services section:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingSection(false);
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

  const handleOpenAddListDialog = () => {
    setEditingListItem(null);
    setListFormData({
      label: '',
      displayOrder: getNextAvailableListOrder(),
    });
    setListOrderError('');
    setIsListDialogOpen(true);
  };

  const handleOpenEditListDialog = (item: ServicesListItem) => {
    setEditingListItem(item);
    setListFormData({
      label: item.label,
      displayOrder: item.displayOrder,
    });
    setListOrderError('');
    setIsListDialogOpen(true);
  };

  const handleCloseListDialog = () => {
    setIsListDialogOpen(false);
    setEditingListItem(null);
    setListFormData({
      label: '',
      displayOrder: getNextAvailableListOrder(),
    });
    setListOrderError('');
  };

  const handleSaveList = async () => {
    setListOrderError('');
    if (listUsedOrders.includes(listFormData.displayOrder)) {
      setListOrderError(`Order ${listFormData.displayOrder} is already taken. Next available: ${getNextAvailableListOrder()}`);
      return;
    }
    if (!listFormData.label.trim()) {
      toast.error('Please enter a label');
      return;
    }
    setSavingList(true);
    const token = localStorage.getItem('admin_token');
    try {
      const url = editingListItem ? `/api/admin/services-list/${editingListItem.id}` : '/api/admin/services-list';
      const method = editingListItem ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(listFormData),
      });
      if (response.ok) {
        toast.success(editingListItem ? 'Services list item updated!' : 'Services list item added!');
        handleCloseListDialog();
        fetchServicesList();
      } else {
        toast.error('Failed to save services list item');
      }
    } catch (error) {
      console.error('Error saving services list item:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSavingList(false);
    }
  };

  const handleListDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this services list item? This action cannot be undone.',
      'Delete Services List Item'
    );
    if (!confirmed) return;
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/services-list/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success('Services list item deleted!');
        fetchServicesList();
      } else {
        toast.error('Failed to delete services list item');
      }
    } catch (error) {
      console.error('Error deleting services list item:', error);
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Services management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the Our Services section (title, description, bullet points), service icons, statistics, and ticker items.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          <a href="#services-section" className="text-accent hover:underline">Our Services section</a>
          <a href="#service-icons" className="text-accent hover:underline">Service Icons</a>
          <a href="#statistics" className="text-accent hover:underline">Statistics</a>
          <a href="#ticker-items" className="text-accent hover:underline">Ticker Items</a>
        </div>
      </div>

      {}
      <Card id="services-section" className="rounded-xl border border-border bg-white shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Our Services section</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Title, description, and bullet points shown on the Services page
          </p>
        </div>
        <div className="p-6 space-y-6">
          <form
            id="services-section-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveSection();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="section-title">Title</Label>
              <Input
                id="section-title"
                value={servicesSection.title}
                onChange={(e) => setServicesSection((s) => ({ ...s, title: e.target.value }))}
                placeholder="Our Services"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                value={servicesSection.description}
                onChange={(e) => setServicesSection((s) => ({ ...s, description: e.target.value }))}
                placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
                rows={4}
                className="resize-y"
              />
            </div>
          </form>

          <div className="border-t border-border pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Bullet points</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  e.g. Development, Support, Analysis &amp; Design, Sales, Maintenance
                </p>
              </div>
              <Button onClick={handleOpenAddListDialog} size="sm" className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add item
              </Button>
            </div>
            {servicesListItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center">
                <p className="text-sm text-muted-foreground">No bullet points yet. Add items like Development, Support, Maintenance.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {servicesListItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-white p-3 transition-colors hover:bg-muted/30"
                  >
                    {}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {item.label}
                      </p>
                      <div className="mt-0.5">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Order: {item.displayOrder}
                        </span>
                      </div>
                    </div>
                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditListDialog(item)}
                        className="h-8"
                        aria-label={`Edit ${item.label}`}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleListDelete(item.id)}
                        className="h-8 w-8 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${item.label}`}
                        type="button"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {}
      <Card id="service-icons" className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Service Icons</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the images displayed in the hexagonal grid on the Services page
            </p>
          </div>
          <Button onClick={handleOpenAddServiceDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Service Icon
          </Button>
        </div>
        <div className="p-6">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No service icons yet</h3>
              <p className="text-sm text-muted-foreground">Get started by adding your first service icon</p>
            </div>
          ) : (
            <div className="space-y-2">
              {services.map((service) => {
                const imageUrl = typeof service.icon === 'string' && (service.icon.startsWith('/api/images/') || service.icon.startsWith('http') || service.icon.startsWith('/'))
                  ? service.icon 
                  : `/api/images/${service.icon}`;
                return (
                  <div
                    key={service.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                  >
                    {}
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gradient-to-b from-blue-900 to-blue-950">
                      {service.icon ? (
                        <Image
                          src={imageUrl}
                          alt={service.title}
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <Plus className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {service.title}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {service.description}
                      </p>
                      <div className="mt-1">
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Order: {service.displayOrder}
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditServiceDialog(service)}
                        className="h-9"
                        aria-label={`Edit ${service.title}`}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleServiceDelete(service.id)}
                        className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${service.title}`}
                        type="button"
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
      <Card id="statistics" className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Statistics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the statistics displayed in the &quot;By the Numbers&quot; section
            </p>
          </div>
          <Button onClick={handleOpenAddStatDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Statistic
          </Button>
        </div>
        <div className="p-6">
          {statistics.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No statistics yet</h3>
              <p className="text-sm text-muted-foreground">Get started by adding your first statistic</p>
            </div>
          ) : (
            <div className="space-y-2">
              {statistics.map((stat) => (
                <div
                  key={stat.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                >
                  {}
                  <div className="flex-shrink-0 text-center min-w-[120px]">
                    <div className="text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm font-medium text-foreground mt-1">{stat.label}</div>
                  </div>

                  {}
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Order: {stat.displayOrder}
                    </span>
                  </div>

                  {}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditStatDialog(stat)}
                      className="h-9"
                      aria-label={`Edit ${stat.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(stat.id)}
                      className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${stat.label}`}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {}
      <Card id="ticker-items" className="rounded-xl border border-border bg-white shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-medium text-foreground">Ticker Bar Items</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the scrolling text items in the ticker bar
            </p>
          </div>
          <Button onClick={handleOpenAddTickerDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Ticker Item
          </Button>
        </div>
        <div className="p-6">
          {tickerItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 text-muted-foreground">
                <Plus className="h-full w-full" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-foreground">No ticker items yet</h3>
              <p className="text-sm text-muted-foreground">Add items to display in the scrolling ticker bar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickerItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-white p-4 transition-colors hover:bg-muted/30"
                >
                  {}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.text}
                    </p>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Order: {item.displayOrder}
                      </span>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditTickerDialog(item)}
                      className="h-9"
                      aria-label={`Edit ${item.text}`}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTickerDelete(item.id)}
                      className="h-9 w-9 p-0 border-red-400 text-red-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${item.text}`}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {}
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

      {}
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

      {}
      <Dialog
        open={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
        title={editingListItem ? 'Edit Services list item' : 'Add Services list item'}
      >
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="dialog-listLabel">Label</Label>
            <Input
              id="dialog-listLabel"
              value={listFormData.label}
              onChange={(e) => setListFormData({ ...listFormData, label: e.target.value })}
              placeholder="e.g., Development, Support, Maintenance"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dialog-listDisplayOrder">Display Order</Label>
            <Input
              id="dialog-listDisplayOrder"
              type="number"
              value={listFormData.displayOrder}
              onChange={(e) => {
                setListFormData({ ...listFormData, displayOrder: parseInt(e.target.value) || 0 });
                setListOrderError('');
              }}
              placeholder="0"
              className={listOrderError ? 'border-red-500' : ''}
            />
            {listOrderError && <p className="text-xs text-red-600">{listOrderError}</p>}
            <p className="text-xs text-muted-foreground">
              Used: {listUsedOrders.sort((a, b) => a - b).join(', ') || 'None'} | Next: {getNextAvailableListOrder()}
            </p>
          </div>
        </div>
        <DialogFooter className="justify-end">
          <Button
            variant="outline"
            onClick={handleCloseListDialog}
            disabled={savingList}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveList}
            disabled={savingList}
          >
            {savingList ? 'Saving...' : editingListItem ? 'Update' : 'Add'}
          </Button>
        </DialogFooter>
      </Dialog>

      {}
      <Dialog
        open={isServiceDialogOpen}
        onOpenChange={setIsServiceDialogOpen}
        title={editingService ? 'Edit Service Icon' : 'Add Service Icon'}
      >
        <div className="space-y-4 mb-6">
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

      {}
      <StickyFooter formId="services-section-form" saving={savingSection} />
    </div>
  );
}
