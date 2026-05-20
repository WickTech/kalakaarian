import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart2, CheckCircle2, TrendingUp, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { keys } from '@/lib/queryKeys';

const STAGE_LABELS: Record<string, string> = {
  shortlisted: "Shortlisted",   accepted: "Accepted",
  content_in_progress: "In Progress", submitted: "Submitted",
  under_review: "Under Review", approved: "Approved",
  payment_pending: "Pmt Pending", payment_released: "Paid",
  rejected_workflow: "Rejected",
};

const STAGE_COLOR: Record<string, string> = {
  shortlisted: "#f59e0b",   accepted: "#60a5fa",
  content_in_progress: "#a78bfa", submitted: "#22d3ee",
  under_review: "#fb923c", approved: "#4ade80",
  payment_pending: "#facc15", payment_released: "#34d399",
  rejected_workflow: "#f87171",
};

const ttStyle = {
  background: "#14141e",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  fontSize: 11,
};

export function BrandAnalyticsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: keys.brand.deepAnalytics(),
    queryFn: () => api.getBrandDeepAnalytics(),
    staleTime: 60_000,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bento-card p-4 h-24 animate-pulse" />
      ))}
    </div>
  );

  if (!data) return (
    <div className="bento-card p-8 text-center text-chalk-dim text-sm">
      No analytics data yet. Launch a campaign to see insights.
    </div>
  );

  const total = data.stageBreakdown.reduce((s, x) => s + x.count, 0);
  const acceptedCount = data.stageBreakdown.find((s) => s.stage === "accepted")?.count ?? 0;
  const acceptRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

  const funnelData = data.stageBreakdown
    .filter((s) => s.stage !== "rejected_workflow")
    .map(({ stage, count }) => ({
      name: STAGE_LABELS[stage] || stage,
      count,
      color: STAGE_COLOR[stage] || "#7c3aed",
    }))
    .sort((a, b) => b.count - a.count);

  const kpis = [
    {
      label: "Avg Creator Bid",
      value: `₹${(data.avgBid || 0).toLocaleString("en-IN")}`,
      icon: <DollarSign className="w-4 h-4 text-purple-400" />,
      sub: "per collaboration",
    },
    {
      label: "Paid Out",
      value: data.completedCount,
      icon: <CheckCircle2 className="w-4 h-4 text-green-400" />,
      sub: "campaigns completed",
    },
    {
      label: "Active Creators",
      value: total,
      icon: <TrendingUp className="w-4 h-4 text-gold" />,
      sub: "in workflow",
    },
    {
      label: "Accept Rate",
      value: `${acceptRate}%`,
      icon: <BarChart2 className="w-4 h-4 text-blue-400" />,
      sub: "creators accepted",
    },
  ];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon, sub }) => (
          <div key={label} className="bento-card p-4">
            <div className="flex items-center justify-between mb-3">{icon}</div>
            <p className="result-numeral text-2xl font-bold text-chalk">{value}</p>
            <p className="text-xs text-chalk-dim mt-0.5">{label}</p>
            <p className="text-[10px] text-chalk-faint mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Pipeline bar chart */}
      {funnelData.length > 0 && (
        <div className="bento-card p-5">
          <h3 className="text-sm font-bold text-chalk mb-4">Creator Pipeline</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={funnelData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [v, "Creators"]}
                contentStyle={ttStyle}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top campaigns */}
      {data.topCampaigns.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-chalk mb-3">Top Campaigns</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.topCampaigns.slice(0, 4).map((c) => (
              <div key={c.id} className="bento-card p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-purple-300">
                    {(c.title[0] ?? "?").toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-chalk truncate">{c.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-chalk-faint">{c.creatorCount} creators</span>
                    {c.workflowCount > 0 && (
                      <span className="text-[10px] text-purple-400">{c.workflowCount} active</span>
                    )}
                  </div>
                  {c.creatorCount > 0 && (
                    <div className="h-1 rounded-full bg-white/5 mt-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500/60 transition-all"
                        style={{ width: `${Math.round((c.workflowCount / c.creatorCount) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <Link
                  to={`/brand/campaigns/${c.id}/track`}
                  className="text-[10px] text-gold hover:underline shrink-0 mt-0.5"
                >
                  Track →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
