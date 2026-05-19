import type { UploadItem } from '@/stores/uploadStore';
import { UploadCard } from './UploadCard';

interface Props {
  items: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

export function UploadQueue({ items, onCancel, onRetry, onRemove }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <UploadCard key={it.id} item={it} onCancel={onCancel} onRetry={onRetry} onRemove={onRemove} />
      ))}
    </div>
  );
}
