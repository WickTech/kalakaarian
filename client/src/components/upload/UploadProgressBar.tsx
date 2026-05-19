import { Progress } from '@/components/ui/progress';
import type { UploadItem } from '@/stores/uploadStore';

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fmtSpeed(bps: number): string {
  return `${fmtBytes(bps)}/s`;
}

function fmtEta(s: number): string {
  if (!s || !isFinite(s)) return '';
  if (s < 60) return `~${Math.round(s)}s left`;
  return `~${Math.round(s / 60)}m left`;
}

export function UploadProgressBar({ item }: { item: UploadItem }) {
  const pct = item.total ? Math.min(100, Math.round((item.loaded / item.total) * 100)) : 0;
  const showLive = item.status === 'uploading';
  return (
    <div className="space-y-1">
      <Progress
        value={pct}
        className="h-1.5 bg-white/5"
        aria-label={`Upload progress: ${pct}%`}
      />
      <div className="flex justify-between text-[10px] text-chalk-faint">
        <span>{pct}%</span>
        {showLive && item.speedBps > 0 && (
          <span>
            {fmtSpeed(item.speedBps)} · {fmtEta(item.etaSec)}
          </span>
        )}
      </div>
    </div>
  );
}
