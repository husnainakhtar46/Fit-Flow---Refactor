'use client';

import React from 'react';
import { useFinalInspection } from '@/features/final-inspection/useFinalInspection';
import { FinalInspectionListView } from '@/features/final-inspection/FinalInspectionListView';
import { FinalInspectionFormView } from '@/features/final-inspection/FinalInspectionFormView';

export default function FinalInspectionsPage() {
  const fi = useFinalInspection();

  return (
    <div>
      <FinalInspectionListView
        inspectionsData={fi.inspectionsData}
        isLoading={fi.isInspectionsLoading}
        page={fi.page}
        setPage={fi.setPage}
        filters={fi.filters}
        setFilters={fi.setFilters}
        onNewInspection={() => {
          fi.reset();
          fi.setEditingId(null);
          fi.setIsOpen(true);
        }}
        onEdit={fi.handleEditInspection}
        onDownloadPdf={fi.handleDownloadPdf}
        onEmail={(id) => fi.emailMutation.mutate(id)}
        onDelete={(id) => {
          if (confirm('Are you sure you want to delete this Final Inspection report?')) {
            fi.deleteMutation.mutate(id);
          }
        }}
      />

      <FinalInspectionFormView
        isOpen={fi.isOpen}
        onClose={() => {
          fi.setIsOpen(false);
          fi.setEditingId(null);
          fi.reset();
        }}
        editingId={fi.editingId}
        register={fi.register}
        setValue={fi.setValue}
        getValues={fi.getValues}
        watch={fi.watch}
        fields={fi.fields}
        append={fi.append}
        remove={fi.remove}
        replace={fi.replace}
        sampleCount={fi.sampleCount}
        setSampleCount={fi.setSampleCount}
        defects={fi.defects}
        setDefects={fi.setDefects}
        sizeBreakdowns={fi.sizeBreakdowns}
        setSizeBreakdowns={fi.setSizeBreakdowns}
        defectImages={fi.defectImages}
        setDefectImages={fi.setDefectImages}
        factories={fi.factories}
        customers={fi.customers}
        templates={fi.templates}
        aqlCalculations={fi.aqlCalculations}
        isSubmitting={fi.isSubmitting}
        onSubmit={fi.handleSubmit(fi.handleFormSubmit)}
      />
    </div>
  );
}
