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
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
        await cacheFactories(data);
        return data;
      } catch {
        const cached = await getCachedFactories();
        return Array.isArray(cached) ? cached : [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      try {
        const res = await api.get('/customers/');
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
        await cacheCustomers(data);
        return data;
      } catch {
        const cached = await getCachedCustomers();
        return Array.isArray(cached) ? cached : [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      try {
        const res = await api.get('/templates/');
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
        await cacheTemplates(data);
        return data;
      } catch {
        const cached = await getCachedTemplates();
        return Array.isArray(cached) ? cached : [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const safeArray = (d: any) =>
    Array.isArray(d) ? d : Array.isArray(d?.results) ? d.results : [];

  return {
    factories: safeArray(factoriesQuery.data),
    customers: safeArray(customersQuery.data),
    templates: safeArray(templatesQuery.data),
    isLoading: factoriesQuery.isLoading || customersQuery.isLoading || templatesQuery.isLoading,
  };
}
