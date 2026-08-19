'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, LogOut, MessageSquare, ClipboardList, Layers, FileText, Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const Sidebar = () => {
  const pathname = usePathname();
  const { canViewDashboard, canViewTemplates, canViewResources } = useAuth();

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
    <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="Fit Flow Logo" className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-primary">Fit Flow</h1>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
