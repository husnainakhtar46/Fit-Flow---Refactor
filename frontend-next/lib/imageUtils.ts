import imageCompression from 'browser-image-compression';
import { getBaseURL } from './api';

const DEFAULT_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  fileType: 'image/webp',
  useWebWorker: true,
  initialQuality: 0.85,
};

export function getFullImageUrl(url?: string | null): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const base = getBaseURL().replace(/\/+$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

export async function compressImage(
  file: File,
  options?: Partial<Parameters<typeof imageCompression>[1]>
): Promise<File> {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const compressed = await imageCompression(file, merged);

  return new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

export async function compressImages(
  files: File[],
  options?: Partial<Parameters<typeof imageCompression>[1]>
): Promise<File[]> {
  return Promise.all(
    files.map(async (file) => {
      try {
        return await compressImage(file, options);
      } catch (err) {
        console.warn(`Compression skipped for ${file.name}:`, err);
        return file;
      }
    })
  );
}
