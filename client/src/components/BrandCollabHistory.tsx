import { Briefcase } from "lucide-react";
import { Proposal } from "@/lib/api";

export function BrandCollabHistory({ proposals }: { proposals: Proposal[] }) {
  const collabs = proposals.filter(
    (p) => p.status === "accepted"
      || p.workflow_stage === "payment_released"
      || p.workflow_stage === "approved",
  );
  if (collabs.length === 0) return null;

  const seen = new Set<string>();
  const unique = collabs.filter((p) => {
    const key = p.campaignId || p._id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="bento-card overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-chalk-dim shrink-0" />
        <h2 className="font-display font-bold text-chalk text-sm">Brand Collab History</h2>
        <span className="ml-auto text-xs text-chalk-faint">
          {unique.length} collab{unique.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-white/5">
        {unique.map((p) => (
          <div
            key={p._id}
            className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-purple-300">
                {(p.campaignTitle || "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-chalk truncate">
                {p.campaignTitle || "Campaign"}
              </p>
              <p className="text-xs text-chalk-dim mt-0.5">
                {new Date(p.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-green-400">
                ₹{p.agreedPrice.toLocaleString("en-IN")}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                {p.workflow_stage === "payment_released" ? "Paid" : "Accepted"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
