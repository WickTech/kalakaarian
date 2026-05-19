import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadFile, UploadError } from '../uploadFile';

vi.mock('@/lib/api', () => ({
  api: {
    getUploadUrl: vi.fn(async () => ({
      uploadUrl: 'https://signed.example/put',
      fileUrl: 'https://cdn.example/asset.png',
      key: 'gallery/u/abc.png',
    })),
  },
}));

interface FakeXhr {
  open: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
  setRequestHeader: ReturnType<typeof vi.fn>;
  upload: { addEventListener: ReturnType<typeof vi.fn>; _progress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void };
  addEventListener: ReturnType<typeof vi.fn>;
  _listeners: Record<string, () => void>;
  status: number;
}

function installXhrMock(): { instances: FakeXhr[] } {
  const instances: FakeXhr[] = [];
  class XhrMock implements FakeXhr {
    open = vi.fn();
    send = vi.fn();
    abort = vi.fn(() => this._listeners.abort?.());
    setRequestHeader = vi.fn();
    status = 0;
    _listeners: Record<string, () => void> = {};
    upload = {
      addEventListener: vi.fn((evt: string, cb: (e: { lengthComputable: boolean; loaded: number; total: number }) => void) => {
        if (evt === 'progress') this.upload._progress = cb;
      }),
      _progress: undefined as ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | undefined,
    };
    addEventListener = vi.fn((evt: string, cb: () => void) => {
      this._listeners[evt] = cb;
    });
    constructor() {
      instances.push(this);
    }
  }
  // @ts-expect-error mocked global
  globalThis.XMLHttpRequest = XhrMock;
  return { instances };
}

describe('uploadFile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('reports progress and resolves on 2xx', async () => {
    const { instances } = installXhrMock();
    const file = new File([new Uint8Array(1024)], 't.png', { type: 'image/png' });
    const onProgress = vi.fn();

    const p = uploadFile(file, 'gallery', { onProgress, onXhr: () => {} });
    // wait microtasks for presign + xhr.send
    await Promise.resolve();
    await Promise.resolve();

    const xhr = instances[0];
    expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://signed.example/put', true);

    xhr.upload._progress!({ lengthComputable: true, loaded: 512, total: 1024 });
    expect(onProgress).toHaveBeenCalled();
    const [loaded, total] = onProgress.mock.calls[0];
    expect(loaded).toBe(512);
    expect(total).toBe(1024);

    xhr.status = 200;
    xhr._listeners.load!();
    await expect(p).resolves.toMatchObject({ fileUrl: 'https://cdn.example/asset.png' });
  });

  it('rejects with retryable=true on 5xx', async () => {
    const { instances } = installXhrMock();
    const file = new File([new Uint8Array(8)], 't.png', { type: 'image/png' });
    const p = uploadFile(file, 'gallery', { onProgress: () => {}, onXhr: () => {} });
    await Promise.resolve();
    await Promise.resolve();
    const xhr = instances[0];
    xhr.status = 503;
    xhr._listeners.load!();
    await expect(p).rejects.toMatchObject({ code: 'server_error', retryable: true });
  });

  it('rejects with retryable=false on 4xx', async () => {
    const { instances } = installXhrMock();
    const file = new File([new Uint8Array(8)], 't.png', { type: 'image/png' });
    const p = uploadFile(file, 'gallery', { onProgress: () => {}, onXhr: () => {} });
    await Promise.resolve();
    await Promise.resolve();
    const xhr = instances[0];
    xhr.status = 403;
    xhr._listeners.load!();
    await expect(p).rejects.toMatchObject({ code: 'upload_rejected', retryable: false });
  });

  it('aborts via signal', async () => {
    const { instances } = installXhrMock();
    const file = new File([new Uint8Array(8)], 't.png', { type: 'image/png' });
    const ac = new AbortController();
    const p = uploadFile(file, 'gallery', { onProgress: () => {}, onXhr: () => {}, signal: ac.signal });
    await Promise.resolve();
    await Promise.resolve();
    ac.abort();
    const xhr = instances[0];
    expect(xhr.abort).toHaveBeenCalled();
    await expect(p).rejects.toBeInstanceOf(UploadError);
  });
});
