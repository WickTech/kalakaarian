import { useQuery } from "@tanstack/react-query";
import { Star, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { EarningsChart } from "./EarningsChart";

interface Props {
  stats: { earnings: number };
}

export function InfluencerAnalyticsPanel({ stats }: Props) {
  const { data: deep } = useQuery({
    queryKey: ["influencer-deep-analytics"],
    queryFn: () => api.getInfluencerDeepAnalytics(),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento-card p-4 text-center">
          <p className="result-numeral text-xl">₹{stats.earnings.toLocaleString("en-IN")}</p>
          <p className="text-xs text-chalk-dim mt-1">Total Earned</p>
        </div>
        {deep && (
          <div className="bento-card p-4 text-center">
            <p className="result-numeral text-xl">{deep.completionRate}%</p>
            <p className="text-xs text-chalk-dim mt-1">Completion Rate</p>
          </div>
        )}
      </div>

      {deep?.avgRating && (
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

      <div className="bento-card p-4">
        <p className="text-xs text-chalk-dim mb-3">Monthly Earnings (last 6 months)</p>
        <EarningsChart />
      </div>
    </div>
  );
}
