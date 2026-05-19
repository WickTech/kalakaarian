import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { UploadProgressUploader } from '@/components/upload';

const MAX_GALLERY = 12;
const GALLERY_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const GALLERY_MAX_BYTES = 10 * 1024 * 1024;

interface Props {
  images: string[];
  isOwnProfile: boolean;
  onChange?: (images: string[]) => void;
}

export function ProfileGallery({ images, isOwnProfile, onChange }: Props) {
  const { toast } = useToast();
  const replaceRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [replacing, setReplacing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const list = images ?? [];

  if (!isOwnProfile && list.length === 0) return null;

  const persist = async (next: string[]) => {
    const res = await api.updateGallery(next);
    onChange?.(res.galleryImages);
  };

  const scrollTo = (idx: number) => {
    const clamped = Math.max(0, Math.min(list.length - 1, idx));
    setActiveIdx(clamped);
    const track = trackRef.current;
    if (track) {
      const card = track.children[clamped] as HTMLElement;
      card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  const handleAddSuccess = async (url: string) => {
    if (list.length >= MAX_GALLERY) {
      toast({ title: 'Gallery full', description: `Max ${MAX_GALLERY} images`, variant: 'destructive' });
      return;
    }
    const next = [...list, url];
    try {
      await persist(next);
      setActiveIdx(next.length - 1);
    } catch {
      toast({ title: 'Failed to save image', variant: 'destructive' });
    }
  };

  const handleReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setReplacing(true);
    try {
      const { uploadUrl, fileUrl } = await api.getUploadUrl(file.name, file.type, 'gallery');
      const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error('upload failed');
      const next = list.map((u, i) => (i === activeIdx ? fileUrl : u));
      await persist(next);
      toast({ title: 'Image replaced' });
    } catch {
      toast({ title: 'Replace failed', variant: 'destructive' });
    } finally {
      setReplacing(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const next = list.filter((_, i) => i !== activeIdx);
      await persist(next);
      setActiveIdx(Math.min(activeIdx, next.length - 1));
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    } finally {
      setRemoving(false);
    }
  };

  const canAddMore = list.length < MAX_GALLERY;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-chalk">Kalakaar Portfolio</h2>
        <span className="text-xs text-chalk-faint">{list.length}/{MAX_GALLERY}</span>
      </div>

      {list.length > 0 && (
        <div className="space-y-2">
          <div className="relative group">
            <div
              ref={trackRef}
              className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {list.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="snap-start shrink-0 relative rounded-xl overflow-hidden bg-white/5 cursor-pointer"
                  style={{
                    width: '17rem',
                    height: '14rem',
                    outline: i === activeIdx ? '2px solid rgba(168,85,247,0.6)' : 'none',
                  }}
                  onClick={() => scrollTo(i)}
                >
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-[10px] text-white/70">
                    {i + 1} / {list.length}
                  </div>
                </div>
              ))}
            </div>

            {list.length > 1 && (
              <>
                <button
                  onClick={() => scrollTo(activeIdx - 1)}
                  disabled={activeIdx === 0}
                  className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo(activeIdx + 1)}
                  disabled={activeIdx === list.length - 1}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {list.length > 1 && (
            <div className="flex justify-center gap-2 py-1">
              {list.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                    i === activeIdx
                      ? 'border-purple-400 bg-purple-400 scale-110'
                      : 'border-white/30 bg-transparent hover:border-white/60'
                  }`}
                />
              ))}
            </div>
          )}

          {isOwnProfile && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-chalk-faint flex-1">
                Image {activeIdx + 1} selected
              </span>
              <button
                onClick={() => replaceRef.current?.click()}
                disabled={replacing || removing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs text-chalk-dim hover:text-chalk hover:border-white/30 transition-all disabled:opacity-50"
              >
                {replacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Replace
              </button>
              <button
                onClick={handleRemove}
                disabled={replacing || removing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {isOwnProfile && canAddMore && (
        <UploadProgressUploader
          purpose="gallery"
          accept={GALLERY_ACCEPT}
          maxBytes={GALLERY_MAX_BYTES}
          multiple
          compressImages
          onItemSuccess={handleAddSuccess}
          label={list.length === 0 ? 'Drop images or tap to add to your portfolio' : 'Add more images'}
          hint={`JPG · PNG · WEBP · up to ${MAX_GALLERY - list.length} more`}
        />
      )}

      <input
        ref={replaceRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleReplace}
      />
    </div>
  );
}
