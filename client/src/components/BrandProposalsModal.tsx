import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Proposal } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props {
  campaignId: string;
  proposals: Proposal[];
  onClose: () => void;
}

export function BrandProposalsModal({ campaignId, proposals, onClose }: Props) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const respond = useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: string; status: "accepted" | "rejected" }) =>
      api.respondToProposal(proposalId, status),
    onSuccess: (_, { status }) => {
      toast({ title: "Success", description: `Proposal ${status}` });
      qc.invalidateQueries({ queryKey: ["campaign-proposals", campaignId] });
    },
  });

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-box bento-card w-full max-w-lg p-6 mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-chalk">Proposals</h3>
          <button onClick={onClose} className="text-chalk-dim hover:text-chalk text-xl">✕</button>
        </div>
        {proposals.length === 0 ? (
          <p className="text-chalk-dim text-sm">No proposals yet for this campaign.</p>
        ) : proposals.map((p) => (
          <div key={p._id} className="bento-card-dark p-4 rounded-lg mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-chalk">{p.influencerName || "Creator"}</p>
                <p className="text-xs text-chalk-dim mt-1">{p.message}</p>
                <p className="text-sm font-bold text-gold mt-2">₹{p.bidAmount.toLocaleString("en-IN")}</p>
                {import.meta.env.VITE_WORKFLOW_V2_ENABLED === 'true' && p.workflow_stage && (
                  <Link to={`/proposals/${p._id}`} className="text-xs text-purple-400 hover:text-purple-300 mt-1 inline-block">
                    View workflow →
                  </Link>
                )}
              </div>
              {p.status === "submitted" ? (
                <div className="flex gap-2 ml-4">
                  <button onClick={() => respond.mutate({ proposalId: p._id, status: "accepted" })}
                    className="p-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => respond.mutate({ proposalId: p._id, status: "rejected" })}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${p.status === "accepted" ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}>
                  {p.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
