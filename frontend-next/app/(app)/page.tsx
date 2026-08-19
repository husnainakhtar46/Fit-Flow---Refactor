'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, canViewDashboard } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (canViewDashboard) {
      router.replace('/dashboard');
    } else {
      router.replace('/evaluation');
    }
  }, [isAuthenticated, canViewDashboard, router]);

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
