'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardCheck,
  LogOut,
  MessageSquare,
  ClipboardList,
  Layers,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const Sidebar = () => {
  const pathname = usePathname();
  const { canViewDashboard, canViewTemplates, canViewResources } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  const allLinks = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: canViewDashboard,
    },
    {
      href: '/style-cycle',
      label: 'Style Cycle',
      icon: Layers,
      visible: true,
    },
    {
      href: '/evaluation',
      label: 'Evaluation',
      icon: ClipboardCheck,
      visible: true,
    },
    {
      href: '/final-inspections',
      label: 'Final Inspection',
      icon: ClipboardList,
      visible: true,
    },
    {
      href: '/customer-feedback',
      label: 'Customer Feedback',
      icon: MessageSquare,
      visible: true,
    },
    {
      href: '/templates',
      label: 'Style Templates',
      icon: FileText,
      visible: canViewTemplates,
    },
    {
      href: '/resources',
      label: 'Resources',
      icon: Database,
      visible: canViewResources,
    },
  ];

  const links = allLinks.filter((link) => link.visible);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('is_superuser');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_id');
    window.location.href = '/login';
  };

  return (
    <div
      className={cn(
        'hidden md:flex bg-white border-r border-gray-200 flex-col transition-all duration-300 ease-in-out shrink-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'border-b border-gray-200 flex items-center transition-all duration-300',
          isCollapsed ? 'p-4 flex-col gap-3 justify-center' : 'p-6 justify-between'
        )}
      >
        <div className={cn('flex items-center gap-2.5', isCollapsed && 'justify-center')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Fit Flow Logo" className="w-8 h-8 shrink-0" />
          {!isCollapsed && (
            <h1 className="text-2xl font-bold text-primary tracking-tight whitespace-nowrap">
              Fit Flow
            </h1>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors',
            isCollapsed && 'mt-1'
          )}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? link.label : undefined}
              className={cn(
                'flex items-center rounded-lg text-sm font-medium transition-all group relative',
                isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className={cn('border-t border-gray-200', isCollapsed ? 'p-3' : 'p-4')}>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : undefined}
          className={cn(
            'flex items-center w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors',
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
          )}
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
