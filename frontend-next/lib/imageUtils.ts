import imageCompression from 'browser-image-compression';

const DEFAULT_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1600,
  fileType: 'image/webp',
  useWebWorker: true,
  initialQuality: 0.85,
};

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
