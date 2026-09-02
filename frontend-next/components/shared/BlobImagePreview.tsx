'use client';

import React, { useState, useEffect } from 'react';
import { getFullImageUrl } from '@/lib/imageUtils';

interface BlobImagePreviewProps {
  file: File | string | null | undefined;
  alt?: string;
  className?: string;
}

export const BlobImagePreview: React.FC<BlobImagePreviewProps> = ({
  file,
  alt = 'Image preview',
  className = 'w-full h-full object-cover',
}) => {
  const [previewSrc, setPreviewSrc] = useState<string>('');

  useEffect(() => {
    if (!file) {
      setPreviewSrc('');
      return;
    }

    if (typeof file === 'string') {
      setPreviewSrc(getFullImageUrl(file));
      return;
    }

    if (file instanceof Blob) {
      const objUrl = URL.createObjectURL(file);
      setPreviewSrc(objUrl);
      return () => {
        URL.revokeObjectURL(objUrl);
      };
    }
  }, [file]);

  if (!previewSrc) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={previewSrc} alt={alt} className={className} />
  );
};

export default BlobImagePreview;
