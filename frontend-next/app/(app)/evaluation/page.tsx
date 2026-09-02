'use client';

import React from 'react';
import { useEvaluationForm } from '@/features/evaluation/useEvaluationForm';
import { EvaluationListView } from '@/features/evaluation/EvaluationListView';
import { EvaluationFormView } from '@/features/evaluation/EvaluationFormView';

export default function EvaluationPage() {
  const form = useEvaluationForm();

  const handleClose = () => {
    form.setIsOpen(false);
    form.setEditingId(null);
    form.reset();
  };

  return (
    <div>
      <EvaluationListView
        inspectionData={form.inspectionData}
        isLoading={form.isInspectionsLoading}
        page={form.page}
        setPage={form.setPage}
        filters={form.filters}
        setFilters={form.setFilters}
        serverDrafts={form.serverDrafts}
        onNewEvaluation={() => {
          form.reset();
          form.setEditingId(null);
          form.setIsOpen(true);
        }}
        onEdit={form.handleEditInspection}
        onDuplicate={form.handleDuplicateInspection}
        onOpenDraft={form.draftsManager.handleOpenDraft}
        onDownloadPdf={form.handleDownloadPdf}
        onEmail={(id) => form.emailMutation.mutate(id)}
        onDelete={(id) => {
          if (confirm('Are you sure you want to delete this evaluation report?')) {
            form.deleteMutation.mutate(id);
          }
        }}
      />

      <EvaluationFormView
        isOpen={form.isOpen}
        onClose={handleClose}
        editingId={form.editingId}
        register={form.register}
        setValue={form.setValue}
        getValues={form.getValues}
        watch={form.watch}
        fields={form.fields}
        append={form.append}
        remove={form.remove}
        replace={form.replace}
        sampleCount={form.sampleCount}
        setSampleCount={form.setSampleCount}
        accessories={form.accessories}
        setAccessories={form.setAccessories}
        imageSlots={form.imageSlots}
        setImageSlots={form.setImageSlots}
        addImageSlot={form.addImageSlot}
        removeImageSlot={form.removeImageSlot}
        updateImageSlot={form.updateImageSlot}
        factories={form.factories}
        customers={form.customers}
        templates={form.templates}
        draftsManager={form.draftsManager}
        isSubmitting={form.isSubmitting}
        onSubmit={form.handleSubmit(form.handleFormSubmit)}
      />
    </div>
  );
}
