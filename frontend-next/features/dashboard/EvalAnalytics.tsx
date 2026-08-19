'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { StatCard } from './StatCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface EvalAnalyticsProps {
  data: any;
}

export const EvalAnalytics: React.FC<EvalAnalyticsProps> = ({ data }) => {
  const passFailData = [
    { name: 'Accepted', value: data?.pass_count || 0, fill: '#22c55e' },
    { name: 'Rejected', value: data?.fail_count || 0, fill: '#ef4444' },
  ];

  const stageData =
    data?.inspections_by_stage?.map((item: any) => ({
      name: item.stage,
      value: item.count,
    })) || [];

  const customerData =
    data?.inspections_by_customer?.map((item: any) => ({
      name: item.customer__name || 'Unknown',
      value: item.count,
    })) || [];

  const trendData =
    data?.monthly_trend?.map((item: any) => ({
      name: new Date(item.month).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      value: item.count,
    })) || [];

  const processDecisions = (decisions: any[], key: string) => {
    const counts = { Accepted: 0, Rejected: 0, Other: 0 };
    decisions?.forEach((d: any) => {
      if (d[key] === 'Accepted') counts.Accepted += d.count;
      else if (d[key] === 'Rejected') counts.Rejected += d.count;
      else counts.Other += d.count;
    });
    return counts;
  };

  const internalCounts = processDecisions(data?.internal_decisions, 'decision');
  const customerCounts = processDecisions(data?.customer_decisions, 'customer_decision');

  const comparisonData = [
    { name: 'Accepted', Internal: internalCounts.Accepted, Customer: customerCounts.Accepted },
    { name: 'Rejected', Internal: internalCounts.Rejected, Customer: customerCounts.Rejected },
    { name: 'Other', Internal: internalCounts.Other, Customer: customerCounts.Other },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Evaluations" value={data?.total_inspections ?? 0} />
        <StatCard title="Pass Rate" value={`${data?.pass_rate ?? 0}%`} color="text-green-600" />
        <StatCard title="Accepted" value={data?.pass_count ?? 0} color="text-green-600" />
        <StatCard title="Rejected" value={data?.fail_count ?? 0} color="text-red-600" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Pass vs Fail Bar */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Pass vs Reject Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={passFailData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stage Distribution Pie */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Evaluations by Stage</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stageData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Monthly Evaluation Volume</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Internal vs Customer Decisions */}
        <Card className="h-[350px]">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Internal vs Customer Verdicts</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Internal" fill="#22c55e" />
                <Bar dataKey="Customer" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
