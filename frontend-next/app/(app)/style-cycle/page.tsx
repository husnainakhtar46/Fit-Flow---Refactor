'use client';

import React from 'react';
import { useStyleCycle } from '@/features/style-cycle/useStyleCycle';
import { StyleListView } from '@/features/style-cycle/StyleListView';
import { StyleDetailView } from '@/features/style-cycle/StyleDetailView';
import { CommentEditForm } from '@/features/style-cycle/CommentEditForm';
import { StyleFormModal } from '@/features/style-cycle/StyleFormModal';

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

  const handleCommentSubmit = async (data: any, newImages: File[]) => {
    try {
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
            onBack={() => sc.setSelectedStyleId(null)}
            onEditStyle={(style) => {
              sc.setEditingStyle(style);
              sc.setIsStyleFormOpen(true);
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
          isSubmitting={
            sc.createCommentMutation.isPending || sc.updateCommentMutation.isPending
          }
        />
      )}
    </div>
  );
}
