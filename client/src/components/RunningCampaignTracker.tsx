import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";
import { api, Campaign, Proposal } from "@/lib/api";

const STAGES = [
  { key: "shortlisted",         short: "Shortlisted" },
  { key: "accepted",            short: "Accepted" },
  { key: "content_in_progress", short: "In Progress" },
  { key: "submitted",           short: "Submitted" },
  { key: "under_review",        short: "Review" },
  { key: "approved",            short: "Approved" },
  { key: "payment_released",    short: "Paid" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

const STAGE_COLOR: Record<string, string> = {
  shortlisted: "bg-amber-400",
  accepted: "bg-blue-400",
  content_in_progress: "bg-purple-400",
  submitted: "bg-cyan-400",
  under_review: "bg-orange-400",
  approved: "bg-green-400",
  payment_pending: "bg-yellow-400",
  payment_released: "bg-emerald-400",
};

const STAGE_TEXT: Record<string, string> = {
  shortlisted: "text-amber-400",
  accepted: "text-blue-400",
  content_in_progress: "text-purple-400",
  submitted: "text-cyan-400",
  under_review: "text-orange-400",
  approved: "text-green-400",
  payment_pending: "text-yellow-400",
  payment_released: "text-emerald-400",
  rejected_workflow: "text-red-400",
};

function stageIdx(stage: string): number {
  return STAGES.findIndex((s) => s.key === stage);
}

function CampaignTrackCard({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);

  const { data: proposals = [] } = useQuery<Proposal[]>({
    queryKey: ["campaign-proposals-track", campaign.id],
    queryFn: () => api.getProposalsForCampaign(campaign.id),
    enabled: open,
    staleTime: 60_000,
  });

  const active = proposals.filter((p) => p.workflow_stage && p.workflow_stage !== "rejected_workflow");
  const stageCounts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s.key] = active.filter((p) => p.workflow_stage === s.key).length;
    return acc;
  }, {});
  const maxIdx = active.reduce((m, p) => Math.max(m, stageIdx(p.workflow_stage ?? "")), -1);

  return (
    <div className="bento-card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-chalk truncate">{campaign.title}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              campaign.status === "open"
                ? "text-green-400 border-green-400/30"
                : "text-chalk-dim border-white/20"
            }`}>
              {campaign.status}
            </span>
          </div>
          <p className="text-xs text-chalk-faint mt-0.5">
            {open ? `${active.length} creator${active.length !== 1 ? "s" : ""} tracked` : "Click to view progress"}
            {campaign.deadline
              ? ` · Due ${new Date(campaign.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/brand/campaigns/${campaign.id}/track`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gold hover:underline flex items-center gap-1"
          >
            <BarChart2 className="w-3 h-3" /> Track
          </Link>
          {open
            ? <ChevronUp className="w-4 h-4 text-chalk-dim" />
            : <ChevronDown className="w-4 h-4 text-chalk-dim" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Amazon-style stage stepper */}
          <div className="overflow-x-auto pb-1">
            <div className="flex items-start gap-0 min-w-max">
              {STAGES.map((s, i) => {
                const count  = stageCounts[s.key as StageKey] || 0;
                const reached  = i <= maxIdx;
                const current  = active.some((p) => p.workflow_stage === s.key);
                return (
                  <div key={s.key} className="flex items-center">
                    <div className="flex flex-col items-center gap-1 px-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        current
                          ? `${STAGE_COLOR[s.key]} text-obsidian shadow-lg ring-2 ring-white/20 ring-offset-1 ring-offset-obsidian`
                          : reached
                          ? `${STAGE_COLOR[s.key]}/30 text-chalk`
                          : "bg-white/5 text-chalk-faint"
                      }`}>
                        {count > 0 ? count : i + 1}
                      </div>
                      <p className="text-[9px] text-chalk-faint text-center leading-tight w-[52px]">
                        {s.short}
                      </p>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`h-0.5 w-5 mb-5 transition-all ${reached ? "bg-purple-400/50" : "bg-white/8"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Creator list */}
          {active.length === 0 ? (
            <p className="text-xs text-chalk-faint text-center py-2">No creators in workflow yet.</p>
          ) : (
            <div className="space-y-1.5">
              {active.map((p) => (
                <div key={p._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03]">
                  <div className="w-7 h-7 rounded-full bg-purple-600/25 flex items-center justify-center shrink-0 text-xs font-bold text-purple-300">
                    {(p.influencerName || "?")[0].toUpperCase()}
                  </div>
                  <p className="text-xs font-medium text-chalk flex-1 truncate min-w-0">
                    {p.influencerName}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                    STAGE_TEXT[p.workflow_stage ?? ""] ?? "text-chalk-dim border-white/15"
                  } border-current/30`}>
                    {STAGES.find((s) => s.key === p.workflow_stage)?.short ?? p.workflow_stage ?? "—"}
                  </span>
                  <span className="text-xs text-chalk-dim shrink-0">
                    ₹{p.bidAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
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
        <span className="text-xs text-chalk-faint">{active.length} active</span>
      </div>
      {active.map((c) => (
        <CampaignTrackCard key={c.id} campaign={c} />
      ))}
    </div>
  );
}
