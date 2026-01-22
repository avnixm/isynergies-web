'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Briefcase, UserCog, Wrench, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    boardMembers: 0,
    projects: 0,
    teamMembers: 0,
    services: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem('admin_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch all stats in parallel, but handle each one independently
    // This way if one fails, the others can still load
    const [boardResult, projectsResult, teamResult, servicesResult] = await Promise.allSettled([
      fetch('/api/admin/board-members', { headers }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/projects', { headers }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/team', { headers }).then(res => res.ok ? res.json() : []),
      fetch('/api/admin/services', { headers }).then(res => res.ok ? res.json() : []),
    ]);

    // Extract results, defaulting to empty array on failure
    const board = boardResult.status === 'fulfilled' ? boardResult.value : [];
    const projects = projectsResult.status === 'fulfilled' ? projectsResult.value : [];
    const team = teamResult.status === 'fulfilled' ? teamResult.value : [];
    const services = servicesResult.status === 'fulfilled' ? servicesResult.value : [];

    setStats({
      boardMembers: Array.isArray(board) ? board.length : 0,
      projects: Array.isArray(projects) ? projects.length : 0,
      teamMembers: Array.isArray(team) ? team.length : 0,
      services: Array.isArray(services) ? services.length : 0,
    });
  };

  const statCards = [
    { 
      label: 'Board Members', 
      value: stats.boardMembers, 
      icon: Users, 
      href: '/admin/dashboard/board-members'
    },
    { 
      label: 'Projects', 
      value: stats.projects, 
      icon: Briefcase, 
      href: '/admin/dashboard/projects'
    },
    { 
      label: 'Team Members', 
      value: stats.teamMembers, 
      icon: UserCog, 
      href: '/admin/dashboard/team'
    },
    { 
      label: 'Services', 
      value: stats.services, 
      icon: Wrench, 
      href: '/admin/dashboard/services'
    },
  ];

  const quickActions = [
    {
      title: 'Manage Board of Directors',
      description: 'Add, edit, or remove board members',
      icon: Users,
      href: '/admin/dashboard/board-members',
    },
    {
      title: 'Manage Projects',
      description: 'Update your portfolio and project showcase',
      icon: Briefcase,
      href: '/admin/dashboard/projects',
    },
    {
      title: 'Site Settings',
      description: 'Update company information and contact details',
      icon: Activity,
      href: '/admin/dashboard/site-settings',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          High-level view of your content.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="group cursor-pointer border border-border bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-800">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-gray-800">
                        {stat.value}
                      </p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:bg-accent/20">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>
            Jump into the sections you manage the most.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-white/90 p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:border-accent/70 hover:bg-accent/5">
                    <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {action.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-800">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border border-accent/20 bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                <Activity className="h-5 w-5 text-accent" />
              </div>
            </div>
            <div>
              <h3 className="mb-1 text-base font-semibold text-gray-800">
                Content Management System
              </h3>
              <p className="text-sm text-gray-800">
                Use the sidebar to navigate between different content sections. All changes
                made here will be reflected on the live website. Upload assets directly from
                your management pages and keep your content up to date.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
