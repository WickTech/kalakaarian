const DEFAULT_MAX_EDGE = 2400;
const DEFAULT_QUALITY = 0.85;
const COMPRESS_THRESHOLD = 2 * 1024 * 1024;

export interface CompressOptions {
  maxEdge?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/webp';
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.size <= COMPRESS_THRESHOLD) return file;

  const { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY, mimeType = 'image/jpeg' } = opts;

  const bitmap = await loadBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, mimeType, quality),
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const newName = file.name.replace(/\.[^.]+$/, '') + '.' + ext;
    return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
  } finally {
    if ('close' in bitmap) (bitmap as ImageBitmap).close();
  }
}

export async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to HTMLImageElement
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}
