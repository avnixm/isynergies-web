'use client';

import { useEffect, useState } from 'react';
import { Mail, MailOpen, Check, Archive, Trash2, Clock } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { useToast } from '@/app/components/ui/toast';
import { useConfirm } from '@/app/components/ui/confirm-dialog';

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  contactNo: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: Mail },
  read: { label: 'Read', color: 'bg-muted text-gray-800', icon: MailOpen },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-800', icon: Check },
  archived: { label: 'Archived', color: 'bg-purple-100 text-purple-800', icon: Archive },
};

export default function MessagesPage() {
  const toast = useToast();
  const { confirm } = useConfirm();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/admin/contact-messages');
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setAdminNotes(message.adminNotes || '');

    // Mark as read if it was new
    if (message.status === 'new') {
      await updateMessageStatus(message.id, 'read', message.adminNotes || '');
    }
  };

  const updateMessageStatus = async (id: number, status: string, notes: string) => {
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
        toast.success('Message updated successfully!');
        fetchMessages();
        if (selectedMessage?.id === id) {
          setSelectedMessage({ ...selectedMessage, status: status as any, adminNotes: notes });
        }
      } else {
        toast.error('Failed to update message');
      }
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('An error occurred while updating');
    }
  };

  const handleStatusChange = (status: 'new' | 'read' | 'replied' | 'archived') => {
    if (selectedMessage) {
      updateMessageStatus(selectedMessage.id, status, adminNotes);
    }
  };

  const handleSaveNotes = () => {
    if (selectedMessage) {
      updateMessageStatus(selectedMessage.id, selectedMessage.status, adminNotes);
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
        }
        fetchMessages();
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
        <h1 className="text-2xl font-semibold tracking-tight">Contact messages</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage and respond to customer inquiries.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {(['all', 'new', 'read', 'replied', 'archived'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              filter === status
                ? 'border-b-2 border-blue-700 bg-blue-50 text-blue-700'
                : 'text-gray-800 hover:bg-muted hover:text-gray-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200">
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                <h3 className="mb-1 text-lg font-medium text-gray-800">No messages</h3>
                <p className="text-sm text-gray-800">
                  {filter === 'all' 
                    ? 'No contact messages yet' 
                    : `No ${filter} messages`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => {
              const StatusIcon = statusConfig[message.status].icon;
              return (
                <Card
                  key={message.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedMessage?.id === message.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleSelectMessage(message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{message.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[message.status].color}`}>
                            {statusConfig[message.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{message.email}</p>
                      </div>
                      <StatusIcon className="h-5 w-5 text-gray-800" />
                    </div>
                    <p className="mb-2 line-clamp-2 text-sm text-gray-800">{message.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-800">
                      <Clock className="h-3 w-3" />
                      {new Date(message.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Message Detail */}
        <div className="lg:sticky lg:top-6 h-fit">
          {selectedMessage ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedMessage.name}</h2>
                      <p className="mt-1 text-sm text-gray-800">{selectedMessage.email}</p>
                      <p className="text-sm text-gray-800">{selectedMessage.contactNo}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(selectedMessage.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium text-gray-800">Message</Label>
                    <p className="mt-2 whitespace-pre-wrap text-gray-800">{selectedMessage.message}</p>
                  </div>

                  <div className="border-t pt-4">
                    <Label className="mb-2 text-sm font-medium text-gray-800">Status</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(['new', 'read', 'replied', 'archived'] as const).map((status) => {
                        const StatusIcon = statusConfig[status].icon;
                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              selectedMessage.status === status
                                ? statusConfig[status].color
                                : 'bg-muted text-gray-800 hover:bg-muted/80'
                            }`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig[status].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-800">
                      Admin Notes
                    </Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="mt-2"
                      placeholder="Add notes about this inquiry..."
                    />
                    <Button onClick={handleSaveNotes} className="mt-2">
                      Save Notes
                    </Button>
                  </div>

                  <div className="border-t pt-4 text-xs text-gray-800">
                    <p>Received: {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                    <p>Last Updated: {new Date(selectedMessage.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Mail className="mx-auto mb-4 h-12 w-12 text-gray-800" />
                <p className="text-sm text-gray-800">Select a message to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

