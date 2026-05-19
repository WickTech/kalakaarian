import { AlertTriangle, RotateCcw } from 'lucide-react';
import type { UploadItem } from '@/stores/uploadStore';

export function UploadErrorState({
  item,
  onRetry,
}: {
  item: UploadItem;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-red-300">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 truncate" title={item.error?.message}>
        {item.error?.message || 'Upload failed'}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-400/40 text-red-200 hover:bg-red-500/10 transition"
      >
        <RotateCcw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
}
