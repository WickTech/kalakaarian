import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Inbox, CheckCircle2, Clock, Upload, FileText } from "lucide-react";
import { api, Proposal } from "@/lib/api";
import { CampaignProgressTracker } from "@/components/CampaignProgressTracker";
import { CampaignVideoUploadModal } from "@/components/profile/CampaignVideoUploadModal";
import { keys } from '@/lib/queryKeys';

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

function CampaignCard({ proposal, onRefresh }: { proposal: Proposal; onRefresh: () => void }) {
  const stage = proposal.workflow_stage ?? proposal.status ?? "";
  const canUpload = UPLOAD_STAGES.includes(stage);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Brief files the brand uploaded for this campaign. The server only allows
  // creators with an 'accepted' campaign_creators row to read them.
  const { data: briefFiles = [] } = useQuery({
    queryKey: ["campaign-files", proposal.campaignId],
    queryFn: () => api.getCampaignFiles(proposal.campaignId).catch(() => []),
    enabled: !!proposal.campaignId,
  });

  const hasBrief = !!proposal.campaignDescription || briefFiles.length > 0;

  return (
    <div className="bento-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-chalk truncate">{proposal.campaignTitle || "Campaign"}</h3>
          <p className="text-xs text-chalk-dim mt-0.5">
            ₹{Number(proposal.agreedPrice || 0).toLocaleString("en-IN")}
          </p>
        </div>
        {canUpload && (
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full purple-pill text-xs font-bold shrink-0"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Video
          </button>
        )}
      </div>

      {hasBrief && (
        <div className="rounded-lg border border-white/8 bg-white/[0.02] p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-chalk-faint flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Campaign Brief
          </p>
          {proposal.campaignDescription && (
            <p className="text-xs text-chalk-dim whitespace-pre-wrap">{proposal.campaignDescription}</p>
          )}
          {briefFiles.length > 0 && (
            <div className="space-y-1">
              {briefFiles.map((f) => (
                <a
                  key={f._id}
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200"
                >
                  <FileText className="w-3 h-3 shrink-0" />
                  <span className="truncate">{f.fileName}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <CampaignProgressTracker currentStage={stage} updatedAt={proposal.workflow_stage_updated_at} compact />

      <CampaignVideoUploadModal
        open={uploadOpen}
        campaignId={proposal.campaignId}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => { setUploadOpen(false); onRefresh(); }}
      />
    </div>
  );
}

export default function CreatorCampaigns() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "running";
  const [tab, setTab] = useState<TabKey>(initialTab === "completed" ? "completed" : "running");

  const { data: campaigns = [], isLoading } = useQuery<Proposal[]>({
    queryKey: keys.campaignCreators.my(),
    queryFn: () => api.getMyCampaignCreators().catch(() => []),
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

  const refresh = () => qc.invalidateQueries({ queryKey: keys.campaignCreators.my() });
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
