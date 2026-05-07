import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type CampaignRow = {
  id: string; title: string; status: string; createdAt: string;
  deadline: string | null; accepted: number; completed: number; totalSpend: number;
};

const COLORS = ["#a855f7", "#9333ea", "#7e22ce", "#6b21a8", "#581c87", "#4c1d95"];

export function BrandCampaignHistoryPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["brand-campaign-history"],
    queryFn: () => api.getBrandCampaignHistory(),
    staleTime: 60_000,
  });

  const campaigns: CampaignRow[] = data?.campaigns ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bento-card p-4 h-14 animate-pulse bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="bento-card p-8 text-center text-chalk-dim text-sm">
        No past campaigns yet.{" "}
        <Link to="/brand/create-campaign" className="text-gold hover:underline">Create one →</Link>
      </div>
    );
  }

  const chartData = campaigns.slice(0, 6).map((c) => ({
    name: c.title.length > 14 ? c.title.slice(0, 12) + "…" : c.title,
    spend: c.totalSpend,
  }));

  return (
    <div className="space-y-4">
      <div className="bento-card p-4">
        <p className="text-xs text-chalk-dim mb-3">Top Campaigns by Spend</p>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} />
            <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Spend"]}
              contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
            />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-display font-bold text-chalk text-sm">Past Campaigns</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/5">
              {["Campaign", "Started", "Deadline", "Creators", "Completed", "Spend"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-chalk-faint font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="px-4 py-2.5 text-chalk max-w-[140px] truncate">
                  <Link to={`/brand/campaigns/${c.id}/track`} className="hover:text-gold transition-colors">{c.title}</Link>
                </td>
                <td className="px-4 py-2.5 text-chalk-dim">{new Date(c.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-2.5 text-chalk-dim">{c.deadline ? new Date(c.deadline).toLocaleDateString("en-IN") : "—"}</td>
                <td className="px-4 py-2.5 text-chalk">{c.accepted}</td>
                <td className="px-4 py-2.5 text-chalk">{c.completed}</td>
                <td className="px-4 py-2.5 text-chalk">₹{c.totalSpend.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
