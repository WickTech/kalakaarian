import { api } from '@/lib/api';
import type { UploadPurpose } from '@/stores/uploadStore';

export interface UploadFileCallbacks {
  onProgress: (loaded: number, total: number, speedBps: number, etaSec: number) => void;
  onXhr: (xhr: XMLHttpRequest) => void;
  signal?: AbortSignal;
}

export interface UploadFileResult {
  fileUrl: string;
  key: string;
}

export class UploadError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, message: string, retryable: boolean) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  cb: UploadFileCallbacks,
): Promise<UploadFileResult> {
  if (cb.signal?.aborted) throw new UploadError('canceled', 'canceled', false);

  let presigned: { uploadUrl: string; fileUrl: string; key: string };
  try {
    presigned = await api.getUploadUrl(file.name, file.type, purpose);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'presign failed';
    throw new UploadError('presign_failed', msg, true);
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    cb.onXhr(xhr);

    const startTs = Date.now();

    xhr.upload.addEventListener('progress', (ev) => {
      if (!ev.lengthComputable) return;
      const elapsed = Math.max(1, Date.now() - startTs) / 1000;
      const speed = ev.loaded / elapsed;
      const eta = speed > 0 ? (ev.total - ev.loaded) / speed : 0;
      cb.onProgress(ev.loaded, ev.total, speed, eta);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        cb.onProgress(file.size, file.size, 0, 0);
        resolve();
      } else if (xhr.status >= 500) {
        reject(new UploadError('server_error', `HTTP ${xhr.status}`, true));
      } else {
        reject(new UploadError('upload_rejected', `HTTP ${xhr.status}`, false));
      }
    });
    xhr.addEventListener('error', () =>
      reject(new UploadError(navigator.onLine ? 'network' : 'offline', 'network error', true)),
    );
    xhr.addEventListener('timeout', () =>
      reject(new UploadError('timeout', 'upload timed out', true)),
    );
    xhr.addEventListener('abort', () =>
      reject(new UploadError('canceled', 'upload canceled', false)),
    );

    if (cb.signal) {
      const onAbort = () => xhr.abort();
      cb.signal.addEventListener('abort', onAbort, { once: true });
    }

    xhr.open('PUT', presigned.uploadUrl, true);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });

  return { fileUrl: presigned.fileUrl, key: presigned.key };
}
