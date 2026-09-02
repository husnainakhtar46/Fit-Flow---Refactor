'use client';

import React from 'react';
import Link from 'next/link';
import { Users, Factory, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const ResourceCard = ({
  href,
  title,
  description,
  icon: Icon,
  colorClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: any;
  colorClass: string;
}) => {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
    >
      <div>
        <div
          className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors',
            colorClass
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{description}</p>
      </div>

      <div className="mt-6 flex items-center text-sm font-medium text-gray-400 group-hover:text-primary transition-colors">
        Manage
        <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
      </div>
    </Link>
  );
};

export default function ResourcesPage() {
  const { canViewCustomers } = useAuth();

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Resources Hub</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canViewCustomers && (
          <ResourceCard
            href="/customers"
            title="Customers & Email Lists"
            description="Manage customer profiles, buyer contacts, and automated PDF report distribution lists."
            icon={Users}
            colorClass="bg-green-500"
          />
        )}

        <ResourceCard
          href="/factories"
          title="Manufacturing Factories"
          description="Maintain a centralized registry of manufacturing factories, vendor facilities, and locations."
          icon={Factory}
          colorClass="bg-orange-500"
        />
      </div>
    </div>
  );
}
