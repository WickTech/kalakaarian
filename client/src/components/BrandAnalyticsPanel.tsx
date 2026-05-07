import { useQuery } from "@tanstack/react-query";
import { BarChart2, CheckCircle2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

const STAGE_LABELS: Record<string, string> = {
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  content_in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  payment_pending: "Pmt Pending",
  payment_released: "Paid",
  rejected_workflow: "Rejected",
};

export function BrandAnalyticsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["brand-deep-analytics"],
    queryFn: () => api.getBrandDeepAnalytics(),
    staleTime: 60_000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );

  if (!data) return null;

  const total = data.stageBreakdown.reduce((s, x) => s + x.count, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Avg Bid", value: `₹${(data.avgBid || 0).toLocaleString("en-IN")}`, icon: <BarChart2 className="w-4 h-4 text-purple-400" /> },
          { label: "Completed", value: data.completedCount, icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
          { label: "Active", value: total, icon: <TrendingUp className="w-4 h-4 text-gold" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bento-card p-4">
            <div className="mb-2">{icon}</div>
            <p className="result-numeral text-xl">{value}</p>
            <p className="text-xs text-chalk-dim mt-1">{label}</p>
          </div>
        ))}
      </div>

      {data.stageBreakdown.length > 0 && (
        <div className="bento-card p-5">
          <h3 className="text-sm font-bold text-chalk mb-4">Proposal Funnel</h3>
          <div className="space-y-2.5">
            {[...data.stageBreakdown].sort((a, b) => b.count - a.count).map(({ stage, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-xs text-chalk-dim w-28 flex-shrink-0">{STAGE_LABELS[stage] || stage}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500/70"
                    style={{ width: `${Math.max(4, Math.round(count / Math.max(total, 1) * 100))}%` }} />
                </div>
                <span className="text-xs text-chalk-dim w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topCampaigns.length > 0 && (
        <div className="bento-card overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-chalk">Top Campaigns</h3>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5">
              {["Campaign", "Proposals", "Active"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-chalk-faint font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.topCampaigns.map(c => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-2.5 text-chalk truncate max-w-[180px]">{c.title}</td>
                  <td className="px-4 py-2.5 text-chalk-dim">{c.proposalCount}</td>
                  <td className="px-4 py-2.5 text-purple-400">{c.workflowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
