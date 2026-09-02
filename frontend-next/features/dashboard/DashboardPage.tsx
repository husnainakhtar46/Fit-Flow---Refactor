'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { EvalAnalytics } from './EvalAnalytics';
import { FinalInspAnalytics } from './FinalInspAnalytics';
import api from '@/lib/api';

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'evaluation' | 'final_inspection'>('evaluation');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [factoryName, setFactoryName] = useState<string>('');

  const { data: factoriesData } = useQuery({
    queryKey: ['factories', 'all'],
    queryFn: async () => {
      const res = await api.get('/factories/?page_size=100');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const res = await api.get('/customers/?page_size=100');
      return Array.isArray(res.data) ? res.data : res.data?.results || [];
    },
  });

  const factories = factoriesData || [];
  const customers = customersData || [];

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', startDate, endDate, customerId, factoryName],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (customerId) params.append('customer_id', customerId);
      if (factoryName) params.append('factory_name', factoryName);

      const url = `/dashboard/${params.toString() ? '?' + params.toString() : ''}`;
      const res = await api.get(url);
      return res.data;
    },
  });

  const handleThisWeek = () => {
    const now = new Date();
    setStartDate(formatDate(getStartOfWeek(now)));
    setEndDate(formatDate(now));
  };

  const handleThisMonth = () => {
    const now = new Date();
    setStartDate(formatDate(getStartOfMonth(now)));
    setEndDate(formatDate(now));
  };

  const handleLast30Days = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    setStartDate(formatDate(thirtyDaysAgo));
    setEndDate(formatDate(now));
  };

  const handleAllTime = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Executive Dashboard</h1>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-lg border">
          <Button
            size="sm"
            variant={activeTab === 'evaluation' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('evaluation')}
            className={`text-xs h-8 ${activeTab === 'evaluation' ? 'bg-primary text-white' : 'text-gray-600'}`}
          >
            Sample Evaluation
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'final_inspection' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('final_inspection')}
            className={`text-xs h-8 ${activeTab === 'final_inspection' ? 'bg-primary text-white' : 'text-gray-600'}`}
          >
            Final Inspection (FRI)
          </Button>
        </div>
      </div>

      {/* Date & Entity Filter Bar */}
      <Card className="shadow-sm">
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border rounded-md px-2.5 py-1 text-xs w-full bg-white h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-600">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border rounded-md px-2.5 py-1 text-xs w-full bg-white h-9"
              />
            </div>
            <div>
              <SearchableSelect
                value={customerId}
                onChange={(val) => setCustomerId(val)}
                options={customers.map((c: any) => ({ value: String(c.id), label: c.name }))}
                placeholder="All Customers"
              />
            </div>
            <div>
              <SearchableSelect
                value={factoryName}
                onChange={(val) => setFactoryName(val)}
                options={factories.map((f: any) => ({ value: f.name, label: f.name }))}
                placeholder="All Factories"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
            <span className="text-xs text-gray-500">
              {startDate || endDate
                ? `Filtered: ${startDate || 'start'} to ${endDate || 'now'}`
                : 'Showing all time historical data'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleThisWeek}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
              >
                This Week
              </button>
              <button
                onClick={handleThisMonth}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
              >
                This Month
              </button>
              <button
                onClick={handleLast30Days}
                className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium"
              >
                Last 30 Days
              </button>
              <button
                onClick={handleAllTime}
                className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold"
              >
                Clear / All Time
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Content */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Loading analytics metrics...</div>
      ) : activeTab === 'evaluation' ? (
        <EvalAnalytics data={data} />
      ) : (
        <FinalInspAnalytics data={data} />
      )}
    </div>
  );
};
