import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "@/lib/api";

export function EarningsChart() {
  const { data, isLoading } = useQuery<{ monthly: Array<{ month: string; earnings: number; proposals: number }> }>({
    queryKey: ["monthly-analytics"],
    queryFn: () => api.getMonthlyAnalytics(),
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return <div className="h-28 rounded-xl bg-white/5 animate-pulse" />;
  }

  const monthly = data?.monthly ?? [];
  const hasData = monthly.some((m) => m.earnings > 0);

  if (!hasData) {
    return (
      <p className="text-xs text-chalk-faint text-center py-6">No earnings data yet.</p>
    );
  }

  const max = Math.max(...monthly.map((m) => m.earnings));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={monthly} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Earnings"]}
          contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
        />
        <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
          {monthly.map((entry, i) => (
            <Cell key={i} fill={entry.earnings === max ? "#f5c518" : "rgba(124,58,237,0.6)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
