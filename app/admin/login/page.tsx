'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Cookie is set server-side; no need to store token in localStorage
      const returnTo = searchParams.get('returnTo');
      const target = returnTo && returnTo.startsWith('/admin/') ? returnTo : '/admin/dashboard';
      router.push(target);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary">
      <div className="w-full max-w-md px-4">
        <Card className="border-border/20 bg-white/95 shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <p className="text-2xl font-bold text-primary">iSynergies Inc.</p>
            </div>
            <CardTitle className="text-xl">Admin Login</CardTitle>
            <CardDescription>Secure access to the iSynergies CMS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
          {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2">
                  <User className="h-4 w-4 text-gray-800" />
                  <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                placeholder="Enter your username"
              />
                </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2">
                  <Lock className="h-4 w-4 text-gray-800" />
                  <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                placeholder="Enter your password"
              />
                </div>
            </div>

              <Button
              type="submit"
              disabled={loading}
                className="mt-2 w-full bg-primary/90 text-primary-foreground backdrop-blur-sm hover:bg-primary"
            >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
          </form>

            <p className="pt-2 text-center text-xs text-gray-800">
            © 2026 iSynergies Inc. All rights reserved.
          </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary">
        <div className="text-sm text-white">Loading…</div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
