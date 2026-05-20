import { create } from 'zustand';

export type UploadStatus =
  | 'queued'
  | 'compressing'
  | 'uploading'
  | 'success'
  | 'failed'
  | 'canceled';

export type UploadPurpose = 'profile' | 'campaign' | 'gallery' | 'video';

export interface UploadItem {
  id: string;
  file: File;
  purpose: UploadPurpose;
  preview?: string;
  thumbnail?: string;
  status: UploadStatus;
  loaded: number;
  total: number;
  speedBps: number;
  etaSec: number;
  finalUrl?: string;
  key?: string;
  error?: { code: string; message: string };
  attempt: number;
  xhr?: XMLHttpRequest;
  abortController?: AbortController;
  startedAt?: number;
}

interface UploadState {
  items: Record<string, UploadItem>;
  order: string[];
  add: (item: UploadItem) => void;
  patch: (id: string, patch: Partial<UploadItem>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  items: {},
  order: [],
  add: (item) =>
    set((s) => ({
      items: { ...s.items, [item.id]: item },
      order: s.order.includes(item.id) ? s.order : [...s.order, item.id],
    })),
  patch: (id, patch) =>
    set((s) => {
      const existing = s.items[id];
      if (!existing) return s;
      return { ...s, items: { ...s.items, [id]: { ...existing, ...patch } } };
    }),
  remove: (id) =>
    set((s) => {
      const { [id]: _gone, ...rest } = s.items;
      return { items: rest, order: s.order.filter((x) => x !== id) };
    }),
  clear: () => set({ items: {}, order: [] }),
}));

export const selectItems = (s: UploadState): UploadItem[] =>
  s.order.map((id) => s.items[id]).filter(Boolean);
