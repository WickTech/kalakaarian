import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ShieldCheck, Instagram, Youtube } from "lucide-react";
import { api, Proposal } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useConnectedPlatforms } from "@/hooks/useConnectedPlatforms";
import { RecommendedCampaigns } from "./RecommendedCampaigns";
import { EarningsChart } from "./EarningsChart";
import { BrandCollabHistory } from "./BrandCollabHistory";
import { PlatformAnalyticsTab } from "./PlatformAnalyticsTab";

const STATUS_STYLE: Record<string, string> = {
  submitted: "text-gold border-gold/30",
  accepted: "text-green-400 border-green-400/30",
  rejected: "text-red-400 border-red-400/30",
};

interface Props {
  proposals: Proposal[];
  stats: { total: number; accepted: number; earnings: number };
}

type PlatformTab = "overview" | "instagram" | "youtube";

export function InfluencerAnalyticsPanel({ proposals, stats }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [platformTab, setPlatformTab] = useState<PlatformTab>("overview");

  useEffect(() => {
    const ig = searchParams.get('ig_connected');
    const yt = searchParams.get('yt_connected');
    const igErr = searchParams.get('ig_error');
    const ytErr = searchParams.get('yt_error');
    if (ig || yt) {
      const platform: PlatformTab = ig ? 'instagram' : 'youtube';
      toast({ title: `${ig ? 'Instagram' : 'YouTube'} connected!`, description: 'Real audience analytics are now active.' });
      setPlatformTab(platform);
      queryClient.invalidateQueries({ queryKey: ['connected-platforms'] });
      navigate('/influencer/dashboard?tab=analytics', { replace: true });

      const start = Date.now();
      const id = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['connected-platforms'] });
        queryClient.invalidateQueries({ queryKey: ['platform-metrics', platform] });
        if (Date.now() - start >= 30_000) window.clearInterval(id);
      }, 5_000);
      return () => window.clearInterval(id);
    } else if (igErr || ytErr) {
      toast({ title: `${igErr ? 'Instagram' : 'YouTube'} connection failed`, description: 'Make sure you have the right account type and try again.', variant: 'destructive' });
      navigate('/influencer/dashboard?tab=analytics', { replace: true });
    }
  }, []);

  const { data: platforms } = useConnectedPlatforms();

  const { data: deep } = useQuery({
    queryKey: ["influencer-deep-analytics"],
    queryFn: () => api.getInfluencerDeepAnalytics(),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          { key: "overview", label: "Overview" },
          { key: "instagram", label: "Instagram", icon: Instagram },
          { key: "youtube", label: "YouTube", icon: Youtube },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setPlatformTab(key as PlatformTab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              platformTab === key ? "bg-purple-600 text-white" : "border border-white/10 text-chalk-dim hover:text-chalk"
            }`}
          >
            {Icon && <Icon className="w-3 h-3" />}
            {label}
          </button>
        ))}
      </div>

      {platformTab === "overview" && (
        <>
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

          <div className="bento-card p-4">
            <p className="text-xs text-chalk-dim mb-3">Monthly Earnings (last 6 months)</p>
            <EarningsChart />
          </div>

          <RecommendedCampaigns />
        </>
      )}

      {platformTab === "instagram" && <PlatformAnalyticsTab platform="instagram" status={platforms?.instagram} />}
      {platformTab === "youtube"   && <PlatformAnalyticsTab platform="youtube"   status={platforms?.youtube} />}

      <BrandCollabHistory proposals={proposals} />

      <div className="bento-card overflow-hidden">
        <div className="p-4 border-b border-white/5"><h2 className="font-display font-bold text-chalk text-sm">All Proposals</h2></div>
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
                    <Link to={`/proposals/${p._id}`} className="hover:text-purple-400 transition-colors">{p.campaignTitle || "—"}</Link>
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
