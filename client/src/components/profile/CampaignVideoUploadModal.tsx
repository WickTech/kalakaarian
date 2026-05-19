import { useEffect, useState } from "react";
import { Instagram, Youtube, Upload as UploadIcon, Link2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { UploadQueue } from "@/components/upload/UploadQueue";
import { useUploader } from "@/hooks/useUploader";
import { useOnlineResume } from "@/hooks/useOnlineResume";

type Platform = "instagram" | "youtube";

const VIDEO_ACCEPT = ["video/mp4", "video/quicktime", "video/webm"];
const VIDEO_MAX_BYTES = 500 * 1024 * 1024;

interface Props {
  open: boolean;
  campaignId: string;
  onClose: () => void;
  onUploaded?: () => void;
}

export function CampaignVideoUploadModal({ open, campaignId, onClose, onUploaded }: Props) {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [driveLink, setDriveLink] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { items, enqueue, cancel, retry, remove, clear } = useUploader({
    purpose: "video",
    accept: VIDEO_ACCEPT,
    maxBytes: VIDEO_MAX_BYTES,
    multiple: true,
    generateVideoThumbnail: true,
  });
  useOnlineResume(retry);

  useEffect(() => {
    if (!open) {
      clear();
      setPlatform("instagram");
      setDriveLink("");
      setConfirmed(false);
    }
  }, [open, clear]);

  const successItems = items.filter((i) => i.status === "success" && i.finalUrl);
  const anyInFlight = items.some(
    (i) => i.status === "uploading" || i.status === "compressing" || i.status === "queued",
  );
  const submittableCount = successItems.length + (driveLink.trim() ? 1 : 0);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (submittableCount === 0) {
      toast({ title: "Add at least one file or a drive link", variant: "destructive" });
      return;
    }
    if (anyInFlight) {
      toast({ title: "Wait for uploads to finish", variant: "destructive" });
      return;
    }
    if (!confirmed) {
      toast({ title: "Confirm content is ready for review", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      for (const it of successItems) {
        if (it.finalUrl) await api.uploadVideo(it.finalUrl, platform, campaignId);
      }
      if (driveLink.trim()) await api.uploadVideo(driveLink.trim(), platform, campaignId);
      toast({ title: "Uploaded", description: "Content sent for brand review." });
      clear();
      onUploaded?.();
    } catch {
      toast({ title: "Submit failed", description: "Try again", variant: "destructive" });
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

          <div className="space-y-3">
            <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide">Upload Files</p>
            <UploadDropzone
              accept={VIDEO_ACCEPT}
              multiple
              onFiles={enqueue}
              label="Drop videos or tap to choose"
              hint="MP4 · MOV · WebM · up to 500 MB each"
            />
            <UploadQueue items={items} onCancel={cancel} onRetry={retry} onRemove={remove} />
          </div>

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
            disabled={submitting || anyInFlight || !confirmed || submittableCount === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 py-6 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Submitting…"
              : anyInFlight
                ? "Uploading…"
                : `Submit ${submittableCount} item${submittableCount === 1 ? "" : "s"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
