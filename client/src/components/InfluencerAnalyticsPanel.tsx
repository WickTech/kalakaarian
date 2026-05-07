import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, ShieldCheck } from "lucide-react";
import { api, Proposal } from "@/lib/api";
import { RecommendedCampaigns } from "./RecommendedCampaigns";

const STATUS_STYLE: Record<string, string> = {
  submitted: "text-gold border-gold/30",
  accepted: "text-green-400 border-green-400/30",
  rejected: "text-red-400 border-red-400/30",
};

interface Props {
  proposals: Proposal[];
  stats: { total: number; accepted: number; earnings: number };
}

export function InfluencerAnalyticsPanel({ proposals, stats }: Props) {
  const { data: deep } = useQuery({
    queryKey: ["influencer-deep-analytics"],
    queryFn: () => api.getInfluencerDeepAnalytics(),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Proposals", value: stats.total },
          { label: "Accepted", value: stats.accepted },
          { label: "Acceptance %", value: stats.total ? `${Math.round((stats.accepted / stats.total) * 100)}%` : "—" },
          { label: "Total Earned", value: `₹${stats.earnings.toLocaleString("en-IN")}` },
        ].map(({ label, value }) => (
          <div key={label} className="bento-card p-4 text-center">
            <p className="result-numeral text-xl">{value}</p>
            <p className="text-xs text-chalk-dim mt-1">{label}</p>
          </div>
        ))}
      </div>

      {deep && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bento-card p-4">
            <p className="text-xs text-chalk-dim mb-1">Completion Rate</p>
            <p className="font-bold text-xl text-chalk">{deep.completionRate}%</p>
            <div className="h-1.5 rounded-full bg-white/5 mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-green-500/60" style={{ width: `${deep.completionRate}%` }} />
            </div>
          </div>
          {deep.avgRating && (
            <div className="bento-card p-4 flex items-center gap-3">
              {deep.ratingCount >= 3 && deep.avgRating >= 4.0
                ? <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                : <Star className="w-5 h-5 text-gold flex-shrink-0" />}
              <div>
                <p className="font-bold text-xl text-chalk">{Number(deep.avgRating).toFixed(1)}</p>
                <p className="text-xs text-chalk-dim">{deep.ratingCount} rating{deep.ratingCount !== 1 ? "s" : ""}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <RecommendedCampaigns />

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-white/5"><h2 className="font-display font-bold text-chalk text-sm">Collaborations</h2></div>
        {proposals.length === 0 ? (
          <div className="p-8 text-center text-chalk-dim text-sm">
            No proposals yet. <Link to="/campaigns" className="text-gold hover:underline">Browse campaigns →</Link>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead><tr className="border-b border-white/5">
              {["Campaign", "Bid Amount", "Date", "Status"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-chalk-faint font-medium">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {proposals.slice(0, 10).map(p => (
                <tr key={p._id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-2.5 text-chalk">
                    {import.meta.env.VITE_WORKFLOW_V2_ENABLED === 'true' && p.workflow_stage
                      ? <Link to={`/proposals/${p._id}`} className="hover:text-purple-400 transition-colors">{p.campaignTitle || "—"}</Link>
                      : (p.campaignTitle || "—")}
                  </td>
                  <td className="px-4 py-2.5 text-chalk">₹{p.bidAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2.5 text-chalk-dim">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full border ${STATUS_STYLE[p.status] || "text-chalk-dim border-white/10"}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
