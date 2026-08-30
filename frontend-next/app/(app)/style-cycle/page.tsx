'use client';

import React from 'react';
import { useStyleCycle } from '@/features/style-cycle/useStyleCycle';
import { StyleListView } from '@/features/style-cycle/StyleListView';
import { StyleDetailView } from '@/features/style-cycle/StyleDetailView';
import { CommentEditForm } from '@/features/style-cycle/CommentEditForm';
import { StyleFormModal } from '@/features/style-cycle/StyleFormModal';
import { CommentCategoryKey } from '@/features/style-cycle/types';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';

export default function StyleCyclePage() {
  const sc = useStyleCycle();

  const handleStyleSubmit = (data: any) => {
    if (sc.editingStyle) {
      sc.updateStyleMutation.mutate({
        id: sc.editingStyle.id,
        data,
      });
    } else {
      sc.createStyleMutation.mutate(data);
    }
  };

  const handleCommentSubmit = async (
    data: any,
    pendingImagesByCategory: Record<CommentCategoryKey, File[]>
  ) => {
    try {
      let commentId = sc.editingComment?.id;

      if (sc.editingComment) {
        await sc.updateCommentMutation.mutateAsync({
          commentId: sc.editingComment.id,
          data,
        });
      } else if (sc.selectedStyleId) {
        const res = await sc.createCommentMutation.mutateAsync({
          styleId: sc.selectedStyleId,
          data,
        });
        commentId = res?.data?.id;
      }

      if (commentId) {
        const uploadPromises: Promise<any>[] = [];
        let totalFiles = 0;

        for (const [category, files] of Object.entries(pendingImagesByCategory)) {
          for (const file of files) {
            totalFiles++;
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append('image', compressed);
            fd.append('category', category);
            uploadPromises.push(
              sc.uploadCommentImageMutation.mutateAsync({
                commentId,
                formData: fd,
              })
            );
          }
        }

        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises);
          toast.success(`${totalFiles} photo(s) uploaded successfully`);
        }

        // Guarantee fresh data with newly uploaded images
        sc.queryClient.invalidateQueries({ queryKey: ['sample-comments', sc.selectedStyleId] });
        sc.queryClient.invalidateQueries({ queryKey: ['styles'] });
        sc.queryClient.invalidateQueries({ queryKey: ['style-detail', sc.selectedStyleId] });
      }
    } catch {
      // Error is caught and surfaced by mutation onError
    }
  };

  return (
    <div>
      {sc.selectedStyleId ? (
        sc.isDetailLoading || !sc.styleDetail ? (
          <div className="text-center py-20 text-gray-500">Loading style details...</div>
        ) : (
          <StyleDetailView
            style={sc.styleDetail}
            comments={sc.sampleComments}
            isLoading={sc.isCommentsLoading}
            customers={sc.customers}
            factories={sc.factories}
            isSubmittingStyle={sc.updateStyleMutation.isPending}
            onBack={() => sc.setSelectedStyleId(null)}
            onEditStyle={(data) => {
              sc.updateStyleMutation.mutate({
                id: sc.styleDetail.id,
                data,
              });
            }}
            onDeleteStyle={(styleId) => sc.deleteStyleMutation.mutate(styleId)}
            onAddComment={() => {
              sc.setEditingComment(null);
              sc.setIsCommentFormOpen(true);
            }}
            onEditComment={(comment) => {
              sc.setEditingComment(comment);
              sc.setIsCommentFormOpen(true);
            }}
            onDeleteComment={(commentId) => {
              if (confirm('Delete this stage feedback?')) {
                sc.deleteCommentMutation.mutate(commentId);
              }
            }}
            onDeleteImage={(imageId) => sc.deleteCommentImageMutation.mutate(imageId)}
            onAddLink={({ label, url }) => {
              if (sc.selectedStyleId) {
                sc.addStyleLinkMutation.mutate({
                  styleId: sc.selectedStyleId,
                  label,
                  url,
                });
              }
            }}
            onDeleteLink={(linkId) => sc.deleteStyleLinkMutation.mutate(linkId)}
            isAddingLink={sc.addStyleLinkMutation.isPending}
          />
        )
      ) : (
        <StyleListView
          stylesData={sc.stylesData}
          isLoading={sc.isStylesLoading}
          search={sc.search}
          setSearch={sc.setSearch}
          customerFilter={sc.customerFilter}
          setCustomerFilter={sc.setCustomerFilter}
          customers={sc.customers}
          factoryFilter={sc.factoryFilter}
          setFactoryFilter={sc.setFactoryFilter}
          factories={sc.factories}
          page={sc.page}
          setPage={sc.setPage}
          onSelectStyle={(id) => sc.setSelectedStyleId(id)}
          onNewStyle={() => {
            sc.setEditingStyle(null);
            sc.setIsStyleFormOpen(true);
          }}
        />
      )}

      {/* Create / Edit Style Modal */}
      <StyleFormModal
        isOpen={sc.isStyleFormOpen}
        onClose={() => {
          sc.setIsStyleFormOpen(false);
          sc.setEditingStyle(null);
        }}
        onSubmit={handleStyleSubmit}
        style={sc.editingStyle}
        customers={sc.customers}
        factories={sc.factories}
        isSubmitting={sc.createStyleMutation.isPending || sc.updateStyleMutation.isPending}
      />

      {/* Comment Edit / Add Modal */}
      {sc.selectedStyleId && (
        <CommentEditForm
          isOpen={sc.isCommentFormOpen}
          onClose={() => {
            sc.setIsCommentFormOpen(false);
            sc.setEditingComment(null);
          }}
          styleId={sc.selectedStyleId}
          comment={sc.editingComment}
          onSubmit={handleCommentSubmit}
          onDeleteExistingImage={(imageId) => sc.deleteCommentImageMutation.mutate(imageId)}
          isSubmitting={
            sc.createCommentMutation.isPending ||
            sc.updateCommentMutation.isPending ||
            sc.uploadCommentImageMutation.isPending
          }
        />
      )}
    </div>
  );
}
