'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cacheCustomers, getCachedCustomers } from '@/lib/db';

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const response = await api.get('/customers/');
        const data = Array.isArray(response.data) ? response.data : response.data?.results || [];

        try {
          await cacheCustomers(data);
        } catch (cacheError) {
          console.warn('[useCustomers] Caching failed:', cacheError);
        }
        return data;
      } catch (error) {
        console.error('[useCustomers] Fetch failed:', error);
        const cached = await getCachedCustomers();
        return cached || [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: (previousData: any) => previousData,
  });
}
