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
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [boardRes, projectsRes] = await Promise.all([
        fetch('/api/admin/board-members', { headers }),
        fetch('/api/admin/projects', { headers }),
      ]);

      const board = await boardRes.json();
      const projects = await projectsRes.json();

      setStats({
        boardMembers: Array.isArray(board) ? board.length : 0,
        projects: Array.isArray(projects) ? projects.length : 0,
        teamMembers: 16,
        services: 4,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    { 
      label: 'Board Members', 
      value: stats.boardMembers, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      href: '/admin/dashboard/board-members'
    },
    { 
      label: 'Projects', 
      value: stats.projects, 
      icon: Briefcase, 
      color: 'from-purple-500 to-purple-600',
      href: '/admin/dashboard/projects'
    },
    { 
      label: 'Team Members', 
      value: stats.teamMembers, 
      icon: UserCog, 
      color: 'from-green-500 to-green-600',
      href: '/admin/dashboard/team'
    },
    { 
      label: 'Services', 
      value: stats.services, 
      icon: Wrench, 
      color: 'from-orange-500 to-orange-600',
      href: '/admin/dashboard/services'
    },
  ];

  const quickActions = [
    {
      title: 'Manage Board of Directors',
      description: 'Add, edit, or remove board members',
      icon: Users,
      href: '/admin/dashboard/board-members',
      color: 'text-blue-600'
    },
    {
      title: 'Manage Projects',
      description: 'Update your portfolio and project showcase',
      icon: Briefcase,
      href: '/admin/dashboard/projects',
      color: 'text-purple-600'
    },
    {
      title: 'Site Settings',
      description: 'Update company information and contact details',
      icon: Activity,
      href: '/admin/dashboard/site-settings',
      color: 'text-green-600'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome to the iSynergies Content Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className={`bg-gradient-to-br ${stat.color} text-white hover:shadow-xl transition-all cursor-pointer border-0`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                      <p className="text-4xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <Icon className="h-12 w-12 opacity-30" />
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
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Frequently used management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <div className="flex items-start gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-[#0D1E66] hover:bg-blue-50 transition-all cursor-pointer">
                    <Icon className={`h-6 w-6 ${action.color} flex-shrink-0 mt-1`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Content Management System</h3>
              <p className="text-blue-700 text-sm">
                Use the sidebar to navigate between different content sections. All changes made here will be reflected on the live website. 
                Upload images directly from your management pages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
