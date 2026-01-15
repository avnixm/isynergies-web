'use client';

import { useEffect, useState, useRef } from 'react';
import { Mail, MailOpen, Check, Archive, Trash2, Clock, User, Phone, MessageSquare, Save } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogFooter } from '@/app/components/ui/dialog';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  contactNo: string;
  message: string;
  projectId?: number | null;
  projectTitle?: string | null;
  status: 'new' | 'read' | 'replied' | 'archived';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Mail, dotColor: 'bg-blue-500' },
  read: { label: 'Read', color: 'bg-muted/50 text-muted-foreground border-border', icon: MailOpen, dotColor: 'bg-muted-foreground' },
  replied: { label: 'Replied', color: 'bg-green-50 text-green-700 border-green-200', icon: Check, dotColor: 'bg-green-500' },
  archived: { label: 'Archived', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Archive, dotColor: 'bg-purple-500' },
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function MessagesPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const selectedMessageRef = useRef<ContactMessage | null>(null);

  // Update ref when selectedMessage changes
  useEffect(() => {
    selectedMessageRef.current = selectedMessage;
  }, [selectedMessage]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/contact-messages', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // If there's a selected message, update it if it still exists
        const currentSelected = selectedMessageRef.current;
        if (currentSelected) {
          const updatedMessage = data.find((m: ContactMessage) => m.id === currentSelected.id);
          if (updatedMessage) {
            setSelectedMessage(updatedMessage);
            setAdminNotes(updatedMessage.adminNotes || '');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchMessages();
    
    // Refresh messages every 5 seconds
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    
    // Also refresh when window gains focus
    const handleFocus = () => {
      fetchMessages();
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || '');
    setIsDialogOpen(true);

    // Mark as read if it was new (silently, no toast)
    if (message.status === 'new') {
      await updateMessageStatus(message.id, 'read', message.adminNotes || '', false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedMessage(null);
    setAdminNotes('');
  };

  const updateMessageStatus = async (id: number, status: string, notes: string, showToast: boolean = true) => {
    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNotes: notes }),
      });

      if (response.ok) {
        // Show toast if explicitly requested (e.g., when saving notes or changing to replied/archived)
        if (showToast) {
          if (status === 'read') {
            // Don't show toast for read status (automatic when opening message)
            // But if showToast is true, it means user explicitly saved notes
            toast.success('Notes saved successfully!');
          } else {
            toast.success('Message updated successfully!');
          }
        }
        // Refresh messages to get latest data
        await fetchMessages();
        // Update selected message if it's the one being updated
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status: status as any, adminNotes: notes });
        }
      } else {
        if (showToast) {
          toast.error('Failed to update message');
        }
      }
    } catch (error) {
      console.error('Error updating message:', error);
      if (showToast) {
        toast.error('An error occurred while updating');
      }
    }
  };

  const handleStatusChange = (status: 'new' | 'read' | 'replied' | 'archived') => {
    if (selectedMessage) {
      // Only show toast for status changes other than "read"
      const showToast = status !== 'read';
      updateMessageStatus(selectedMessage.id, status, adminNotes, showToast);
    }
  };

  const handleSaveNotes = async () => {
    if (selectedMessage) {
      setSavingNotes(true);
      // Show toast when saving notes (this is an explicit user action)
      await updateMessageStatus(selectedMessage.id, selectedMessage.status, adminNotes, true);
      setSavingNotes(false);
      // Close the dialog after saving
      handleCloseDialog();
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this message? This action cannot be undone.',
      'Delete Message'
    );
    
    if (!confirmed) return;

    const token = localStorage.getItem('admin_token');
    try {
      const response = await fetch(`/api/admin/contact-messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Message deleted successfully!');
        if (selectedMessage?.id === id) {
          setSelectedMessage(null);
          setIsDialogOpen(false);
        }
        await fetchMessages();
      } else {
        toast.error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const filteredMessages = messages.filter(msg => 
    filter === 'all' || msg.status === filter
  );

  const getStatusCounts = () => {
    return {
      all: messages.length,
      new: messages.filter(m => m.status === 'new').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length,
      archived: messages.filter(m => m.status === 'archived').length,
    };
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading message="Loading messages" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Contact Messages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage and respond to customer inquiries.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1" aria-label="Message filters">
          {(['all', 'new', 'read', 'replied', 'archived'] as const).map((status) => {
            const StatusIcon = status === 'all' ? Mail : statusConfig[status].icon;
            const tabLabels: Record<typeof status, string> = {
              all: 'All Messages',
              new: 'New',
              read: 'Read',
              replied: 'Replied',
              archived: 'Archived',
            };
            
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`
                  relative px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2
                  border-b-2 -mb-[1px]
                  ${filter === status
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <StatusIcon className="h-4 w-4" />
                {tabLabels[status]}
                {counts[status] > 0 && (
                  <span className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${filter === status
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {counts[status]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Messages List */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
          {filteredMessages.length === 0 ? (
            <Card className="rounded-xl border border-border bg-white">
              <CardContent className="p-12 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-medium text-foreground">No messages</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' 
                    ? 'No contact messages yet' 
                    : `No ${filter} messages`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => {
              const StatusIcon = statusConfig[message.status].icon;
              const initials = getInitials(message.name);
              
              return (
                <Card
                  key={message.id}
                  className="cursor-pointer transition-all group hover:shadow-md hover:border-border/80"
                  onClick={() => handleSelectMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`
                        flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold
                        ${message.status === 'new' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {initials}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground truncate">{message.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">{message.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {message.status === 'new' && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                            <StatusIcon className={`h-4 w-4 ${message.status === 'new' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                          </div>
                        </div>
                        
                        {message.projectTitle && (
                          <p className="text-xs font-medium text-[#0D1E66] mb-1">
                            Project inquiry: {message.projectTitle}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {message.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(message.createdAt).toLocaleString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Manila',
                              })}
                            </span>
                          </div>
                          <span className={`
                            px-2 py-0.5 text-xs rounded-full border font-medium
                            ${statusConfig[message.status].color}
                          `}>
                            {statusConfig[message.status].label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={selectedMessage ? `Message from ${selectedMessage.name}` : 'Message Details'}
        maxWidth="2xl"
      >
        {selectedMessage && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-border">
              <div className={`
                flex-shrink-0 h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold
                ${selectedMessage.status === 'new' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {getInitials(selectedMessage.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">{selectedMessage.name}</h2>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedMessage.email}`} className="hover:text-foreground transition-colors">
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedMessage.contactNo}`} className="hover:text-foreground transition-colors">
                      {selectedMessage.contactNo}
                    </a>
                  </div>
                  {selectedMessage.projectTitle && (
                    <div className="flex items-center gap-2 text-sm text-[#0D1E66] font-medium">
                      <MessageSquare className="h-4 w-4" />
                      <span>Project inquiry: {selectedMessage.projectTitle}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-3 block">Status</Label>
              <div className="flex flex-wrap gap-2">
                {(['new', 'read', 'replied', 'archived'] as const).map((status) => {
                  const StatusIcon = statusConfig[status].icon;
                  const isActive = selectedMessage.status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => {
                        handleStatusChange(status);
                        // Update local state immediately for better UX
                        if (selectedMessage) {
                          setSelectedMessage({ ...selectedMessage, status });
                        }
                      }}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                        border
                        ${isActive
                          ? `${statusConfig[status].color} shadow-sm`
                          : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {statusConfig[status].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Content */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium text-foreground">Message</Label>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {selectedMessage.message}
                </p>
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <Label htmlFor="dialog-adminNotes" className="text-sm font-medium text-foreground mb-3 block">
                Admin Notes
              </Label>
              <Textarea
                id="dialog-adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[120px]"
                placeholder="Add notes about this inquiry, follow-up actions, or internal comments..."
              />
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-border">
              <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Received: {new Date(selectedMessage.createdAt).toLocaleString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                {selectedMessage.updatedAt !== selectedMessage.createdAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last Updated: {new Date(selectedMessage.updatedAt).toLocaleString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex w-full items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleCloseDialog}
          >
            Close
          </Button>
          <Button
            onClick={handleSaveNotes}
            disabled={!selectedMessage || savingNotes}
          >
            <Save className="h-4 w-4 mr-2" />
            {savingNotes ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

