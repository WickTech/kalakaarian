import { loadBitmap } from './compressImage';

// Re-encodes an image through a <canvas> so the upload carries none of the
// source file's metadata — notably EXIF, which can include the photo's GPS
// coordinates. A canvas re-encode never preserves source metadata.
//
// This runs on every image upload (see useUploader). For large images
// compressImage already re-encodes (and so already strips); this covers the
// small-image path where compressImage returns the file untouched.

// Only these formats are re-encoded. GIFs (animation) and unknown types are
// passed through untouched.
const STRIP_TYPES: Record<string, string> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
};

export async function stripImageMetadata(file: File): Promise<File> {
  const outType = STRIP_TYPES[file.type];
  if (!outType) return file;

  const bitmap = await loadBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);

    // PNG ignores the quality arg; JPEG/WebP re-encode near-lossless.
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, outType, 0.95),
    );
    if (!blob) return file;
    return new File([blob], file.name, { type: outType, lastModified: Date.now() });
  } finally {
    if ('close' in bitmap) (bitmap as ImageBitmap).close();
  }
}
