'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

type SiteSettings = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyFacebook: string;
  companyTwitter: string;
  companyInstagram: string;
};

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyFacebook: '',
    companyTwitter: '',
    companyInstagram: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/site-settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem('admin_token');

    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings updated successfully.' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings.' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error saving changes.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading message="Loading site settings" size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Site settings</h1>
        <p className="mt-1 text-sm text-gray-800">
          Manage your website&apos;s contact information and settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Company Information</CardTitle>
            <CardDescription>Basic company details displayed on the website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                placeholder="iSynergies Inc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                value={settings.companyAddress}
                onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                className="min-h-[80px]"
                placeholder="ASKI Building 105 Maharlika Highway, Cabanatuan City, Nueva Ecija"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  placeholder="+63 123 456 7890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email Address</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  placeholder="info@isynergies.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Social Media</CardTitle>
            <CardDescription>Connect your social media profiles (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyFacebook">Facebook URL</Label>
              <Input
                id="companyFacebook"
                type="url"
                value={settings.companyFacebook}
                onChange={(e) => setSettings({ ...settings, companyFacebook: e.target.value })}
                placeholder="https://facebook.com/isynergies"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyTwitter">Twitter URL</Label>
              <Input
                id="companyTwitter"
                type="url"
                value={settings.companyTwitter}
                onChange={(e) => setSettings({ ...settings, companyTwitter: e.target.value })}
                placeholder="https://twitter.com/isynergies"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyInstagram">Instagram URL</Label>
              <Input
                id="companyInstagram"
                type="url"
                value={settings.companyInstagram}
                onChange={(e) => setSettings({ ...settings, companyInstagram: e.target.value })}
                placeholder="https://instagram.com/isynergies"
              />
            </div>
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
                Save Settings
              </>
            )}
          </Button>
          {message && (
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

