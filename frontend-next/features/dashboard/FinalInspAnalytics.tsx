'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { StatCard } from './StatCard';

interface FinalInspAnalyticsProps {
  data: any;
}

export const FinalInspAnalytics: React.FC<FinalInspAnalyticsProps> = ({ data }) => {
  const monthlyData = new Map<string, { timestamp: number; label: string; pass: number; fail: number }>();

  data?.fi_monthly_pass?.forEach((item: any) => {
    const d = new Date(item.month);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const current = monthlyData.get(key) || { timestamp: d.getTime(), label, pass: 0, fail: 0 };
    current.pass = item.count;
    monthlyData.set(key, current);
  });

  data?.fi_monthly_fail?.forEach((item: any) => {
    const d = new Date(item.month);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const current = monthlyData.get(key) || { timestamp: d.getTime(), label, pass: 0, fail: 0 };
    current.fail = item.count;
    monthlyData.set(key, current);
  });

  const fiTrendData = Array.from(monthlyData.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((item) => ({
      name: item.label,
      pass: item.pass,
      fail: item.fail,
    }));

  const fiCustomerData =
    data?.fi_by_customer?.map((item: any) => ({
      name: item.customer__name || 'Unknown',
      pass: item.pass_count || 0,
      fail: item.fail_count || 0,
    })) || [];

  const fiDefectsData =
    data?.fi_top_defects?.map((item: any) => ({
      name: item.description || 'Unknown',
      value: item.total || 0,
    })) || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Final Inspections" value={data?.fi_total || 0} />
        <StatCard
          title="FI Pass Rate"
          value={`${data?.fi_pass_rate || 0}%`}
          color="text-green-600"
        />
        <StatCard title="FI Passed" value={data?.fi_pass || 0} color="text-green-600" />
        <StatCard title="FI Failed" value={data?.fi_fail || 0} color="text-red-600" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Pass/Fail Trend */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Inspection Pass / Fail Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fiTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pass" stroke="#22c55e" strokeWidth={2} name="Pass" />
                <Line type="monotone" dataKey="fail" stroke="#ef4444" strokeWidth={2} name="Fail" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inspections by Customer */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Inspections by Customer</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fiCustomerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={90} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass" />
                <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Defects */}
        <Card className="h-[350px] md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Top Defect Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fiDefectsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="value" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
