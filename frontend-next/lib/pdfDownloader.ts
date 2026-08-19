'use client';

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import api from '@/lib/api';

interface DownloadPdfOptions {
  endpoint: string;
  id: string;
  filename: string;
  fallbackDocument: React.ReactElement;
  fallbackDataGetter?: () => Promise<any>;
}

export async function downloadReportPdf({
  endpoint,
  id,
  filename,
  fallbackDocument,
  fallbackDataGetter,
}: DownloadPdfOptions): Promise<void> {
  const toastId = toast.loading('Generating PDF...');

  try {
    const response = await api.get(`${endpoint}${id}/pdf/`, {
      responseType: 'blob',
      timeout: 30000,
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.dismiss(toastId);
    toast.success('PDF Downloaded');
  } catch (serverError: any) {
    console.warn('Backend PDF failed, attempting client-side generation:', serverError);
    toast.message('Backend unavailable. Generating locally...', { id: toastId });

    try {
      let doc = fallbackDocument;
      if (fallbackDataGetter) {
        doc = await fallbackDataGetter();
      }

      const blob = await pdf(doc as any).toBlob();
      saveAs(blob, filename);

      toast.dismiss(toastId);
      toast.success('PDF Downloaded (Client-Side Mode)');
    } catch (clientError) {
      console.error('Client PDF generation failed:', clientError);
      toast.dismiss(toastId);
      toast.error('PDF generation failed.');
    }
  }
}

export async function saveOfflinePdf(document: React.ReactElement, filename: string): Promise<void> {
  try {
    const blob = await pdf(document as any).toBlob();
    saveAs(blob, filename);
    toast.success('Saved Offline! PDF report generated.');
  } catch (pdfErr) {
    console.warn('Offline PDF generation skipped:', pdfErr);
    toast.success('Saved locally! Will sync when online.');
  }
}
