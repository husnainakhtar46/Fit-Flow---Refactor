'use client';

import React from 'react';
import { useStyleCycle } from '@/features/style-cycle/useStyleCycle';
import { StyleListView } from '@/features/style-cycle/StyleListView';
import { StyleDetailView } from '@/features/style-cycle/StyleDetailView';
import { CommentEditForm } from '@/features/style-cycle/CommentEditForm';

export default function StyleCyclePage() {
  const sc = useStyleCycle();

  const handleCommentSubmit = async (data: any, newImages: File[]) => {
    if (sc.editingComment) {
      await sc.updateCommentMutation.mutateAsync({
        commentId: sc.editingComment.id,
        data,
      });
      for (const img of newImages) {
        const fd = new FormData();
        fd.append('image', img);
        await sc.uploadCommentImageMutation.mutateAsync({
          commentId: sc.editingComment.id,
          formData: fd,
        });
      }
    } else if (sc.selectedStyleId) {
      const res = await sc.createCommentMutation.mutateAsync({
        styleId: sc.selectedStyleId,
        data,
      });
      if (res?.data?.id) {
        for (const img of newImages) {
          const fd = new FormData();
          fd.append('image', img);
          await sc.uploadCommentImageMutation.mutateAsync({
            commentId: res.data.id,
            formData: fd,
          });
        }
      }
    }
  };

  return (
    <div>
      {sc.selectedStyleId && sc.styleDetail ? (
        <StyleDetailView
          style={sc.styleDetail}
          comments={sc.sampleComments}
          isLoading={sc.isCommentsLoading}
          onBack={() => sc.setSelectedStyleId(null)}
          onEditStyle={(style) => {
            sc.setEditingStyle(style);
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
        />
      ) : (
        <StyleListView
          stylesData={sc.stylesData}
          isLoading={sc.isStylesLoading}
          search={sc.search}
          setSearch={sc.setSearch}
          customerFilter={sc.customerFilter}
          setCustomerFilter={sc.setCustomerFilter}
          customers={sc.customers}
          page={sc.page}
          setPage={sc.setPage}
          onSelectStyle={(id) => sc.setSelectedStyleId(id)}
          onCreateStyle={(data) => sc.createStyleMutation.mutate(data)}
          isCreating={sc.createStyleMutation.isPending}
        />
      )}

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
          isSubmitting={
            sc.createCommentMutation.isPending || sc.updateCommentMutation.isPending
          }
        />
      )}
    </div>
  );
}
