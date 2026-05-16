import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle2, Clock, Receipt } from "lucide-react";
import { api, Proposal } from "@/lib/api";

const RUNNING_STAGES = ["accepted", "shooting", "uploaded", "under_review", "revision_requested"];
const DONE_STAGES = ["approved", "payment_processing", "paid", "completed"];

const STATUS_COLORS: Record<string, string> = {
  accepted: "text-green-400 border-green-400/30 bg-green-400/10",
  shooting: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  uploaded: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  under_review: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  revision_requested: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  approved: "text-green-400 border-green-400/30 bg-green-400/10",
  payment_processing: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  paid: "text-gold border-gold/30 bg-gold/10",
  completed: "text-chalk-dim border-white/10 bg-white/5",
  submitted: "text-chalk-dim border-white/10 bg-white/5",
  rejected: "text-red-400 border-red-400/30 bg-red-400/10",
};

function ProposalRow({ proposal, navigate }: { proposal: Proposal; navigate: ReturnType<typeof useNavigate> }) {
  const stage = proposal.workflow_stage ?? proposal.status;
  const stageLabel = (stage ?? "").replace(/_/g, " ");
  const colorClass = STATUS_COLORS[stage ?? ""] ?? "text-chalk-dim border-white/10 bg-white/5";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors cursor-pointer rounded-lg"
      onClick={() => navigate(`/proposals/${proposal._id}`)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-chalk font-medium truncate">{proposal.campaignTitle}</p>
        <p className="text-xs text-chalk-dim mt-0.5">₹{Number(proposal.bidAmount).toLocaleString("en-IN")}</p>
      </div>
      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize shrink-0 ${colorClass}`}>
        {stageLabel || "submitted"}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); /* invoice placeholder */ }}
        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors shrink-0"
        title="Invoice (coming soon)"
      >
        <Receipt className="w-3.5 h-3.5 text-chalk-dim" />
      </button>
    </div>
  );
}

export function CreatorCampaignsSection() {
  const navigate = useNavigate();
  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ["my-proposals"],
    queryFn: () => api.getProposals(),
    staleTime: 30_000,
  });

  const running = proposals.filter((p) => {
    const stage = p.workflow_stage ?? p.status;
    return RUNNING_STAGES.includes(stage ?? "");
  });
  const previous = proposals.filter((p) => {
    const stage = p.workflow_stage ?? p.status;
    return DONE_STAGES.includes(stage ?? "") || p.status === "rejected";
  });

  if (isLoading) return null;
  if (proposals.length === 0) return null;

  return (
    <div className="space-y-4">
      {running.length > 0 && (
        <div className="bento-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-display font-bold text-chalk">Running Campaigns</h3>
            <span className="ml-auto text-xs text-chalk-faint">{running.length}</span>
          </div>
          <div className="divide-y divide-white/5">
            {running.map((p) => <ProposalRow key={p._id} proposal={p} navigate={navigate} />)}
          </div>
        </div>
      )}

      {previous.length > 0 && (
        <div className="bento-card overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-chalk-dim" />
            <h3 className="text-sm font-display font-bold text-chalk">Previous Campaigns</h3>
            <span className="ml-auto text-xs text-chalk-faint">{previous.length}</span>
          </div>
          <div className="divide-y divide-white/5">
            {previous.map((p) => <ProposalRow key={p._id} proposal={p} navigate={navigate} />)}
          </div>
        </div>
      )}

      {running.length === 0 && previous.length === 0 && proposals.length > 0 && (
        <div className="bento-card p-5 text-center">
          <FileText className="w-8 h-8 text-chalk-faint mx-auto mb-2" />
          <p className="text-sm text-chalk-dim">No active campaigns yet</p>
          <button onClick={() => navigate("/campaigns")} className="mt-3 text-xs text-purple-400 hover:underline">
            Browse campaigns →
          </button>
        </div>
      )}
    </div>
  );
}
