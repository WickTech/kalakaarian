import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox, CheckCircle2, Clock } from "lucide-react";
import { api, Proposal } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CampaignProgressTracker } from "@/components/CampaignProgressTracker";

type TabKey = "running" | "completed";

const RUNNING_STAGES = [
  "shortlisted",
  "accepted",
  "content_in_progress",
  "submitted",
  "under_review",
  "approved",
  "payment_pending",
];
const COMPLETED_STAGES = ["payment_released"];
const UPLOAD_STAGES = ["accepted", "content_in_progress", "submitted", "under_review"];

type Platform = "instagram" | "youtube";

function CampaignCard({ proposal, onRefresh }: { proposal: Proposal; onRefresh: () => void }) {
  const { toast } = useToast();
  const stage = proposal.workflow_stage ?? proposal.status ?? "";
  const canUpload = UPLOAD_STAGES.includes(stage);

  const [link, setLink] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async () => {
    if (!link.trim() || !confirmed) {
      toast({ title: "Add a link and confirm the content", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await api.uploadVideo(link.trim(), platform, proposal.campaignId);
      toast({ title: "Submitted", description: "Content sent for brand review." });
      setLink(""); setConfirmed(false);
      onRefresh();
    } catch {
      toast({ title: "Upload failed", description: "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bento-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-chalk truncate">{proposal.campaignTitle || "Campaign"}</h3>
          <p className="text-xs text-chalk-dim mt-0.5">
            ₹{Number(proposal.bidAmount || 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <CampaignProgressTracker currentStage={stage} updatedAt={proposal.workflow_stage_updated_at} compact />

      {canUpload && (
        <div className="border-t border-white/5 pt-4 space-y-3">
          <p className="text-xs font-semibold text-chalk-dim uppercase tracking-wide">Upload Content</p>
          <div className="flex gap-2">
            {(["instagram", "youtube"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  platform === p
                    ? "border-gold text-gold bg-gold/10"
                    : "border-white/10 text-chalk-dim"
                }`}
              >
                {p === "instagram" ? "📸 Instagram" : "▶️ YouTube"}
              </button>
            ))}
          </div>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Drive / post URL"
            className="dark-input w-full px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 cursor-pointer text-xs text-chalk-dim">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-600"
            />
            I confirm this content is ready for brand review
          </label>
          <button
            onClick={handleUpload}
            disabled={submitting || !link.trim() || !confirmed}
            className="purple-pill w-full py-2.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting…" : "Submit for Review"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CreatorCampaigns() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("running");

  const { data: campaigns = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["my-proposals"],
    queryFn: () => api.getProposals().catch(() => []),
  });

  const { running, completed } = useMemo(() => {
    const running: Proposal[] = [];
    const completed: Proposal[] = [];
    for (const c of campaigns) {
      const stage = c.workflow_stage ?? "";
      if (COMPLETED_STAGES.includes(stage)) completed.push(c);
      else if (RUNNING_STAGES.includes(stage)) running.push(c);
    }
    return { running, completed };
  }, [campaigns]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["my-proposals"] });
  const visible = tab === "running" ? running : completed;
  const empty = visible.length === 0;

  return (
    <main className="min-h-screen bg-obsidian px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-chalk">My Campaigns</h1>
          <p className="text-sm text-chalk-dim mt-1">
            Campaigns brands have selected you for. Upload content per campaign here.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("running")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              tab === "running"
                ? "bg-purple-600 text-white"
                : "border border-white/10 text-chalk-dim hover:text-chalk"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Running
            <span className="text-[10px] opacity-80">{running.length}</span>
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              tab === "completed"
                ? "bg-purple-600 text-white"
                : "border border-white/10 text-chalk-dim hover:text-chalk"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
            <span className="text-[10px] opacity-80">{completed.length}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : empty ? (
          <div className="bento-card p-10 text-center">
            <Inbox className="w-10 h-10 text-chalk-faint mx-auto mb-3" />
            <p className="text-sm text-chalk-dim">
              {tab === "running" ? "No running campaigns." : "No completed campaigns yet."}
            </p>
            <p className="text-xs text-chalk-faint mt-1">
              Brands will select you directly from the marketplace.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visible.map((p) => (
              <CampaignCard key={p._id} proposal={p} onRefresh={refresh} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
