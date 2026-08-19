'use client';

import React from 'react';
import { Plus, FileText, Mail, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import SyncManager from '@/components/shared/SyncManager';
import InspectionFilters from '@/features/inspection-filters/InspectionFilters';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/utils/dateFormatter';

interface FinalInspectionListViewProps {
  inspectionsData: any;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  filters: any;
  setFilters: (filters: any) => void;
  onNewInspection: () => void;
  onEdit: (inspection: any) => void;
  onDownloadPdf: (id: string, style: string) => void;
  onEmail: (id: string) => void;
  onDelete: (id: string) => void;
}

export const FinalInspectionListView: React.FC<FinalInspectionListViewProps> = ({
  inspectionsData,
  isLoading,
  page,
  setPage,
  filters,
  setFilters,
  onNewInspection,
  onEdit,
  onDownloadPdf,
  onEmail,
  onDelete,
}) => {
  const { canCreateInspections, canEditFinalInspection, isReadOnly } = useAuth();
  const inspections =
    inspectionsData?.results || (Array.isArray(inspectionsData) ? inspectionsData : []);
  const totalCount = inspectionsData?.count;

  const getDecisionBadge = (decision: string) => {
    switch (decision?.toLowerCase()) {
      case 'passed':
      case 'pass':
      case 'accepted':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">
            PASSED
          </span>
        );
      case 'failed':
      case 'fail':
      case 'rejected':
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Final Inspection (FRI)</h1>
          <p className="text-sm text-gray-500">
            AQL 2.5 standard final shipment inspections and quality audits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SyncManager type="final_inspection" />
          {canCreateInspections && (
            <Button onClick={onNewInspection} className="bg-primary gap-2">
              <Plus className="w-4 h-4" /> New Final Inspection
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
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

      {/* Inspections Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Style</TableHead>
              <TableHead>PO #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Factory</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Order Qty</TableHead>
              <TableHead className="text-center">AQL Verdict</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Loading inspections...
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No final inspections found.
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-medium text-gray-900">{item.style}</TableCell>
                  <TableCell>{item.po_number || '-'}</TableCell>
                  <TableCell>{item.customer_name || item.customer?.name || '-'}</TableCell>
                  <TableCell>{item.factory || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 text-xs rounded bg-purple-50 text-purple-700 font-medium">
                      {item.inspection_type || 'Final'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.order_quantity ? item.order_quantity.toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="text-center">{getDecisionBadge(item.decision)}</TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onDownloadPdf(item.id, item.style)}
                        title="Download PDF"
                        className="h-8 w-8 text-gray-600 hover:text-blue-600"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEmail(item.id)}
                        title="Send Email"
                        className="h-8 w-8 text-gray-600 hover:text-blue-600"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      {!isReadOnly && canEditFinalInspection(item.created_by) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                          title="Edit Inspection"
                          className="h-8 w-8 text-gray-600 hover:text-amber-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {!isReadOnly && canEditFinalInspection(item.created_by) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(item.id)}
                          title="Delete"
                          className="h-8 w-8 text-gray-600 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
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
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};
