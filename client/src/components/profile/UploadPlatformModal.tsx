import { useRef, useState } from 'react';
import { X, Loader2, Instagram, Youtube } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Platform = 'instagram' | 'youtube';

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}

export function UploadPlatformModal({ open, onClose, onUploaded }: Props) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [platforms, setPlatforms] = useState<Set<Platform>>(new Set());
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const toggle = (p: Platform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const reset = () => {
    setFile(null);
    setPlatforms(new Set());
  };

  const submit = async () => {
    if (!file) {
      toast({ title: 'Select a file', variant: 'destructive' }); return;
    }
    if (platforms.size === 0) {
      toast({ title: 'Select at least one platform', variant: 'destructive' }); return;
    }
    setBusy(true);
    try {
      const { uploadUrl, fileUrl } = await api.getUploadUrl(file.name, file.type, 'video');
      const put = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      if (!put.ok) throw new Error('upload failed');
      const results = await Promise.allSettled(
        Array.from(platforms).map((p) => api.uploadVideo(fileUrl, p))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === 0) {
        toast({ title: 'Uploaded', description: `Sent to ${Array.from(platforms).join(' + ')}` });
        onUploaded?.();
        reset();
        onClose();
      } else if (failed === results.length) {
        toast({ title: 'Upload failed', variant: 'destructive' });
      } else {
        toast({ title: 'Partially uploaded', description: `${failed} of ${results.length} failed`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bento-card p-5 sm:rounded-2xl rounded-t-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-chalk text-lg">Upload Content</h3>
          <button onClick={() => { reset(); onClose(); }} className="p-1.5 rounded-lg hover:bg-white/5 text-chalk-dim">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs text-chalk-dim mb-2">File *</p>
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-4 py-3 rounded-xl border border-dashed border-white/10 text-sm text-chalk-dim hover:text-chalk hover:border-white/30 transition-colors text-left truncate"
          >
            {file ? file.name : 'Choose a file…'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div>
          <p className="text-xs text-chalk-dim mb-2">Platform *</p>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => toggle('instagram')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs border transition-all ${platforms.has('instagram') ? 'border-pink-400 text-pink-300 bg-pink-500/10' : 'border-white/10 text-chalk-dim'}`}
            >
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </button>
            <button
              type="button"
              onClick={() => toggle('youtube')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs border transition-all ${platforms.has('youtube') ? 'border-red-400 text-red-300 bg-red-500/10' : 'border-white/10 text-chalk-dim'}`}
            >
              <Youtube className="w-3.5 h-3.5" /> YouTube
            </button>
          </div>
          <p className="mt-2 text-[11px] text-chalk-faint">Pick one or both. The same file is sent to each selected platform.</p>
        </div>

        <button
          onClick={submit}
          disabled={busy || !file || platforms.size === 0}
          className="purple-pill w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
