'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { MessageSquare, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/Pagination';
import InspectionFilters from '@/features/inspection-filters/InspectionFilters';
import { formatDate } from '@/utils/dateFormatter';

type Inspection = {
  id: string;
  style: string;
  color: string;
  po_number: string;
  stage: string;
  decision: string;
  customer_decision: string;
  customer_feedback_comments: string;
  customer_feedback_date: string;
  created_at: string;
  created_by_username: string;
};

type FeedbackForm = {
  customer_decision: string;
  customer_feedback_comments: string;
};

export const CustomerFeedbackPage = () => {
  const queryClient = useQueryClient();
  const { canAddCustomerFeedback } = useAuth();
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    decisions: [] as string[],
    stages: [] as string[],
    customer: '',
    factory: '',
    search: '',
    ordering: '-created_at',
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<FeedbackForm>();

  const { data: inspectionsData, isLoading } = useQuery({
    queryKey: ['inspections-feedback', page, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.factory) params.append('factory', filters.factory);
      if (filters.search) params.append('search', filters.search);
      if (filters.ordering) params.append('ordering', filters.ordering);
      filters.decisions.forEach((d) => params.append('decision', d));
      filters.stages.forEach((s) => params.append('stage', s));

      const res = await api.get(`/inspections/?${params.toString()}`);
      return res.data;
    },
  });

  const inspections: Inspection[] =
    inspectionsData?.results || (Array.isArray(inspectionsData) ? inspectionsData : []);

  const updateMutation = useMutation({
    mutationFn: async (data: FeedbackForm) => {
      if (!selectedInspection) return;
      const res = await api.patch(
        `/inspections/${selectedInspection.id}/update_customer_feedback/`,
        data
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections-feedback'] });
      setIsOpen(false);
      setSelectedInspection(null);
      reset();
      toast.success('Feedback updated successfully');
    },
    onError: () => {
      toast.error('Failed to update feedback');
    },
  });

  const handleEdit = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setValue('customer_decision', inspection.customer_decision || '');
    setValue('customer_feedback_comments', inspection.customer_feedback_comments || '');
    setIsOpen(true);
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'Accepted':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> Accepted
          </Badge>
        );
      case 'Rejected':
        return (
          <Badge className="bg-red-500">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      case 'Revision Requested':
        return (
          <Badge className="bg-orange-500">
            <AlertCircle className="w-3 h-3 mr-1" /> Revision
          </Badge>
        );
      case 'Accepted with Comments':
        return (
          <Badge className="bg-blue-500">
            <MessageSquare className="w-3 h-3 mr-1" /> Comments
          </Badge>
        );
      case 'Held Internally':
        return (
          <Badge className="bg-gray-500">
            <Clock className="w-3 h-3 mr-1" /> Held
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Customer Feedback</h1>
        </div>
      </div>

      <InspectionFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearAll={() =>
          setFilters({
            dateFrom: '',
            dateTo: '',
            decisions: [],
            stages: [],
            customer: '',
            factory: '',
            search: '',
            ordering: '-created_at',
          })
        }
      />

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Style</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>QA Decision</TableHead>
              <TableHead>Customer Decision</TableHead>
              <TableHead>Evaluation Date</TableHead>
              <TableHead>Feedback Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Loading inspections...
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No evaluations found.
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((inspection) => (
                <TableRow key={inspection.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-bold text-gray-900">{inspection.style}</TableCell>
                  <TableCell>{inspection.color || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 font-medium">
                      {inspection.stage}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inspection.decision === 'Accepted'
                          ? 'default'
                          : inspection.decision === 'Rejected'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {inspection.decision || 'Pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getDecisionBadge(inspection.customer_decision)}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(inspection.created_at)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {inspection.customer_feedback_date
                      ? formatDate(inspection.customer_feedback_date)
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {canAddCustomerFeedback ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(inspection)}
                        className="h-8 text-xs gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Feedback
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-xs">View Only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          page={page}
          hasNext={!!inspectionsData?.next}
          hasPrevious={!!inspectionsData?.previous}
          onPageChange={setPage}
          isLoading={isLoading}
          totalCount={inspectionsData?.count}
        />
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setSelectedInspection(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Feedback: {selectedInspection?.style}</DialogTitle>
            <p className="text-xs text-gray-500 mt-1">
              PO: {selectedInspection?.po_number || '-'} | Stage: {selectedInspection?.stage} | QA Decision:{' '}
              <span className="font-semibold text-gray-700">{selectedInspection?.decision || 'Pending'}</span>
            </p>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-4 pt-2"
          >
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Customer Decision *</Label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'Accepted', color: 'bg-green-600 text-white border-green-600' },
                  { value: 'Rejected', color: 'bg-red-600 text-white border-red-600' },
                  { value: 'Revision Requested', color: 'bg-orange-600 text-white border-orange-600' },
                  { value: 'Accepted with Comments', color: 'bg-blue-600 text-white border-blue-600' },
                  { value: 'Held Internally', color: 'bg-gray-700 text-white border-gray-700' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setValue('customer_decision', item.value, { shouldDirty: true })}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
                      watch('customer_decision') === item.value
                        ? item.color
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {item.value}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('customer_decision', { required: true })} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Customer Feedback Comments / Notes</Label>
              <Textarea
                {...register('customer_feedback_comments')}
                placeholder="Enter customer comments, fit revisions, reasons for rejection, or approval notes..."
                rows={4}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !watch('customer_decision')}
                className="bg-primary text-white"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Feedback'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
