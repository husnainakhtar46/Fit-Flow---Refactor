'use client';

import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import api from '@/lib/api';
import { useMemo } from 'react';

export interface StyleMaster {
  id: string;
  po_number: string;
  style_name: string;
  color: string;
  customer: string | null;
  customer_name: string | null;
  season?: string;
}

export interface StyleSuggestion extends StyleMaster {
  score?: number;
}

export const useStyleLookup = () => {
  const { data: stylesData, isLoading } = useQuery({
    queryKey: ['style-masters-lookup'],
    queryFn: async () => {
      const response = await api.get('/styles/', {
        params: { page_size: 1000 },
      });
      return Array.isArray(response.data) ? response.data : response.data?.results || [];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const styles: StyleMaster[] = useMemo(() => stylesData || [], [stylesData]);

  const fuse = useMemo(() => {
    return new Fuse(styles, {
      keys: ['po_number', 'style_name'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [styles]);

  const searchByPO = (poQuery: string): StyleSuggestion[] => {
    if (!poQuery || poQuery.length < 2) return [];

    const exactMatch = styles.find(
      (s) => s.po_number.toLowerCase() === poQuery.toLowerCase()
    );

    if (exactMatch) {
      return [{ ...exactMatch, score: 0 }];
    }

    const results = fuse.search(poQuery);
    return results.map((result) => ({
      ...result.item,
      score: result.score,
    }));
  };

  const getStyleForPO = (poNumber: string): StyleMaster | undefined => {
    if (!poNumber) return undefined;
    return styles.find(
      (s) => s.po_number.toLowerCase() === poNumber.toLowerCase()
    );
  };

  const getStyleSuggestions = (input: string): string[] => {
    if (!input || input.length < 1) return [];
    const uniqueStyles = Array.from(new Set(styles.map((s) => s.style_name))).filter(Boolean);
    return uniqueStyles.filter((s) =>
      s.toLowerCase().includes(input.toLowerCase())
    );
  };

  const getColorSuggestions = (styleName: string, input: string = ''): string[] => {
    if (!styleName) return [];
    const matchingStyles = styles.filter(
      (s) => s.style_name.toLowerCase() === styleName.toLowerCase()
    );
    const colors = Array.from(new Set(matchingStyles.map((s) => s.color))).filter(Boolean);

    if (!input) return colors;
    return colors.filter((c) => c.toLowerCase().includes(input.toLowerCase()));
  };

  return {
    styles,
    isLoading,
    searchByPO,
    getStyleForPO,
    getStyleSuggestions,
    getColorSuggestions,
  };
};
