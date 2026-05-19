import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUploadStore, UploadItem, UploadPurpose, selectItems } from '@/stores/uploadStore';
import { uploadFile, UploadError } from '@/lib/upload/uploadFile';
import { compressImage } from '@/lib/upload/compressImage';
import { videoThumbnail } from '@/lib/upload/videoThumbnail';
import { backoffDelay, sleep, MAX_ATTEMPTS } from '@/lib/upload/retry';

export interface UseUploaderOptions {
  purpose: UploadPurpose;
  accept?: string[];
  maxBytes?: number;
  multiple?: boolean;
  compressImages?: boolean;
  generateVideoThumbnail?: boolean;
  onItemSuccess?: (url: string, item: UploadItem) => void;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function validateFile(file: File, opts: UseUploaderOptions): string | null {
  if (opts.accept && opts.accept.length > 0 && !opts.accept.includes(file.type)) {
    return `Unsupported type: ${file.type || file.name}`;
  }
  if (opts.maxBytes && file.size > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / (1024 * 1024));
    return `File too large (max ${mb} MB)`;
  }
  return null;
}

export function useUploader(opts: UseUploaderOptions) {
  const add = useUploadStore((s) => s.add);
  const patch = useUploadStore((s) => s.patch);
  const remove = useUploadStore((s) => s.remove);
  const clear = useUploadStore((s) => s.clear);
  const items = useUploadStore(useShallow(selectItems));

  const ownItems = useMemo(
    () => items.filter((i) => i.purpose === opts.purpose),
    [items, opts.purpose],
  );

  const runUpload = useCallback(
    async (id: string) => {
      const initial = useUploadStore.getState().items[id];
      if (!initial) return;

      let working = initial.file;
      if (opts.compressImages && working.type.startsWith('image/')) {
        patch(id, { status: 'compressing' });
        try {
          working = await compressImage(working);
        } catch {
          /* fall back to original */
        }
      }
      if (opts.generateVideoThumbnail && working.type.startsWith('video/')) {
        try {
          const thumb = await videoThumbnail(working);
          if (thumb) patch(id, { thumbnail: thumb });
        } catch {
          /* non-fatal */
        }
      }

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (useUploadStore.getState().items[id]?.status === 'canceled') return;
        patch(id, {
          status: 'uploading',
          attempt,
          startedAt: Date.now(),
          loaded: 0,
          total: working.size,
        });
        try {
          const { fileUrl, key } = await uploadFile(working, opts.purpose, {
            onProgress: (loaded, total, speedBps, etaSec) =>
              patch(id, { loaded, total, speedBps, etaSec }),
            onXhr: (xhr) => patch(id, { xhr }),
          });
          patch(id, {
            status: 'success',
            finalUrl: fileUrl,
            key,
            loaded: working.size,
            total: working.size,
            xhr: undefined,
          });
          const item = useUploadStore.getState().items[id];
          if (item) {
            item.onSuccess?.(fileUrl, item);
            opts.onItemSuccess?.(fileUrl, item);
          }
          return;
        } catch (err) {
          const ue = err as UploadError;
          if (ue.code === 'canceled') {
            patch(id, { status: 'canceled', xhr: undefined });
            return;
          }
          if (!ue.retryable || attempt === MAX_ATTEMPTS - 1) {
            patch(id, {
              status: 'failed',
              error: { code: ue.code, message: ue.message },
              xhr: undefined,
            });
            return;
          }
          await sleep(backoffDelay(attempt));
        }
      }
    },
    [opts, patch],
  );

  const enqueue = useCallback(
    (files: File[]): string[] => {
      const ids: string[] = [];
      const incoming = opts.multiple ? files : files.slice(0, 1);
      for (const file of incoming) {
        const err = validateFile(file, opts);
        const id = newId();
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        const item: UploadItem = {
          id,
          file,
          purpose: opts.purpose,
          preview,
          status: err ? 'failed' : 'queued',
          loaded: 0,
          total: file.size,
          speedBps: 0,
          etaSec: 0,
          attempt: 0,
          error: err ? { code: 'invalid', message: err } : undefined,
          onSuccess: opts.onItemSuccess,
        };
        add(item);
        ids.push(id);
        if (!err) void runUpload(id);
      }
      return ids;
    },
    [opts, add, runUpload],
  );

  const cancel = useCallback(
    (id: string) => {
      const item = useUploadStore.getState().items[id];
      if (item?.xhr) item.xhr.abort();
      patch(id, { status: 'canceled', xhr: undefined });
    },
    [patch],
  );

  const retry = useCallback(
    (id: string) => {
      const item = useUploadStore.getState().items[id];
      if (!item) return;
      patch(id, { status: 'queued', error: undefined, attempt: 0 });
      void runUpload(id);
    },
    [patch, runUpload],
  );

  return { items: ownItems, enqueue, cancel, retry, remove, clear };
}
