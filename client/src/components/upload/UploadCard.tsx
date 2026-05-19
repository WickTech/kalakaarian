import { CheckCircle2, Loader2, X, FileVideo, FileImage } from 'lucide-react';
import type { UploadItem } from '@/stores/uploadStore';
import { UploadProgressBar } from './UploadProgressBar';
import { UploadErrorState } from './UploadErrorState';

interface Props {
  item: UploadItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

function fmtSize(n: number): string {
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadCard({ item, onCancel, onRetry, onRemove }: Props) {
  const thumb = item.thumbnail || item.preview;
  const isVideo = item.file.type.startsWith('video/');
  const inFlight = item.status === 'uploading' || item.status === 'compressing' || item.status === 'queued';

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : isVideo ? (
          <FileVideo className="w-5 h-5 text-chalk-faint" />
        ) : (
          <FileImage className="w-5 h-5 text-chalk-faint" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-xs text-chalk truncate flex-1" title={item.file.name}>
            {item.file.name}
          </p>
          <span className="text-[10px] text-chalk-faint shrink-0">{fmtSize(item.file.size)}</span>
        </div>

        {item.status === 'failed' ? (
          <UploadErrorState item={item} onRetry={() => onRetry(item.id)} />
        ) : item.status === 'success' ? (
          <div className="flex items-center gap-1.5 text-[11px] text-green-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
          </div>
        ) : item.status === 'canceled' ? (
          <p className="text-[11px] text-chalk-faint">Canceled</p>
        ) : (
          <UploadProgressBar item={item} />
        )}
      </div>

      <div className="shrink-0">
        {inFlight ? (
          <button
            type="button"
            onClick={() => onCancel(item.id)}
            aria-label="Cancel upload"
            className="p-1.5 rounded-full text-chalk-faint hover:text-chalk hover:bg-white/5 transition"
          >
            {item.status === 'uploading' ? (
              <X className="w-3.5 h-3.5" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label="Remove from list"
            className="p-1.5 rounded-full text-chalk-faint hover:text-chalk hover:bg-white/5 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
