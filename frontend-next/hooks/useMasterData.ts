'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  cacheCustomers,
  getCachedCustomers,
  cacheFactories,
  getCachedFactories,
  cacheTemplates,
  getCachedTemplates,
} from '@/lib/db';

export function useMasterData() {
  const factoriesQuery = useQuery({
    queryKey: ['factories'],
    queryFn: async () => {
      try {
        const res = await api.get('/factories/');
        const data = res.data.results || res.data || [];
        await cacheFactories(data);
        return data;
      } catch {
        return (await getCachedFactories()) || [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers/');
        const data = res.data.results || res.data || [];
        await cacheCustomers(data);
        return data;
      } catch {
        return (await getCachedCustomers()) || [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const res = await api.get('/templates/');
        const data = res.data.results || res.data || [];
        await cacheTemplates(data);
        return data;
      } catch {
        return (await getCachedTemplates()) || [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    factories: factoriesQuery.data || [],
    customers: customersQuery.data || [],
    templates: templatesQuery.data || [],
    isLoading: factoriesQuery.isLoading || customersQuery.isLoading || templatesQuery.isLoading,
  };
}
