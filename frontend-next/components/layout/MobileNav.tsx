'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, MessageSquare, ClipboardList, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const MobileNav = () => {
  const pathname = usePathname();

  const allLinks = [
    { href: '/style-cycle', label: 'Styles', icon: Layers, visible: true },
    { href: '/evaluation', label: 'Evaluation', icon: ClipboardCheck, visible: true },
    { href: '/final-inspections', label: 'Inspection', icon: ClipboardList, visible: true },
    { href: '/customer-feedback', label: 'Feedback', icon: MessageSquare, visible: true },
  ];

  const links = allLinks.filter((link) => link.visible);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 md:hidden safe-bottom">
      <div className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors touch-target",
                isActive
                  ? "text-primary"
                  : "text-gray-600"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5]")} />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
