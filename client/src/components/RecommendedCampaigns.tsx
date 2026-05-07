import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

export function RecommendedCampaigns() {
  const { data: campaigns = [] } = useQuery({
    queryKey: ["recommended-campaigns"],
    queryFn: () => api.getRecommendedCampaigns(),
    staleTime: 5 * 60_000,
  });

  if (campaigns.length === 0) return null;

  return (
    <div className="bento-card overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <h2 className="font-display font-bold text-chalk text-sm">Campaigns for You</h2>
      </div>
      <div className="divide-y divide-white/5">
        {campaigns.map((c: any) => (
          <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-chalk truncate">{c.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {(c.niches || [])[0] && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30 text-purple-400">
                    {c.niches[0]}
                  </span>
                )}
                {c.budget && (
                  <span className="text-[10px] text-chalk-dim">
                    ₹{c.budget.toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            </div>
            <Link to={`/campaign/${c.id}`}
              className="flex-shrink-0 text-xs text-gold hover:underline">
              View →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
