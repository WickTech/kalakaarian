import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { api, Campaign, Proposal } from "@/lib/api";
import { CampaignProgressTracker } from "@/components/CampaignProgressTracker";
import { keys } from '@/lib/queryKeys';

const STAGE_COLOR: Record<string, string> = {
  shortlisted: "text-amber-400 border-amber-400/30",
  accepted: "text-blue-400 border-blue-400/30",
  content_in_progress: "text-purple-400 border-purple-400/30",
  submitted: "text-cyan-400 border-cyan-400/30",
  under_review: "text-orange-400 border-orange-400/30",
  approved: "text-emerald-400 border-emerald-400/30",
  payment_pending: "text-yellow-400 border-yellow-400/30",
  payment_released: "text-teal-400 border-teal-400/30",
  rejected_workflow: "text-red-400 border-red-400/30",
};

const STAGE_SHORT: Record<string, string> = {
  shortlisted: "Notified", accepted: "Scripts OK",
  content_in_progress: "Creating", submitted: "Submitted",
  under_review: "In Review", approved: "Delivered",
  payment_pending: "Pending", payment_released: "Paid",
  rejected_workflow: "Rejected",
};

function CampaignTrackCard({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: keys.campaignCreators.byCampaign(campaign.id),
    queryFn: () => api.getCampaignCreatorsForCampaign(campaign.id),
    enabled: open,
    staleTime: 60_000,
    refetchInterval: open ? 30_000 : false,
  });

  const active = proposals.filter((p) => p.workflow_stage && p.workflow_stage !== "rejected_workflow");
  const paid   = proposals.filter((p) => p.workflow_stage === "payment_released").length;

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-chalk truncate">{campaign.title}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
              campaign.status === "open" ? "text-green-400 border-green-400/30" : "text-chalk-dim border-white/15"
            }`}>{campaign.status}</span>
          </div>
          <p className="text-xs text-chalk-dim mt-0.5">
            {active.length} creator{active.length !== 1 ? "s" : ""} active · {paid} paid
            {campaign.deadline && ` · Due ${new Date(campaign.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/brand/campaigns/${campaign.id}/track`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-white/8 transition-colors text-chalk-dim hover:text-purple-400"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          {open ? <ChevronUp className="w-4 h-4 text-chalk-dim" /> : <ChevronDown className="w-4 h-4 text-chalk-dim" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/6 px-4 pt-3 pb-4 space-y-3">
          {active.length === 0 ? (
            <p className="text-xs text-chalk-dim text-center py-3">No creators in workflow yet.</p>
          ) : (
            <>
              {/* Aggregate progress: show tracker for the "leading" creator */}
              <div className="mb-1">
                <CampaignProgressTracker
                  currentStage={active.reduce((best, p) => {
                    const STAGE_IDX: Record<string, number> = {
                      shortlisted: 1, accepted: 2, content_in_progress: 3, submitted: 3,
                      under_review: 4, approved: 5, payment_pending: 5, payment_released: 6,
                    };
                    return (STAGE_IDX[p.workflow_stage ?? ''] ?? 0) > (STAGE_IDX[best] ?? 0)
                      ? p.workflow_stage! : best;
                  }, active[0]?.workflow_stage ?? null)}
                  compact
                />
              </div>
              <p className="text-[10px] text-chalk-dim uppercase tracking-wide">Creators</p>
              <div className="space-y-1.5">
                {active.map((p) => (
                  <div key={p._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02]">
                    <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 text-[10px] font-bold text-purple-300">
                      {(p.influencerName || "?")[0].toUpperCase()}
                    </div>
                    <p className="text-xs font-medium text-chalk flex-1 truncate min-w-0">{p.influencerName}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 font-medium ${
                      STAGE_COLOR[p.workflow_stage ?? ""] ?? "text-chalk-dim border-white/15"
                    }`}>
                      {STAGE_SHORT[p.workflow_stage ?? ""] ?? "—"}
                    </span>
                    <span className="text-xs text-chalk-dim shrink-0">₹{p.agreedPrice?.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function RunningCampaignTracker({ campaigns }: { campaigns: Campaign[] }) {
  const active = campaigns.filter((c) => c.status !== "archived");
  if (active.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-chalk">Running Campaigns</h2>
        <span className="text-xs text-chalk-dim">{active.length} active</span>
      </div>
      {active.map((c) => <CampaignTrackCard key={c.id} campaign={c} />)}
    </div>
  );
}
