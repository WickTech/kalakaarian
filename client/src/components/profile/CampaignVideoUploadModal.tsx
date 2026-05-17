import { useRef, useState } from "react";
import { Instagram, Youtube, Upload as UploadIcon, X, FileVideo, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type Platform = "instagram" | "youtube";

interface Props {
  open: boolean;
  campaignId: string;
  onClose: () => void;
  onUploaded?: () => void;
}

export function CampaignVideoUploadModal({ open, campaignId, onClose, onUploaded }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [files, setFiles] = useState<File[]>([]);
  const [driveLink, setDriveLink] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFiles([]);
    setDriveLink("");
    setConfirmed(false);
    setPlatform("instagram");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (files.length === 0 && !driveLink.trim()) {
      toast({ title: "Add at least one file or a drive link", variant: "destructive" });
      return;
    }
    if (!confirmed) {
      toast({ title: "Confirm content is ready for review", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      for (const f of files) {
        const { uploadUrl, fileUrl } = await api.getUploadUrl(f.name, f.type || "video/mp4", "video");
        await fetch(uploadUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type || "video/mp4" } });
        await api.uploadVideo(fileUrl, platform, campaignId);
      }
      if (driveLink.trim()) {
        await api.uploadVideo(driveLink.trim(), platform, campaignId);
      }
      toast({ title: "Uploaded", description: "Content sent for brand review." });
      reset();
      onUploaded?.();
    } catch {
      toast({ title: "Upload failed", description: "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-xl bg-obsidian border border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-chalk font-display">
            <UploadIcon className="w-4 h-4 text-purple-400" /> Upload Campaign Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Platform toggle */}
          <div>
            <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide mb-2">Platform</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPlatform("instagram")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                  platform === "instagram"
                    ? "border-pink-500/60 bg-pink-500/10 text-pink-300"
                    : "border-white/10 bg-white/[0.03] text-chalk-dim hover:border-white/20"
                }`}
              >
                <Instagram className="w-4 h-4" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => setPlatform("youtube")}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                  platform === "youtube"
                    ? "border-red-500/60 bg-red-500/10 text-red-300"
                    : "border-white/10 bg-white/[0.03] text-chalk-dim hover:border-white/20"
                }`}
              >
                <Youtube className="w-4 h-4" /> YouTube
              </button>
            </div>
          </div>

          {/* File upload */}
          <div>
            <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide mb-2">Upload Files</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*"
              className="hidden"
              onChange={handlePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.04] transition-all"
            >
              <UploadIcon className="w-6 h-6 text-chalk-faint" />
              <p className="text-sm text-chalk-dim">Click to add video files</p>
              <p className="text-[10px] text-chalk-faint">MP4, MOV, WebM — pick multiple</p>
            </button>
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10">
                    <FileVideo className="w-4 h-4 text-chalk-faint shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-chalk truncate">{f.name}</p>
                      <p className="text-[10px] text-chalk-faint">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-chalk-faint hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Drive link */}
          <div>
            <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide mb-2">Or Drive Link</p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10">
              <Link2 className="w-4 h-4 text-chalk-faint shrink-0" />
              <input
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="flex-1 bg-transparent text-sm text-chalk placeholder:text-chalk-faint outline-none"
              />
            </div>
          </div>

          {/* Confirmation + submit */}
          <label className="flex items-start gap-2 cursor-pointer text-xs text-chalk-dim">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600 mt-0.5"
            />
            <span>I confirm this content is ready for brand review.</span>
          </label>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !confirmed || (files.length === 0 && !driveLink.trim())}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 py-6 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Uploading…" : `Submit ${files.length + (driveLink.trim() ? 1 : 0)} item(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
