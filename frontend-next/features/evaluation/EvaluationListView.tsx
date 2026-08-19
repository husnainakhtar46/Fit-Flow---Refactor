'use client';

import React from 'react';
import { Plus, FileText, Mail, Pencil, Trash2, Clock, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/shared/Pagination';
import SyncManager from '@/components/shared/SyncManager';
import InspectionFilters from '@/features/inspection-filters/InspectionFilters';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/utils/dateFormatter';

interface EvaluationListViewProps {
  inspectionData: any;
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  filters: any;
  setFilters: (filters: any) => void;
  serverDrafts: any[];
  onNewEvaluation: () => void;
  onEdit: (inspection: any) => void;
  onOpenDraft: (draft: any) => void;
  onDownloadPdf: (id: string, style: string) => void;
  onEmail: (id: string) => void;
  onDelete: (id: string) => void;
}

export const EvaluationListView: React.FC<EvaluationListViewProps> = ({
  inspectionData,
  isLoading,
  page,
  setPage,
  filters,
  setFilters,
  serverDrafts,
  onNewEvaluation,
  onEdit,
  onOpenDraft,
  onDownloadPdf,
  onEmail,
  onDelete,
}) => {
  const { canCreateInspections, canEditEvaluation, isReadOnly } = useAuth();
  const inspections = inspectionData?.results || (Array.isArray(inspectionData) ? inspectionData : []);
  const totalCount = inspectionData?.count;

  const getDecisionBadge = (decision: string) => {
    switch (decision?.toLowerCase()) {
      case 'accepted':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800">Accepted</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">Rejected</span>;
      case 'represent':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800">Represent</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-700">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Sample Evaluation</h1>
          <p className="text-sm text-gray-500">Manage garment quality evaluations and reports</p>
        </div>

        <div className="flex items-center gap-3">
          <SyncManager type="evaluation" />
          {canCreateInspections && (
            <Button onClick={onNewEvaluation} className="bg-primary gap-2">
              <Plus className="w-4 h-4" /> New Evaluation
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

      {/* Server Drafts Section (if any) */}
      {serverDrafts.length > 0 && (
        <div className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Pending Server Drafts ({serverDrafts.length})
          </h3>
          <div className="divide-y divide-amber-200/60 bg-white rounded border border-amber-200">
            {serverDrafts.map((draft) => (
              <div key={draft.id} className="p-3 flex items-center justify-between hover:bg-amber-50/30">
                <div>
                  <span className="font-semibold text-sm text-gray-800">
                    {draft.style || 'Untitled Style'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    PO: {draft.po_number || '-'} | Color: {draft.color || '-'} | Stage: {draft.stage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenDraft(draft)}
                    className="h-8 gap-1 text-xs border-amber-300 hover:bg-amber-100"
                  >
                    <FileEdit className="w-3.5 h-3.5" /> Resume Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(draft.id)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspections Table */}
      <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Style</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>PO #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Factory</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Loading evaluations...
                </TableCell>
              </TableRow>
            ) : inspections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No evaluations found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              inspections.map((item: any) => (
                <TableRow key={item.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-medium text-gray-900">{item.style}</TableCell>
                  <TableCell>{item.color || '-'}</TableCell>
                  <TableCell>{item.po_number || '-'}</TableCell>
                  <TableCell>{item.customer_name || item.customer?.name || '-'}</TableCell>
                  <TableCell>{item.factory || '-'}</TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-50 text-blue-700 font-medium">
                      {item.stage}
                    </span>
                  </TableCell>
                  <TableCell>{getDecisionBadge(item.decision)}</TableCell>
                  <TableCell className="text-xs text-gray-500">{formatDate(item.created_at)}</TableCell>
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
                      {!isReadOnly && canEditEvaluation && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                          title="Edit Evaluation"
                          className="h-8 w-8 text-gray-600 hover:text-amber-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {!isReadOnly && canEditEvaluation && (
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
          hasNext={!!inspectionData?.next}
          hasPrevious={!!inspectionData?.previous}
          onPageChange={setPage}
          totalCount={totalCount}
        />
      </div>
    </div>
  );
};
