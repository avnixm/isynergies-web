'use client';

import { useEffect, useState } from 'react';
import { StickyFooter } from '../_components/sticky-footer';
import { getCached, setCached } from '../_lib/cache';
import Loading from '@/app/components/ui/loading';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent } from '@/app/components/ui/card';
import { ImageUpload } from '@/app/components/ui/image-upload';
import { useToast } from '@/app/components/ui/toast';
import { Info } from 'lucide-react';

type SiteSettings = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  contactForwardEmail: string;
  companyFacebook: string;
  companyTwitter: string;
  companyInstagram: string;
  logoImage: string | null;
};

export default function SiteSettingsPage() {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<SiteSettings>({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    contactForwardEmail: '',
    companyFacebook: '',
    companyTwitter: '',
    companyInstagram: '',
    logoImage: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cached = getCached<SiteSettings>('admin-site-settings');
    if (cached != null) {
      setSettings(cached);
      setLoading(false);
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/site-settings');
      const data = await response.json();
      const next = {
        companyName: data.companyName || '',
        companyAddress: data.companyAddress || '',
        companyPhone: data.companyPhone || '',
        companyEmail: data.companyEmail || '',
        contactForwardEmail: data.contactForwardEmail || '',
        companyFacebook: data.companyFacebook || '',
        companyTwitter: data.companyTwitter || '',
        companyInstagram: data.companyInstagram || '',
        logoImage: data.logoImage || null,
      };
      setSettings(next);
      setCached('admin-site-settings', next);
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        success('Site settings updated successfully.');
        await fetchSettings();
      } else {
        error('Failed to update site settings.');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      error('An unexpected error occurred while saving.');
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Site settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your website&apos;s contact information and settings.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="text-muted-foreground">Jump to:</span>
          <a href="#company-information" className="text-accent hover:underline">Company Information</a>
          <a href="#social-media" className="text-accent hover:underline">Social Media</a>
          <a href="#company-logo" className="text-accent hover:underline">Company Logo</a>
        </div>
      </div>

      <form id="site-settings-form" onSubmit={handleSubmit} className="space-y-8">
        {}
        <Card id="company-information" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Company Information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Basic company details displayed on the website
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="max-w-4xl space-y-4">
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
                className="min-h-[100px]"
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

              <div className="space-y-2">
                <Label htmlFor="contactForwardEmail">Contact Form Forwarding Email</Label>
                <Input
                  id="contactForwardEmail"
                  type="email"
                  value={settings.contactForwardEmail}
                  onChange={(e) => setSettings({ ...settings, contactForwardEmail: e.target.value })}
                  placeholder="support@isynergies.com"
                />
                <p className="text-xs text-muted-foreground">
                  Messages from the Contact form will be sent to this address. Defaults to the company email if left empty.
                </p>
              </div>
            </div>
            </div>
          </CardContent>
        </Card>

        {}
        <Card id="social-media" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Social Media</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect your social media profiles (optional)
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="max-w-4xl space-y-4">
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
            </div>
          </CardContent>
        </Card>

        {}
        <Card id="company-logo" className="rounded-xl border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-lg font-medium text-foreground">Company Logo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your company logo displayed in the navbar and footer
              </p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="max-w-4xl space-y-4">
            <div className="space-y-2">
              <Label>Logo Image</Label>
              <ImageUpload
                value={settings.logoImage || ''}
                onChange={(url: string) => setSettings({ ...settings, logoImage: url })}
              />
              <p className="text-xs text-muted-foreground">
                Logo displayed in navbar and footer. Recommended size: 200×60px PNG with transparent background.
              </p>
            </div>
            </div>
          </CardContent>
        </Card>

      </form>

      {}
      <StickyFooter formId="site-settings-form" saving={saving} />
    </div>
  );
}

