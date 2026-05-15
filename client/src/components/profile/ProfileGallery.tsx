import { useRef, useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const MAX_GALLERY = 12;

interface Props {
  images: string[];
  isOwnProfile: boolean;
  onChange?: (images: string[]) => void;
}

export function ProfileGallery({ images, isOwnProfile, onChange }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const list = images ?? [];

  if (!isOwnProfile && list.length === 0) return null;

  const persist = async (next: string[]) => {
    const res = await api.updateGallery(next);
    onChange?.(res.galleryImages);
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (list.length >= MAX_GALLERY) {
      toast({ title: 'Gallery full', description: `Maximum ${MAX_GALLERY} images`, variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      const { uploadUrl, fileUrl } = await api.getUploadUrl(file.name, file.type, 'profile');
      const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error('upload failed');
      await persist([...list, fileUrl]);
      toast({ title: 'Image added' });
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (idx: number) => {
    setBusy(true);
    try {
      await persist(list.filter((_, i) => i !== idx));
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gallery</h2>
        {isOwnProfile && (
          <span className="text-xs text-chalk-dim">{list.length}/{MAX_GALLERY}</span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {list.map((url, i) => (
          <div key={`${url}-${i}`} className="relative aspect-square overflow-hidden rounded-xl bg-charcoal ring-1 ring-white/5">
            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
            {isOwnProfile && (
              <button
                onClick={() => remove(i)}
                disabled={busy}
                aria-label="Remove image"
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {isOwnProfile && list.length < MAX_GALLERY && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-xl border-2 border-dashed border-white/10 text-chalk-dim hover:text-chalk hover:border-white/30 transition-colors flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span className="text-xs">Add image</span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
    </div>
  );
}
